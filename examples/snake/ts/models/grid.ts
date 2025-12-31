import { Config } from './config';

export interface Position {
    col: number;
    row: number;
}

export interface Coords {
    x: number;
    y: number;
}

export class Grid {
    static inject = ['config'];

    width: number;
    height: number;
    cellWidth: number;
    cellHeight: number;
    numCols: number;
    numRows: number;
    numIndex: number;

    constructor(config: Config) {
        this.width = config.canvas.width;
        this.height = config.canvas.height;
        this.cellWidth = config.grid.width;
        this.cellHeight = config.grid.height;
        this.numCols = Math.ceil(this.width / this.cellWidth);
        this.numRows = Math.ceil(this.height / this.cellHeight);
        this.numIndex = this.numCols * this.numRows;
    }

    isInBoundaries(col: number, row: number): boolean {
        return !(col < 0 || col >= this.numCols || row < 0 || row >= this.numRows);
    }

    getIndexFromCoords(x: number, y: number): number {
        const pos = this.getPositionFromCoords(x, y);
        return this.getIndexFromPosition(pos.col, pos.row);
    }

    getIndexFromPosition(col: number, row: number): number {
        return row * this.numRows + col;
    }

    getPositionFromCoords(x: number, y: number): Position {
        return {
            col: Math.floor((x / this.width) * this.numCols),
            row: Math.floor((y / this.height) * this.numRows)
        };
    }

    getPositionFromIndex(index: number): Position {
        return {
            row: Math.floor(index / this.numCols),
            col: index % this.numCols
        };
    }

    getCoordsFromPosition(col: number, row: number): Coords {
        return {
            x: col * this.cellWidth,
            y: row * this.cellHeight
        };
    }

    getCoordsFromIndex(index: number): Coords {
        const pos = this.getPositionFromIndex(index);
        return this.getCoordsFromPosition(pos.col, pos.row);
    }
}
