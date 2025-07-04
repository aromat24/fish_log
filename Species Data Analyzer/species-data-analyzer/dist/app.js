"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("./services/database");
const speciesAnalyzer_1 = require("./services/speciesAnalyzer");
const database_2 = require("./services/database");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json());
// Connect to the database
(0, database_1.connectToDatabase)()
    .then(() => {
    console.log('Database connected successfully');
})
    .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
});
// Initialize SpeciesAnalyzer
const speciesAnalyzer = new speciesAnalyzer_1.SpeciesAnalyzer();
const db = new database_2.DatabaseService();
class App {
    constructor() {
        this.speciesAnalyzer = speciesAnalyzer;
        this.db = db;
    }
    async onCatchAdded(catchData) {
        try {
            // Analyze species data after each catch
            const updatedSpecies = await this.speciesAnalyzer.analyzeSpecies(catchData.species);
            if (updatedSpecies) {
                // Update UI with new formula if confidence is high enough
                this.updateSpeciesFormulaDisplay(updatedSpecies);
            }
        }
        catch (error) {
            console.error('Error processing new catch data:', error);
        }
    }
    updateSpeciesFormulaDisplay(species) {
        const formulaDisplay = document.getElementById('species-formula');
        if (formulaDisplay) {
            const confidencePercent = Math.round(species.confidence * 100);
            formulaDisplay.innerHTML = `
                <div class="formula-info">
                    <h3>${species.name} Length-Weight Formula</h3>
                    <p>Weight = ${species.a.toFixed(6)} × Length<sup>${species.b.toFixed(3)}</sup></p>
                    <p class="confidence">Confidence: ${confidencePercent}%</p>
                    <p class="update-time">Last updated: ${new Date(species.lastUpdated).toLocaleString()}</p>
                </div>
            `;
        }
    }
    async calculateEstimatedWeight(species, length) {
        try {
            const speciesData = await this.db.getSpecies(species);
            if (!speciesData) {
                return null;
            }
            return speciesData.a * Math.pow(length, speciesData.b);
        }
        catch (error) {
            console.error('Error calculating estimated weight:', error);
            return null;
        }
    }
    // Method to initialize the app and set up event listeners
    async init() {
        // Set up catch form submission handler
        const catchForm = document.getElementById('catch-form');
        if (catchForm) {
            catchForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const formData = new FormData(catchForm);
                const catchData = {
                    id: crypto.randomUUID(),
                    species: formData.get('species'),
                    length: parseFloat(formData.get('length')),
                    weight: parseFloat(formData.get('weight')),
                    datetime: formData.get('datetime'),
                    notes: formData.get('notes'),
                    locationName: formData.get('location')
                };
                await this.onCatchAdded(catchData);
            });
        }
        // Set up length input handler for weight estimation
        const lengthInput = document.getElementById('length');
        const speciesSelect = document.getElementById('species');
        if (lengthInput && speciesSelect) {
            lengthInput.addEventListener('input', async () => {
                const length = parseFloat(lengthInput.value);
                const species = speciesSelect.value;
                if (length && species) {
                    const estimatedWeight = await this.calculateEstimatedWeight(species, length);
                    if (estimatedWeight) {
                        const weightInput = document.getElementById('weight');
                        if (weightInput) {
                            weightInput.value = estimatedWeight.toFixed(2);
                        }
                    }
                }
            });
        }
    }
}
// Example route to log a new catch
app.post('/api/catch', async (req, res) => {
    const { species, length, weight } = req.body;
    try {
        await speciesAnalyzer.logCatch(species, length, weight);
        res.status(201).send({ message: 'Catch logged successfully' });
    }
    catch (error) {
        res.status(400).send({ error: error.message });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=app.js.map