import { Cell } from '../../vo/cell';

export class Snake {
    width = 0;
    height = 0;
    rgba = 'rgba(46, 119, 58, 0.8)';
    path: Cell[] = [];

    draw(context: CanvasRenderingContext2D): void {
        context.save();
        for (let i = 0, l = this.path.length; i < l; i++) {
            const cell = this.path[i];
            if (cell.x !== null && cell.y !== null) {
                context.fillStyle = this.rgba;
                context.fillRect(cell.x, cell.y, this.width, this.height);
            }
        }
        context.restore();
    }
}
