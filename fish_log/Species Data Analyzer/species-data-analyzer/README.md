# species-data-analyzer

## Overview
The Species Data Analyzer is a TypeScript application designed to manage and analyze species data, specifically focusing on the length/weight ratios of various species based on catch records. The application allows users to log catches, update species data, and generate formulas for calculating length/weight ratios.

## Features
- Log new catch records with species, length, and weight.
- Automatically update species length/weight ratios based on new catch submissions.
- Generate formulas for calculating length/weight ratios using input data from initial submissions.
- Validate input data to ensure data integrity.

## Project Structure
```
species-data-analyzer
├── src
│   ├── app.ts                # Entry point of the application
│   ├── models
│   │   ├── species.ts        # Represents a species in the database
│   │   └── catch.ts          # Represents a catch record
│   ├── services
│   │   ├── database.ts       # Functions to interact with the database
│   │   ├── speciesAnalyzer.ts # Analyzes species data and updates ratios
│   │   └── formulaGenerator.ts # Generates formulas for length/weight ratios
│   ├── utils
│   │   ├── mathHelpers.ts    # Utility functions for mathematical calculations
│   │   └── dataValidator.ts   # Functions to validate input data
│   └── types
│       └── index.ts          # TypeScript interfaces for the project
├── tests
│   └── services
│       ├── speciesAnalyzer.test.ts # Unit tests for SpeciesAnalyzer
│       └── formulaGenerator.test.ts # Unit tests for formulaGenerator
├── package.json               # npm configuration file
├── tsconfig.json              # TypeScript configuration file
└── README.md                  # Project documentation
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd species-data-analyzer
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Start the application:
   ```
   npm start
   ```
2. Use the API endpoints to log catches and manage species data.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.