import express, { Request, Response } from 'express';
import { SpeciesAnalyzer } from './services/speciesAnalyzer';
import { DatabaseService } from './services/database';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize services
const db = new DatabaseService();
const speciesAnalyzer = new SpeciesAnalyzer();

// Initialize Database
await db.openDB()
    .then(() => {
        console.log('Database connected successfully');
    })
    .catch((err: Error) => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });

export class App {
    private speciesAnalyzer: SpeciesAnalyzer;
    private db: DatabaseService;

    constructor() {
        this.speciesAnalyzer = new SpeciesAnalyzer();
        this.db = new DatabaseService();
    }

    async onCatchAdded(catchData: { species: string; length: number; weight: number }): Promise<void> {
        try {
            const result = await this.speciesAnalyzer.analyzeSpecies(catchData.species);
            if (result) {
                this.updateSpeciesFormulaDisplay(result);
            }
        } catch (error) {
            console.error('Error processing new catch data:', error);
        }
    }

    private updateSpeciesFormulaDisplay(species: { 
        name: string; 
        a: number; 
        b: number; 
        confidence?: number; 
        lastUpdated?: string 
    }): void {
        const formulaDisplay = document.getElementById('species-formula');
        if (formulaDisplay) {
            const confidencePercent = species.confidence ? Math.round(species.confidence * 100) : 0;
            formulaDisplay.innerHTML = `
                <div class="formula-info">
                    <h3>${species.name} Length-Weight Formula</h3>
                    <p>Weight = ${species.a.toFixed(6)} × Length<sup>${species.b.toFixed(3)}</sup></p>
                    <p class="confidence">Confidence: ${confidencePercent}%</p>
                    <p class="update-time">Last updated: ${species.lastUpdated ? new Date(species.lastUpdated).toLocaleString() : 'Never'}</p>
                </div>
            `;
        }
    }

    async calculateEstimatedWeight(species: string, length: number): Promise<number | null> {
        try {
            const speciesData = await this.db.getSpecies(species);
            if (!speciesData) {
                return null;
            }

            return speciesData.a * Math.pow(length, speciesData.b);
        } catch (error) {
            console.error('Error calculating estimated weight:', error);
            return null;
        }
    }

    async init(): Promise<void> {
        const catchForm = document.getElementById('catch-form') as HTMLFormElement;
        if (catchForm) {
            catchForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const formData = new FormData(catchForm);
                const catchData = {
                    id: crypto.randomUUID(),
                    species: formData.get('species') as string,
                    length: parseFloat(formData.get('length') as string),
                    weight: parseFloat(formData.get('weight') as string),
                    datetime: formData.get('datetime') as string,
                    notes: formData.get('notes') as string,
                    locationName: formData.get('location') as string
                };

                await this.onCatchAdded(catchData);
            });
        }

        const lengthInput = document.getElementById('length') as HTMLInputElement;
        const speciesSelect = document.getElementById('species') as HTMLSelectElement;
        if (lengthInput && speciesSelect) {
            lengthInput.addEventListener('input', async () => {
                const length = parseFloat(lengthInput.value);
                const species = speciesSelect.value;
                if (length && species) {
                    const estimatedWeight = await this.calculateEstimatedWeight(species, length);
                    if (estimatedWeight) {
                        const weightInput = document.getElementById('weight') as HTMLInputElement;
                        if (weightInput) {
                            weightInput.value = estimatedWeight.toFixed(2);
                        }
                    }
                }
            });
        }
    }
}

// API Routes
app.post('/api/catch', async (req: Request, res: Response) => {
    try {
        const { species, length, weight } = req.body;
        if (!species || !length || !weight) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // First store the catch data
        await db.addCatch({
            id: crypto.randomUUID(),
            species,
            length,
            weight,
            datetime: new Date().toISOString()
        });

        // Then analyze the species data
        const result = await speciesAnalyzer.analyzeSpecies(species);
        
        if (result) {
            res.status(201).json({ 
                message: 'Catch logged and formula updated successfully',
                updatedFormula: result
            });
        } else {
            res.status(200).json({ 
                message: 'Catch logged, insufficient data for formula update'
            });
        }
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(400).json({ error: errorMessage });
    }
});

// Get species formula
app.get('/api/species/:name', async (req: Request, res: Response) => {
    try {
        const species = await db.getSpecies(req.params.name);
        if (species) {
            res.json(species);
        } else {
            res.status(404).json({ error: 'Species not found' });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

export default app;