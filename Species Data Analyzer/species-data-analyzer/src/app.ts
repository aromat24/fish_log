import express, { Request, Response, Router } from 'express';
import { randomUUID } from 'crypto';
import cors from 'cors';
import { SpeciesAnalyzer } from './services/speciesAnalyzer';
import { DatabaseService } from './services/database';

const app = express();
const router = Router();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(express.json());
app.use(router);  // Mount router earlier

// Initialize services
const db = new DatabaseService();
const speciesAnalyzer = new SpeciesAnalyzer();

// Initialize Database with proper cleanup
async function initializeDatabase() {
    try {
        await db.openDB();
        console.log('Database connected successfully');
    } catch (err) {
        console.error('Database connection failed:', err);
        await db.closeDB().catch((closeErr: Error) => {
            console.error('Error during database cleanup:', closeErr);
        });
        process.exit(1);
    }
}

interface CatchRequestBody {
    species: string;
    length: number;
    weight: number;
}

// API Routes
router.post('/api/catch', async (req: Request<{}, {}, CatchRequestBody>, res: Response): Promise<void> => {
    try {
        const { species, length, weight } = req.body;
        if (!species || !length || !weight) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Add catch data using proper crypto import
        await db.addCatch({
            id: randomUUID(),
            species,
            length,
            weight,
            datetime: new Date().toISOString()
        });

        // Analyze species data
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
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(400).json({ error: errorMessage });
    }
});

interface SpeciesParams {
    name: string;
}

// Get species formula
router.get('/api/species/:name', async (req: Request<SpeciesParams>, res: Response): Promise<void> => {
    try {
        const species = await db.getSpecies(req.params.name);
        if (species) {
            res.json(species);
        } else {
            res.status(404).json({ error: 'Species not found' });
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
});

// Initialize database before starting server
if (process.env.NODE_ENV !== 'test') {
    initializeDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    });
}

export default app;