import express, { type Request, type Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const app = express();
const port = 4001;

function readCsv(filename: string) {
    // On Vercel, the files are in the same directory as the function or relative to process.cwd()
    // We'll try both to be safe
    const locations = [
        path.join(process.cwd(), 'apps', 'mock-api', 'src', 'data', filename),
        path.join(process.cwd(), 'src', 'data', filename),
        path.join(__dirname, 'data', filename)
    ];
    
    let filePath = '';
    for (const loc of locations) {
        if (fs.existsSync(loc)) {
            filePath = loc;
            break;
        }
    }

    if (!filePath) {
        throw new Error(`File not found: ${filename}. Tried: ${locations.join(', ')}`);
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return parse(data, { columns: true, skip_empty_lines: true });
}

app.get('/employees', (req: Request, res: Response) => {
    try {
        const employees = readCsv('api_employees.csv');
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to read employees data: ' + (error as Error).message });
    }
});

app.get('/shifts', (req: Request, res: Response) => {
    try {
        const shifts = readCsv('api_shifts.csv');
        res.json(shifts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to read shifts data: ' + (error as Error).message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Mock Provider API listening at http://localhost:${port}`);
    });
}

export default app;

