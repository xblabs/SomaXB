import { Grid, Position } from '../../models/grid';
import { Time, Drawable } from '../../models/time';
import { Food } from '../entities/food';

export class FoodLayer implements Drawable {
    static inject = ['context', 'grid', 'time', 'food'];

    private context: CanvasRenderingContext2D;
    private grid: Grid;
    private food: Food;
    private cell: Position = { col: 0, row: 0 };

    constructor(context: CanvasRenderingContext2D, grid: Grid, time: Time, food: Food) {
        this.context = context;
        this.grid = grid;
        this.food = food;

        this.food.width = grid.cellWidth;
        this.food.height = grid.cellHeight;

        time.add(this);
    }

    update(): void {
        // No update logic needed
    }

    draw(): void {
        this.food.draw(this.context);
    }

    getPosition(): Position {
        return this.cell;
    }

    setRandomPosition(): void {
        this.cell.col = Math.floor(Math.random() * this.grid.numCols);
        this.cell.row = Math.floor(Math.random() * this.grid.numRows);
        this.food.x = this.cell.col * this.grid.cellWidth;
        this.food.y = this.cell.row * this.grid.cellHeight;
    }

    reset(): void {
        this.setRandomPosition();
    }
}
