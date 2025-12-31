import { Grid } from '../../models/grid';
import { Time, Drawable } from '../../models/time';
import { DebugConfig } from '../../models/config';

export class GridLayer implements Drawable {
    static inject = ['context', 'time', 'grid', 'debug'];

    private context: CanvasRenderingContext2D;
    private grid: Grid;
    private debug: DebugConfig;

    constructor(context: CanvasRenderingContext2D, time: Time, grid: Grid, debug: DebugConfig) {
        this.context = context;
        this.grid = grid;
        this.debug = debug;

        time.add(this);
    }

    update(): void {
        // No update logic needed for grid
    }

    draw(): void {
        if (this.debug.drawGrid) {
            this.context.save();
            this.context.strokeStyle = 'rgba(46, 70, 119, 0.7)';
            // draw X
            for (let i = 0, l = this.grid.numCols + 1; i < l; i++) {
                const x = i * this.grid.cellWidth;
                this.context.beginPath();
                this.context.moveTo(x, 0);
                this.context.lineTo(x, this.grid.height);
                this.context.stroke();
            }
            // draw Y
            for (let a = 0, b = this.grid.numRows + 1; a < b; a++) {
                const y = a * this.grid.cellHeight;
                this.context.beginPath();
                this.context.moveTo(0, y);
                this.context.lineTo(this.grid.width, y);
                this.context.stroke();
            }
            this.context.restore();
        }
    }
}
