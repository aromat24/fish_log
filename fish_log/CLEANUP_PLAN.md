# Fish Log App Cleanup Plan

## Files to DELETE (Redundant/Unnecessary)

### Git Command Artifacts
- `h origin main`
- `hell -NoProfile git status --short`
- `tatus`

### Duplicate Species Data Analyzer
- `species-data-analyzer/` (keep the full TypeScript version in `Species Data Analyzer/`)

### Redundant Fish Algorithm Files
- `Fish App DB Files/fish_algorithms.json` (keep root level `fish_algorithms.json`)
- `Fish App DB Files/merged_fish_algorithms.json`

### Redundant Database Files (Keep Complete Versions Only)
- `Fish App DB Files/fish_species_database.db` (keep complete version)
- `Fish App DB Files/fish_species_database.xlsx` (keep complete version)
- `Fish App DB Files/all_fish_species_data.csv` (keep complete version)
- `Fish App DB Files/merged_fish_species_data.csv`
- `Fish App DB Files/merged_fish_species_database.db`
- `Fish App DB Files/merged_fish_species_database.xlsx`

### Obsolete Scraper Scripts (Keep Final/Improved Versions Only)
- `Fish App DB Files/scraper.py` (keep improved versions)
- `Fish App DB Files/edible_scraper.py` (keep improved version)
- `Fish App DB Files/non_edible_scraper.py` (keep final version)
- `Fish App DB Files/debug_scraper.py`
- `Fish App DB Files/selenium_scraper.py`

### Obsolete Integration Scripts
- `Fish App DB Files/integrate_databases.py` (keep final version)
- `Fish App DB Files/fixed_integrate_databases.py` (keep final version)

### Duplicate Documentation
- `Fish App DB Files/Fish Species Length-to-Weight Database Implementation Guide.md`
- `Fish App DB Files/Fish Species Length-to-Weight Database Implementation Guide (Updated).md`
(Keep: `Fish App DB Files/Fish Species Length-to-Weight Conversion Database Implementation Guide.md`)

## Files to KEEP

### Core Application Files
- `index.html`
- `manifest.json`
- `sw.js`
- `favicon.svg`
- `Splashscreen.jpg`
- `suggestions.jpg`
- `fish_algorithms.json` (root level - main data source)

### Application Code
- `js/app.js`
- `js/fishDatabase.js`
- `js/beautiful-buttons.js`
- `css/beautiful-buttons.css`

### Final Database Files
- `Fish App DB Files/complete_fish_algorithms.json`
- `Fish App DB Files/complete_fish_species_data.csv`
- `Fish App DB Files/complete_fish_species_database.db`
- `Fish App DB Files/complete_fish_species_database.xlsx`

### Final Scripts
- `Fish App DB Files/create_database.py`
- `Fish App DB Files/final_integrate_databases.py`
- `Fish App DB Files/final_non_edible_scraper.py`
- `Fish App DB Files/improved_edible_scraper.py`
- `Fish App DB Files/improved_non_edible_scraper.py`
- `Fish App DB Files/improved_scraper.py`
- `Fish App DB Files/fixed_species_scraper.py`
- `Fish App DB Files/target_species_scraper.py`
- `Fish App DB Files/missing_species_data.py`

### Documentation
- `README.md`
- `PRODUCTION_SETUP.md`
- `MODAL_FIXES_AND_IMAGE_LIMITATIONS.md`
- `Fish App DB Files/Fish Species Length-to-Weight Conversion Database Implementation Guide.md`
- `Fish App DB Files/target_species.md`
- `Fish App DB Files/todo.md`
- `Fish App DB Files/implementation_guide_template.md`

### Complete Species Data Analyzer
- `Species Data Analyzer/species-data-analyzer/` (entire directory)

### Development Files
- `add-test-data.js`
- `test-app.js`
- `_config.yml`
- `# Code Citations.md`
- `fish_log 20-06.code-workspace`

## Estimated Space Savings
- Removing duplicate database files: ~50-100MB
- Removing obsolete scripts: ~5-10MB
- Removing duplicate analyzer: ~10-20MB
- Total estimated savings: ~65-130MB

## Next Steps
1. Create backup of current state
2. Delete redundant files
3. Update any references to deleted files
4. Test application functionality
5. Update documentation
