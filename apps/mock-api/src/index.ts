import express, { type Request, type Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const app = express();
const port = 4001;

function readCsv(filename: string) {
    const filePath = path.join(process.cwd(), 'src', 'data', filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
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
        res.status(500).json({ error: 'Failed to read employees data' });
    }
});

app.get('/shifts', (req: Request, res: Response) => {
    try {
        const shifts = readCsv('api_shifts.csv');
        res.json(shifts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to read shifts data' });
    }
});

app.listen(port, () => {
    console.log(`Mock Provider API listening at http://localhost:${port}`);
});
