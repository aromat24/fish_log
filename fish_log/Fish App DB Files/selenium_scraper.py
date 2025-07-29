import json
import os
import time
import pandas as pd
import numpy as np
import sqlite3
import requests
from bs4 import BeautifulSoup

class FishSpeciesScraper:
    def __init__(self):
        self.base_url = "http://specialistangler.co.za/LengthToWeight/"
        self.edible_url = f"{self.base_url}LtoWconv.asp?Edible=1"
        self.non_edible_url = f"{self.base_url}LtoWconv.asp?Edible=0"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
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
                import re
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
            
            # Find all tables and select the one with the most rows (likely the data table)
            tables = soup.find_all('table')
            data_table = None
            max_rows = 0
            
            for table in tables:
                rows = table.find_all('tr')
                if len(rows) > max_rows:
                    max_rows = len(rows)
                    data_table = table
            
            if not data_table:
                print(f"No data table found for {species_name}")
                return None
            
            # Extract headers
            headers = []
            header_row = data_table.find('tr')
            if header_row:
                for cell in header_row.find_all(['th', 'td']):
                    headers.append(cell.text.strip())
            
            # Extract data rows
            rows = []
            data_rows = data_table.find_all('tr')[1:] if header_row else data_table.find_all('tr')
            for row in data_rows:
                cells = [cell.text.strip() for cell in row.find_all('td')]
                if cells:
                    rows.append(cells)
            
            # Extract measure type
            measure_type = "Unknown"
            measure_type_text = soup.find(string=lambda text: text and "Measure Type" in text)
            if measure_type_text:
                measure_row = measure_type_text.find_parent('tr')
                if measure_row:
                    measure_cells = measure_row.find_all('td')
                    if measure_cells and len(measure_cells) > 0:
                        measure_type = measure_cells[0].text.strip()
            
            table_data = {
                'headers': headers,
                'rows': rows,
                'measureType': measure_type
            }
            
            if not table_data:
                print(f"No data table found for {species_name}")
                return None
                
            # Create DataFrame
            if headers and len(headers) >= 2:
                df = pd.DataFrame(rows, columns=headers)
            else:
                # If headers are not properly detected, create default headers
                if rows and len(rows[0]) >= 2:
                    df = pd.DataFrame(rows, columns=['Length', 'Weight'])
                else:
                    print(f"Invalid data format for {species_name}")
                    return None
            
            # Add metadata
            df['Species'] = species_name
            df['Measure_Type'] = measure_type
            df['Edible'] = species['edible']
            df['Species_ID'] = species_id
            
            # Clean numeric data
            for col in df.columns:
                if col in ['Length', 'Weight']:
                    df[col] = df[col].str.replace(' cm', '').str.replace(' kg', '')
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                
            return df
            else:
                # If headers are not properly detected, create default headers
                if rows and len(rows[0]) >= 2:
                    df = pd.DataFrame(rows, columns=['Length', 'Weight'])
                else:
                    print(f"Invalid data format for {species_name}")
                    return None
            
            # Add metadata
            df['Species'] = species_name
            df['Measure_Type'] = measure_type
            df['Edible'] = species['edible']
            df['Species_ID'] = species_id
            
            # Clean numeric data
            for col in df.columns:
                if col in ['Length', 'Weight']:
                    df[col] = df[col].str.replace(' cm', '').str.replace(' kg', '')
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                
            return df
            
        except Exception as e:
            print(f"Error extracting data for {species_name}: {str(e)}")
            return None
    
    def calculate_length_weight_algorithm(self, df):
        """Calculate length-weight relationship algorithm for a species"""
        try:
            if df is None or len(df) < 3:
                return None
                
            # Standard length-weight relationship: W = a * L^b
            # Taking log: log(W) = log(a) + b * log(L)
            
            # Filter out zero or negative values
            filtered_df = df[(df['Length'] > 0) & (df['Weight'] > 0)]
            
            if len(filtered_df) < 3:
                return None
                
            # Log transform
            log_length = np.log(filtered_df['Length'])
            log_weight = np.log(filtered_df['Weight'])
            
            # Linear regression
            slope, intercept = np.polyfit(log_length, log_weight, 1)
            
            # Calculate a and b parameters
            a = np.exp(intercept)
            b = slope
            
            # Calculate R-squared
            log_weight_pred = intercept + slope * log_length
            ss_total = np.sum((log_weight - np.mean(log_weight)) ** 2)
            ss_residual = np.sum((log_weight - log_weight_pred) ** 2)
            r_squared = 1 - (ss_residual / ss_total)
            
            return {
                'formula': 'W = a * L^b',
                'a': a,
                'b': b,
                'r_squared': r_squared
            }
            
        except Exception as e:
            print(f"Error calculating algorithm: {str(e)}")
            return None
    
    def scrape_all_species(self):
        """Scrape data for all fish species"""
        # Get all species lists
        edible_species = self.get_species_list(edible=True)
        non_edible_species = self.get_species_list(edible=False)
        all_species = edible_species + non_edible_species
        
        # Create directory for raw data
        os.makedirs('raw_data', exist_ok=True)
        
        # Save species lists
        with open('raw_data/edible_species.json', 'w') as f:
            json.dump(edible_species, f, indent=2)
        
        with open('raw_data/non_edible_species.json', 'w') as f:
            json.dump(non_edible_species, f, indent=2)
        
        # Extract data for each species
        all_data = []
        algorithms = {}
        
        for i, species in enumerate(all_species):
            print(f"Processing {i+1}/{len(all_species)}: {species['name']}")
            
            # Extract length-weight data
            df = self.extract_length_weight_data(species)
            
            if df is not None:
                # Save raw data for this species
                species_filename = f"raw_data/{species['id']}_{species['name'].replace('/', '_').replace(' ', '_')}.csv"
                df.to_csv(species_filename, index=False)
                
                # Calculate algorithm
                algorithm = self.calculate_length_weight_algorithm(df)
                if algorithm:
                    algorithms[species['id']] = {
                        'species_name': species['name'],
                        'edible': species['edible'],
                        'algorithm': algorithm
                    }
                
                # Add to combined dataset
                all_data.append(df)
            
            # Be nice to the server
            time.sleep(1)
        
        # Combine all data
        if all_data:
            combined_df = pd.concat(all_data, ignore_index=True)
            combined_df.to_csv('all_fish_species_data.csv', index=False)
            
            # Save algorithms
            with open('fish_algorithms.json', 'w') as f:
                json.dump(algorithms, f, indent=2)
            
            return combined_df, algorithms
        else:
            print("No data extracted")
            return None, None
    
    def close(self):
        """Close the browser"""
        if self.driver:
            self.driver.quit()

if __name__ == "__main__":
    print("Starting fish species data extraction...")
    scraper = FishSpeciesScraper()
    
    try:
        df, algorithms = scraper.scrape_all_species()
        
        if df is not None:
            print(f"Successfully extracted data for {len(algorithms)} species")
            print(f"Total data points: {len(df)}")
            
            # Create Excel file
            print("Creating Excel database...")
            with pd.ExcelWriter('fish_species_database.xlsx') as writer:
                df.to_excel(writer, sheet_name='Length_Weight_Data', index=False)
                
                # Create algorithms sheet
                algo_data = []
                for species_id, data in algorithms.items():
                    algo_data.append({
                        'Species_ID': species_id,
                        'Species_Name': data['species_name'],
                        'Edible': data['edible'],
                        'Formula': data['algorithm']['formula'],
                        'a_parameter': data['algorithm']['a'],
                        'b_parameter': data['algorithm']['b'],
                        'R_squared': data['algorithm']['r_squared']
                    })
                
                if algo_data:
                    algo_df = pd.DataFrame(algo_data)
                    algo_df.to_excel(writer, sheet_name='Algorithms', index=False)
            
            # Create SQL database
            print("Creating SQL database...")
            conn = sqlite3.connect('fish_species_database.db')
            
            # Create tables
            df.to_sql('length_weight_data', conn, if_exists='replace', index=False)
            
            # Create algorithms table
            if algo_data:
                algo_df = pd.DataFrame(algo_data)
                algo_df.to_sql('algorithms', conn, if_exists='replace', index=False)
            
            conn.close()
            
            print("Data extraction and database creation completed successfully!")
        else:
            print("Failed to extract fish species data")
    finally:
        scraper.close()
