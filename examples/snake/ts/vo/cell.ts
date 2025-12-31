// Cell value object representing a position in the grid
export type Direction = 'left' | 'right' | 'up' | 'down';

export class Cell {
    index: number | null = null;
    x: number | null = null;
    y: number | null = null;
    col: number | null = null;
    row: number | null = null;
    direction: Direction | null = null;

    toString(): string {
        return '[Position] x: ' + this.x +
            ', y: ' + this.y +
            ', index: ' + this.index +
            ', col: ' + this.col +
            ', row: ' + this.row +
            ', direction: ' + this.direction;
    }
}
