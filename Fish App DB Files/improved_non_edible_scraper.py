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
        
    def get_species_list(self, edible=False):
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
            
            # IMPROVED EXTRACTION APPROACH 1: Look for table with SPECIES: header
            species_table = None
            for table in tables:
                if table.find(string=lambda text: text and "SPECIES:" in text):
                    species_table = table
                    break
            
            if species_table:
                # This is likely the main data table
                rows = species_table.find_all('tr')
                
                # Find the header row with Measure Type, Length, Weight
                header_row = None
                header_row_index = -1
                
                for i, row in enumerate(rows):
                    # Check for bold and underlined text which often indicates headers
                    if row.find('u') or row.find('b'):
                        cell_texts = [cell.text.strip() for cell in row.find_all(['td', 'th'])]
                        if any("Length" in text for text in cell_texts) and any("Weight" in text for text in cell_texts):
                            header_row = row
                            header_row_index = i
                            break
                
                if header_row and header_row_index >= 0:
                    # Extract header columns
                    header_cells = header_row.find_all(['td', 'th'])
                    header_columns = []
                    
                    for cell in header_cells:
                        # Try to find underlined text first
                        u_tag = cell.find('u')
                        if u_tag:
                            header_columns.append(u_tag.text.strip())
                        else:
                            # If no underlined text, use the cell text
                            header_columns.append(cell.text.strip())
                    
                    # Extract data rows (all rows after the header)
                    data_rows = []
                    for row in rows[header_row_index + 1:]:
                        cells = row.find_all('td')
                        if cells and len(cells) >= len(header_columns):
                            # Only include rows with enough cells
                            row_data = [cell.text.strip() for cell in cells[:len(header_columns)]]
                            if all(row_data):  # Ensure no empty cells
                                data_rows.append(row_data)
                    
                    if data_rows:
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
                                # Remove 'cm' and any other non-numeric characters
                                df[col] = df[col].str.replace(' cm', '').str.replace('cm', '')
                                df[col] = df[col].str.replace('<', '').str.replace('>', '')
                                df[col] = df[col].str.replace('b', '').str.replace('/', '')
                                df[col] = pd.to_numeric(df[col], errors='coerce')
                            elif weight_col and col == weight_col:
                                # Remove 'kg' and any other non-numeric characters
                                df[col] = df[col].str.replace(' kg', '').str.replace('kg', '')
                                df[col] = pd.to_numeric(df[col], errors='coerce')
                        
                        # Save processed DataFrame for debugging
                        debug_processed_df_path = f"debug/{species_id}_{species_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')}_processed_df.csv"
                        df.to_csv(debug_processed_df_path, index=False)
                        
                        # Validate that we have numeric length and weight columns
                        if length_col and weight_col:
                            if df[length_col].dtype == 'float64' and df[weight_col].dtype == 'float64':
                                return df
            
            # IMPROVED EXTRACTION APPROACH 2: Direct HTML structure analysis
            # This approach is based on observed patterns in the HTML
            
            # Look for the table structure with 3 columns
            for table in tables:
                rows = table.find_all('tr')
                if len(rows) < 3:
                    continue
                
                # Check if any row has 3 cells
                has_three_columns = False
                for row in rows:
                    cells = row.find_all('td')
                    if len(cells) == 3:
                        has_three_columns = True
                        break
                
                if has_three_columns:
                    # Find the header row
                    header_row = None
                    header_row_index = -1
                    
                    for i, row in enumerate(rows):
                        # Check for bold or underlined text
                        if row.find('b') or row.find('u'):
                            cells = row.find_all('td')
                            if len(cells) == 3:
                                cell_texts = [cell.text.strip() for cell in cells]
                                if any("Length" in text for text in cell_texts) and any("Weight" in text for text in cell_texts):
                                    header_row = row
                                    header_row_index = i
                                    break
                    
                    if header_row and header_row_index >= 0:
                        # Extract header columns
                        header_cells = header_row.find_all('td')
                        header_columns = []
                        
                        for cell in header_cells:
                            # Try to find underlined or bold text first
                            u_tag = cell.find('u')
                            b_tag = cell.find('b')
                            if u_tag:
                                header_columns.append(u_tag.text.strip())
                            elif b_tag:
                                header_columns.append(b_tag.text.strip())
                            else:
                                # If no special formatting, use the cell text
                                header_columns.append(cell.text.strip())
                        
                        # Extract data rows (all rows after the header)
                        data_rows = []
                        for row in rows[header_row_index + 1:]:
                            cells = row.find_all('td')
                            if cells and len(cells) == 3:
                                # Only include rows with 3 cells
                                row_data = [cell.text.strip() for cell in cells]
                                if all(row_data):  # Ensure no empty cells
                                    data_rows.append(row_data)
                        
                        if data_rows:
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
                            
                            # If column names are not clear, use position
                            if not measure_type_col and not length_col and not weight_col:
                                if len(df.columns) == 3:
                                    measure_type_col = df.columns[0]
                                    length_col = df.columns[1]
                                    weight_col = df.columns[2]
                            
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
                                    # Remove 'cm' and any other non-numeric characters
                                    df[col] = df[col].str.replace(' cm', '').str.replace('cm', '')
                                    df[col] = df[col].str.replace('<', '').str.replace('>', '')
                                    df[col] = df[col].str.replace('b', '').str.replace('/', '')
                                    df[col] = pd.to_numeric(df[col], errors='coerce')
                                elif weight_col and col == weight_col:
                           
(Content truncated due to size limit. Use line ranges to read in chunks)