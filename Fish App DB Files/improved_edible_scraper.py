import requests
from bs4 import BeautifulSoup
import pandas as pd
import numpy as np
import json
import os
import time
import sqlite3
import re
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed

class FishSpeciesScraper:
    def __init__(self, base_dir):
        self.base_url = "http://specialistangler.co.za/LengthToWeight/"
        self.edible_url = f"{self.base_url}LtoWconv.asp?Edible=1"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.base_dir = base_dir
        self.raw_data_dir = os.path.join(base_dir, 'raw_data')
        self.debug_dir = os.path.join(base_dir, 'debug')
        self.output_dir = os.path.join(base_dir, 'output')
        
        # Create directories
        os.makedirs(self.raw_data_dir, exist_ok=True)
        os.makedirs(self.debug_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Set up logging
        self.log_file_path = os.path.join(self.output_dir, 'extraction_log.txt')
        with open(self.log_file_path, 'w') as log_f:
            log_f.write(f"Extraction log started at {time.ctime()}\n")
            log_f.write("=" * 80 + "\n\n")
        
    def log_message(self, message):
        """Write a message to the log file"""
        print(message)
        with open(self.log_file_path, 'a') as log_f:
            log_f.write(f"{message}\n")
        
    def get_species_list(self, edible=True):
        """Get list of all fish species from the index page using requests and BeautifulSoup"""
        url = self.edible_url if edible else f"{self.base_url}LtoWconv.asp?Edible=0"
        category = "edible" if edible else "non_edible"
        
        self.log_message(f"Fetching {category} species list from {url}")
        
        try:
            response = self.session.get(url)
            response.raise_for_status() # Ensure we got a successful response
            soup = BeautifulSoup(response.text, 'html.parser')
            
            links = soup.find_all('a')
            species_list = []
            
            for link in links:
                href = link.get('href')
                text = link.text.strip()
                
                if href and 'LtoWconv.asp' in href and 'ID=' in href and text:
                    id_match = re.search(r'ID=(\d+)', href)
                    id_value = id_match.group(1) if id_match else None
                    
                    edible_match = re.search(r'Edible=(\d+)', href)
                    edible_value_param = (edible_match.group(1) == '1') if edible_match else None
                    
                    # Ensure we are only adding species that match the 'edible' parameter of the main page
                    if (edible and edible_value_param is True) or (not edible and edible_value_param is False) or edible_value_param is None:
                        species_list.append({
                            'id': id_value,
                            'name': text,
                            'href': href,
                            'edible': edible # Use the function's edible parameter
                        })
            
            for species in species_list:
                species['url'] = f"{self.base_url}{species['href']}"
            
            self.log_message(f"Found {len(species_list)} {category} species")
            
            # Save the species list to a JSON file
            species_list_path = os.path.join(self.raw_data_dir, f'{category}_species_list.json')
            with open(species_list_path, 'w') as f:
                json.dump(species_list, f, indent=2)
                
            return species_list
            
        except Exception as e:
            self.log_message(f"Error fetching species list: {str(e)}")
            traceback.print_exc()
            return []
    
    def extract_length_weight_data(self, species):
        """Extract length-weight data for a specific species"""
        species_id = species['id']
        species_name = species['name']
        url = species['url']
        
        self.log_message(f"Extracting data for {species_name} (ID: {species_id}) from {url}")

        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Save HTML for debugging
            debug_html_path = os.path.join(self.debug_dir, f"{species_id}_{species_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')}.html")
            with open(debug_html_path, 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            # Extract species name from the page if available
            species_header = soup.find(string=lambda text: text and "SPECIES:" in text)
            if species_header:
                species_name_from_page = species_header.strip().replace("SPECIES:", "").strip()
                if species_name_from_page:
                    species_name = species_name_from_page # Update species name if found on page
                    species['name'] = species_name

            tables = soup.find_all('table')
            if not tables:
                self.log_message(f"No tables found for {species_name}")
                return None

            # Try multiple extraction strategies
            df = None
            strategies = [
                self._extract_strategy_1, 
                self._extract_strategy_2,
                self._extract_strategy_3
            ]

            for i, strategy_func in enumerate(strategies):
                df = strategy_func(tables, species_name, species_id, species['edible'])
                if df is not None and not df.empty:
                    length_col = next((col for col in df.columns if "Length" in col), None)
                    weight_col = next((col for col in df.columns if "Weight" in col), None)
                    if length_col and weight_col and pd.api.types.is_numeric_dtype(df[length_col]) and pd.api.types.is_numeric_dtype(df[weight_col]):
                        self.log_message(f"Strategy {i+1} successful for {species_name}")
                        break # Successful extraction
                df = None # Reset df if strategy failed or didn't produce numeric length/weight
            
            if df is None or df.empty:
                self.log_message(f"All extraction strategies failed for {species_name}")
                return None

            return df
            
        except requests.exceptions.RequestException as e:
            self.log_message(f"Request error extracting data for {species_name}: {str(e)}")
            return None
        except Exception as e:
            self.log_message(f"General error extracting data for {species_name}: {str(e)}")
            traceback.print_exc()
            return None

    def _clean_numeric_column(self, series, unit):
        """Clean a numeric column by removing units and converting to float"""
        series = series.astype(str).str.lower()
        series = series.str.replace(f' {unit}', '', regex=False).str.replace(unit, '', regex=False)
        series = series.str.replace('<', '', regex=False).str.replace('>', '', regex=False)
        series = series.str.replace('b', '', regex=False).str.replace('/', '', regex=False)
        series = series.str.replace(r'[^\d.]', '', regex=True)
        return pd.to_numeric(series, errors='coerce')

    def _process_extracted_table(self, df_raw, species_name, species_id, edible_param):
        """Process an extracted table DataFrame to standardize columns and clean data"""
        if df_raw is None or df_raw.empty:
            return None

        df = df_raw.copy()
        
        # Identify column names
        length_col_name = None
        weight_col_name = None
        measure_type_col_name = None

        for col in df.columns:
            col_lower = str(col).lower()
            if 'length' in col_lower:
                length_col_name = col
            if 'weight' in col_lower:
                weight_col_name = col
            if ('measure' in col_lower or 'type' in col_lower) and 'weight' not in col_lower and 'length' not in col_lower:
                 measure_type_col_name = col
        
        if not length_col_name or not weight_col_name:
            # Fallback: assume 2nd col is length, 3rd is weight if 3 cols exist
            if len(df.columns) == 3:
                if measure_type_col_name is None: measure_type_col_name = df.columns[0]
                length_col_name = df.columns[1]
                weight_col_name = df.columns[2]
            else:
                return None
        
        # Clean numeric columns
        df[length_col_name] = self._clean_numeric_column(df[length_col_name], 'cm')
        df[weight_col_name] = self._clean_numeric_column(df[weight_col_name], 'kg')
        
        # Remove rows with missing data
        df.dropna(subset=[length_col_name, weight_col_name], inplace=True)
        if df.empty:
            return None

        # Add metadata
        df['Species'] = species_name
        df['Species_ID'] = species_id
        df['Edible'] = edible_param
        if measure_type_col_name and measure_type_col_name in df.columns:
            df['Measure_Type'] = df[measure_type_col_name]
        else:
            df['Measure_Type'] = 'Unknown'
        
        # Rename columns to standard names for algorithm calculation
        df.rename(columns={length_col_name: 'Length', weight_col_name: 'Weight'}, inplace=True)
        
        # Select and order columns
        return df[['Species', 'Species_ID', 'Edible', 'Measure_Type', 'Length', 'Weight']]

    def _extract_strategy_1(self, tables, species_name, species_id, edible_param):
        """Strategy 1: Look for table with SPECIES: header, then find header row with Length & Weight"""
        for table in tables:
            if table.find(string=lambda text: text and "SPECIES:" in text):
                rows = table.find_all('tr')
                header_row_index = -1
                header_columns = []

                for i, row in enumerate(rows):
                    cell_texts = [cell.text.strip().lower() for cell in row.find_all(['td', 'th'])]
                    if any("length" in text for text in cell_texts) and any("weight" in text for text in cell_texts):
                        header_row_index = i
                        header_cells = row.find_all(['td', 'th'])
                        for cell in header_cells:
                            u_tag = cell.find('u')
                            header_columns.append(u_tag.text.strip() if u_tag else cell.text.strip())
                        break
                
                if header_row_index >= 0 and header_columns:
                    data_rows = []
                    for row in rows[header_row_index + 1:]:
                        cells = row.find_all('td')
                        if cells and len(cells) >= len(header_columns):
                            row_data = [cell.text.strip() for cell in cells[:len(header_columns)]]
                            if any(row_data): # Accept if at least one cell has data
                                data_rows.append(row_data)
                    
                    if data_rows:
                        try:
                            df_raw = pd.DataFrame(data_rows, columns=header_columns)
                            return self._process_extracted_table(df_raw, species_name, species_id, edible_param)
                        except Exception as e:
                            continue
        return None

    def _extract_strategy_2(self, tables, species_name, species_id, edible_param):
        """Strategy 2: Find table with 3 columns, identify header by bold/underline and Length/Weight keywords"""
        for table in tables:
            rows = table.find_all('tr')
            if len(rows) < 2: continue # Need at least header + 1 data row

            potential_3_col_table = False
            for r_idx, row_check in enumerate(rows):
                if len(row_check.find_all('td')) == 3:
                    potential_3_col_table = True
                    break
            if not potential_3_col_table: continue

            header_row_index = -1
            header_columns = []
            for i, row in enumerate(rows):
                cells = row.find_all('td') # Often 'td' is used for headers too
                if len(cells) == 3:
                    cell_texts = [cell.text.strip().lower() for cell in cells]
                    if (row.find('b') or row.find('u')) and any("length" in text for text in cell_texts) and any("weight" in text for text in cell_texts):
                        header_row_index = i
                        for cell in cells:
                            u_tag, b_tag = cell.find('u'), cell.find('b')
                            header_columns.append(u_tag.text.strip() if u_tag else (b_tag.text.strip() if b_tag else cell.text.strip()))
                        break
            
            if header_row_index >= 0 and header_columns:
                data_rows = []
                for row in rows[header_row_index + 1:]:
                    cells = row.find_all('td')
                    if len(cells) == 3:
                        row_data = [cell.text.strip() for cell in cells]
                        if any(row_data):
                            data_rows.append(row_data)
                if data_rows:
                    try:
                        df_raw = pd.DataFrame(data_rows, columns=header_columns)
                        return self._process_extracted_table(df_raw, species_name, species_id, edible_param)
                    except Exception as e:
                        continue
        return None

    def _extract_strategy_3(self, tables, species_name, species_id, edible_param):
        """Strategy 3: Find any table, try to parse with pandas read_html, then find length/weight cols"""
        for i, table in enumerate(tables):
            try:
                df_list = pd.read_html(str(table), flavor='bs4')
                if not df_list: continue
                df_raw = df_list[0]
                
                # Clean multi-level columns if any
                if isinstance(df_raw.columns, pd.MultiIndex):
                    df_raw.columns = ['_'.join(map(str, col)).strip() for col in df_raw.columns.values]
                
                # Attempt to find length and weight columns by keyword
                length_col = next((col for col in df_raw.columns if 'length' in str(col).lower()), None)
                weight_col = next((col for col in df_raw.columns if 'weight' in str(col).lower()), None)
                
                if length_col and weight_col:
                    return self._process_extracted_table(df_raw, species_name, species_id, edible_param)
            except Exception as e:
                continue
        return None

    def calculate_length_weight_algorithm(self, df):
        """Calculate length-weight relationship algorithm for a species"""
        if df is None or len(df) < 3 or 'Length' not in df.columns or 'Weight' not in df.columns:
            return None
        
        try:
            filtered_df = df[(df['Length'] > 0) & (df['Weight'] > 0)].copy()
            if len(filtered_df) < 3:
                return None
                
            log_length = np.log(filtered_df['Length'])
            log_weight = np.log(filtered_df['Weight'])
            
            slope, intercept = np.polyfit(log_length, log_weight, 1)
            a = np.exp(intercept)
            b = slope
            
            log_weight_pred = intercept + slope * log_length
            ss_total = np.sum((log_weight - np.mean(log_weight)) ** 2)
            if ss_tot
(Content truncated due to size limit. Use line ranges to read in chunks)