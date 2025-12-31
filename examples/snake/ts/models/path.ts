import Emitter from '../../../../src/Emitter';
import { Cell, Direction } from '../vo/cell';
import { Grid, Position } from './grid';
import { Time } from './time';

export class Path {
    static inject = ['grid', 'emitter', 'time'];

    private grid: Grid;
    private emitter: Emitter;
    values: Cell[] = [];
    currentLength = 1;
    direction: Direction = 'right';
    private keys: Direction[] = [];

    constructor(grid: Grid, emitter: Emitter, time: Time) {
        this.grid = grid;
        this.emitter = emitter;

        this.reset();

        emitter.addListener('keydown', (data: { key: Direction }) => {
            this.keys.push(data.key);
            if (this.keys.length > 2) {
                this.keys.length = 2;
            }
        });

        emitter.addListener('eating', () => this.addCell());

        time.addSpeedHandler(() => {
            const nextDirection = this.keys.length > 0 ? this.keys[0] : this.direction;
            const nextPosition = this.getNextPosition(nextDirection);
            if (nextPosition) {
                this.direction = nextDirection;
                this.add(nextPosition.col, nextPosition.row);
            }
            this.keys.shift();
        });
    }

    reset(): void {
        this.values = [];
        this.keys = [];
        this.direction = 'right';
        this.add(1, 1);
        this.currentLength = 1;
    }

    get(): Cell[] {
        return this.values;
    }

    getLeader(): Cell | null {
        if (this.values.length === 0) {
            return null;
        }
        return this.values[0];
    }

    addCell(): void {
        this.currentLength++;
    }

    getNextPosition(direction: Direction): Position | null {
        let nextCol: number;
        let nextRow: number;
        const leader = this.getLeader();

        if (!leader || leader.col === null || leader.row === null) {
            return null;
        }

        switch (direction) {
            case 'left':
                nextCol = leader.col - 1;
                nextRow = leader.row;
                break;
            case 'right':
                nextCol = leader.col + 1;
                nextRow = leader.row;
                break;
            case 'up':
                nextCol = leader.col;
                nextRow = leader.row - 1;
                break;
            case 'down':
                nextCol = leader.col;
                nextRow = leader.row + 1;
                break;
        }

        if (this.isCellBusy(nextCol, nextRow)) {
            if (!this.isOppositeDirection(direction)) {
                this.emitter.dispatch('end', { reason: 'eating-tail' });
            }
            return null;
        }
        if (!this.grid.isInBoundaries(nextCol, nextRow)) {
            this.emitter.dispatch('end', { reason: 'reached-boundaries' });
            return null;
        }

        return {
            col: nextCol,
            row: nextRow
        };
    }

    isOppositeDirection(direction: Direction): boolean {
        switch (direction) {
            case 'left':
                return this.direction === 'right';
            case 'right':
                return this.direction === 'left';
            case 'up':
                return this.direction === 'down';
            case 'down':
                return this.direction === 'up';
        }
    }

    isCellBusy(col: number, row: number): boolean {
        return this.values.filter((element) => {
            return col === element.col && row === element.row;
        }).length > 0;
    }

    add(col: number, row: number): Cell {
        const coords = this.grid.getCoordsFromPosition(col, row);
        const pos = this.grid.getPositionFromCoords(coords.x, coords.y);
        const cell = new Cell();
        cell.x = coords.x;
        cell.y = coords.y;
        cell.index = this.grid.getIndexFromPosition(col, row);
        cell.col = pos.col;
        cell.row = pos.row;
        cell.direction = this.direction;
        this.values.unshift(cell);
        this.normalize();
        return cell;
    }

    normalize(): void {
        if (this.values.length > this.currentLength) {
            this.values.length = this.currentLength;
        }
    }
}
