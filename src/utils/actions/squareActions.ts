import fs from 'fs';
import path from 'path';
import { Square } from '../../db/tables/Square';

export function getSquares(): Square[] {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'squares.json'), 'utf-8'));
}

export function getSquareById(selectedId: number): Square {
    return getSquares().filter(({ id }: { id: number }) => id === selectedId)[0];
}