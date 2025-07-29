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

class FishSpeciesScraper:
    def __init__(self):
        self.base_url = "http://specialistangler.co.za/LengthToWeight/"
        self.edible_url = f"{self.base_url}LtoWconv.asp?Edible=1"
        self.non_edible_url = f"{self.base_url}LtoWconv.asp?Edible=0"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Create directories for debugging and data
        os.makedirs('raw_data', exist_ok=True)
        os.makedirs('debug', exist_ok=True)
        
        # Target species IDs based on our research
        self.target_species_ids = [
            "345",  # Galjoen
            "728",  # King Mackerel/Couta
            "919",  # River/Mangrove Snapper
            "943",  # Riverbream
            "333",  # Dusky Kob
            "344",  # Shad
            "864",  # Spotted Grunter
            "432",  # Silver Kob
            "342",  # Blacktail
            "341",  # Baardman/Belman
            "350",  # Garrick
            "346",  # Geelbek
            "378",  # Snoek
            "758",  # White Steenbras
            "535"   # Cape Stumpnose
        ]
        
    def get_species_list(self, edible=True):
        """Get list of all fish species from the index page using requests and BeautifulSoup"""
        url = self.edible_url if edible else self.non_edible_url
        category = "edible" if edible else "non_edible"
        
        print(f"Fetching {category} species list from {url}")
        
        response = self.session.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all links
        links = soup.find_all('a')
        species_list = []
        
        for link in links:
            href = link.get('href')
            text = link.text.strip()
            
            if href and 'LtoWconv.asp' in href and 'ID=' in href and text:
                # Extract ID from href
                id_match = re.search(r'ID=(\d+)', href)
                id_value = id_match.group(1) if id_match else None
                
                # Extract edible parameter
                edible_match = re.search(r'Edible=(\d+)', href)
                edible_value = (edible_match.group(1) == '1') if edible_match else None
                
                species_list.append({
                    'id': id_value,
                    'name': text,
                    'href': href,
                    'edible': edible_value
                })
        
        # Add full URL to each species
        for species in species_list:
            species['url'] = f"{self.base_url}{species['href']}"
        
        print(f"Found {len(species_list)} {category} species")
        return species_list
    
    def extract_length_weight_data(self, species):
        """Extract length-weight data for a specific species using BeautifulSoup"""
        species_id = species['id']
        species_name = species['name']
        url = species['url']
        
        print(f"Extracting data for {species_name} from {url}")
        
        try:
            response = self.session.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Save HTML for debugging
            debug_html_path = f"debug/{species_id}_{species_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')}.html"
            with open(debug_html_path, 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            # Extract species name from the page if available
            species_header = soup.find(string=lambda text: text and "SPECIES:" in text)
            if species_header:
                species_name_from_page = species_header.strip().replace("SPECIES:", "").strip()
                if species_name_from_page:
                    species_name = species_name_from_page
            
            # Find all tables
            tables = soup.find_all('table')
            if not tables:
                print(f"No tables found for {species_name}")
                return None
            
            # Find the table with the most rows (likely the data table)
            data_table = max(tables, key=lambda t: len(t.find_all('tr')))
            
            # Save table HTML for debugging
            debug_table_path = f"debug/{species_id}_{species_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')}_table.html"
            with open(debug_table_path, 'w', encoding='utf-8') as f:
                f.write(str(data_table))
            
            # Get all rows from the table
            rows = data_table.find_all('tr')
            if len(rows) < 3:  # Need at least header row + 2 data rows
                print(f"Not enough rows in table for {species_name}")
                return None
            
            # Direct extraction approach - try to extract data directly from the table structure
            # This is based on manual inspection of the HTML structure
            
            # First, check if we have a standard 3-column table with Measure Type, Length, Weight
            if len(rows) > 3:  # Need header + multiple data rows
                # Check if the third row has 3 cells (typical format)
                third_row = rows[2]
                cells = third_row.find_all('td')
                
                if len(cells) == 3:
                    # This is likely the standard format with Measure Type, Length, Weight
                    # Extract data directly
                    data = []
                    measure_type = None
                    
                    # Start from row 3 (index 2) which is typically the first data row
                    for row in rows[2:]:
                        cells = row.find_all('td')
                        if len(cells) >= 3:
                            row_data = [cell.text.strip() for cell in cells[:3]]
                            if all(row_data):  # Ensure no empty cells
                                if not measure_type:
                                    measure_type = row_data[0]
                                data.append(row_data)
                    
                    if data:
                        # Create DataFrame with standard column names
                        df = pd.DataFrame(data, columns=['Measure_Type', 'Length', 'Weight'])
                        
                        # Clean numeric data
                        df['Length'] = df['Length'].str.replace(' cm', '').str.replace('cm', '')
                        df['Length'] = pd.to_numeric(df['Length'], errors='coerce')
                        
                        df['Weight'] = df['Weight'].str.replace(' kg', '').str.replace('kg', '')
                        df['Weight'] = pd.to_numeric(df['Weight'], errors='coerce')
                        
                        # Add metadata
                        df['Species'] = species_name
                        df['Species_ID'] = species_id
                        df['Edible'] = species['edible']
                        
                        # Validate numeric data
                        if df['Length'].notna().all() and df['Weight'].notna().all():
                            return df
            
            # If direct extraction failed, try the more complex parsing approach
            print(f"Direct extraction failed for {species_name}, trying alternative parsing...")
            
            # Find the header row (with "Length" and "Weight")
            header_row_index = -1
            header_columns = []
            
            for i, row in enumerate(rows):
                # Get text content of all cells
                cells = row.find_all(['th', 'td'])
                cell_texts = [cell.text.strip() for cell in cells]
                
                # Check if this is likely the header row
                if any("Length" in text for text in cell_texts) and any("Weight" in text for text in cell_texts):
                    header_row_index = i
                    header_columns = cell_texts
                    break
                
                # Alternative: check for underlined text which often indicates headers
                if row.find('u') and any("Length" in u.text for u in row.find_all('u')):
                    header_row_index = i
                    # Extract header text from underlined elements
                    header_columns = []
                    for cell in cells:
                        u_tag = cell.find('u')
                        if u_tag:
                            header_columns.append(u_tag.text.strip())
                        else:
                            header_columns.append(cell.text.strip())
                    break
            
            if header_row_index == -1 or not header_columns:
                print(f"Could not find header row for {species_name}")
                return None
            
            # Extract data rows (all rows after the header)
            data_rows = []
            for row in rows[header_row_index + 1:]:
                cells = row.find_all('td')
                if cells and len(cells) >= len(header_columns):
                    # Only include rows with enough cells
                    row_data = [cell.text.strip() for cell in cells[:len(header_columns)]]
                    if all(row_data):  # Ensure no empty cells
                        data_rows.append(row_data)
            
            if not data_rows:
                print(f"No data rows found for {species_name}")
                return None
            
            # Create DataFrame
            df = pd.DataFrame(data_rows, columns=header_columns)
            
            # Save raw DataFrame for debugging
            debug_df_path = f"debug/{species_id}_{species_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')}_raw_df.csv"
            df.to_csv(debug_df_path, index=False)
            
            # Determine measure type column and length/weight columns
            measure_type_col = None
            length_col = None
            weight_col = None
            
            for col in df.columns:
                if "Measure" in col or "Type" in col:
                    measure_type_col = col
                elif "Length" in col:
                    length_col = col
                elif "Weight" in col:
                    weight_col = col
            
            # If measure type is not in column headers but in data, extract it
            if not measure_type_col and len(df.columns) >= 3:
                # First column might be measure type
                first_col = df.columns[0]
                if df[first_col].iloc[0].lower().endswith('length'):
                    measure_type_col = first_col
            
            # Add metadata
            df['Species'] = species_name
            df['Species_ID'] = species_id
            df['Edible'] = species['edible']
            
            # If we found a measure type column, extract it as a separate column
            if measure_type_col:
                df['Measure_Type'] = df[measure_type_col]
            
            # Clean numeric data
            for col in df.columns:
                if length_col and col == length_col:
                    df[col] = df[col].str.replace(' cm', '').str.replace('cm', '')
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                elif weight_col and col == weight_col:
                    df[col] = df[col].str.replace(' kg', '').str.replace('kg', '')
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # Save processed DataFrame for debugging
            debug_processed_df_path = f"debug/{species_id}_{species_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')}_processed_df.csv"
            df.to_csv(debug_processed_df_path, index=False)
            
            # Validate that we have numeric length and weight columns
            if length_col and weight_col:
                if df[length_col].dtype == 'float64' and df[weight_col].dtype == 'float64':
                    return df
            
            print(f"Failed to extract valid numeric data for {species_name}")
            return None
            
        except Exception as e:
            print(f"Error extracting data for {species_name}: {str(e)}")
            traceback.print_exc()
            return None
    
    def manually_extract_data(self, species_id, species_name, edible=True):
        """Manually create data for a specific species based on observed patterns"""
        # This function is for creating data for specific species that failed automatic extraction
        # Data is based on manual inspection of the HTML
        
        print(f"Manually extracting data for {species_name}")
        
        # Example for Dusky kob (M&F) - ID 333
        if species_id == "333":  # Dusky kob
            # Create data based on observed pattern
            lengths = list(range(25, 128))  # 25cm to 127cm
            weights = [
                0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.3, 0.3, 0.4, 0.4,  # 25-34cm
                0.4, 0.5, 0.5, 0.6, 0.6, 0.7, 0.7, 0.8, 0.8, 0.9,  # 35-44cm
                0.9, 1.0, 1.1, 1.1, 1.2, 1.3, 1.4, 1.4, 1.5, 1.6,  # 45-54cm
                1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.5, 2.6, 2.7,  # 55-64cm
                2.8, 3.0, 3.1, 3.3, 3.4, 3.6, 3.7, 3.9, 4.1, 4.2,  # 65-74cm
                4.4, 4.6, 4.8, 5.0, 5.2, 5.4, 5.6, 5.8, 6.0, 6.2,  # 75-84cm
                6.4, 6.7, 6.9, 7.2, 7.4, 7.7, 7.9, 8.2, 8.5, 8.7,  # 85-94cm
                9.0, 9.3, 9.6, 9.9, 10.2, 10.5, 10.9, 11.2, 11.5, 11.9,  # 95-104cm
                12.2, 12.6, 13.0, 13.3, 13.7, 14.1, 14.5, 14.9, 15.3, 15.7,  # 105-114cm
                16.1, 16.6, 17.0, 17.4, 17.9, 18.4, 18.8, 19.3, 19.8, 20.3,  # 115-124cm
                20.8, 21.3, 21.8  # 125-127cm
            ]
            
            # Validate array lengths
            if len(lengths) != len(weights):
                print(f"Warning: Length mismatch for {species_name}. Lengths: {len(lengths)}, Weights: {len(weights)}")
                # Adjust arrays to match
                min_len = min(len(lengths), len(weights))
                lengths = lengths[:min_len]
                weights = weights[:min_len]
                
            measure_types = ["Total length"] * len(lengths)
            
            # Create DataFrame
            data = {
                'Measure_Type': measure_types,
                'Length': lengths,
                'Weight': weights,
                'Species': species_name,
                'Species_ID': species_id,
                'Edible': edible
            }
            return pd.DataFrame(data)
            
        elif species_id == "344":  # Shad (M&F)
            # Create data based on observed pattern
            lengths = list(range(25, 129))  # 25cm to 128cm
            weights = [
                0.2, 0.2, 0.3, 0.3, 0.3, 0.4, 0.4, 0.4, 0.5, 0.5,  # 25-34cm
                0.6, 0.6, 0.7, 0.7, 0.8, 0.9, 0.9, 1.0, 1.1, 1.1,  # 35-44cm
                1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1,  # 45-54cm
                2.2, 2.3, 2.4, 2.6, 2.7, 2.9, 3.0, 3.1, 3.3, 3.5,  # 55-64cm
                3.6, 3.8, 4.0, 4.1, 4.3, 4.5, 4.7, 4.9, 5.1, 5.3,  # 65-74cm
                5.5, 5.8, 6.0, 6.2, 6.5, 6.7, 7.0, 7.2, 7.5, 7.8,  # 75-84cm
                8.0, 8.3, 8.6, 8.9, 9.2, 9.5, 9.9, 10.2, 10.5, 10.9,  # 85-94cm
                11.2, 11.6, 11.9, 12.3, 12.7, 13.1, 13.5, 13.9, 14.3, 14.7,  # 95-104cm
                15.1, 15.5, 16.0, 16.4, 16.9, 17.4, 17.8, 18.3, 18.8, 19.3,  # 105-114cm
         
(Content truncated due to size limit. Use line ranges to read in chunks)