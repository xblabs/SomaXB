import { Grid } from '../../models/grid';
import { Time, Drawable } from '../../models/time';
import { Path } from '../../models/path';
import { Snake } from '../entities/snake';
import { Cell } from '../../vo/cell';

export class SnakeLayer implements Drawable {
    static inject = ['context', 'grid', 'time', 'snake', 'path'];

    private context: CanvasRenderingContext2D;
    private snake: Snake;
    private path: Path;

    constructor(context: CanvasRenderingContext2D, grid: Grid, time: Time, snake: Snake, path: Path) {
        this.context = context;
        this.snake = snake;
        this.path = path;

        this.snake.width = grid.cellWidth;
        this.snake.height = grid.cellHeight;

        time.add(this);
    }

    update(): void {
        this.snake.path = this.path.get();
    }

    draw(): void {
        this.snake.draw(this.context);
    }

    getPosition(): Cell | null {
        return this.snake.path.length === 0 ? null : this.snake.path[0];
    }
}
