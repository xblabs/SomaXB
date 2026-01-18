import Injector from '../../../../src/Injector';
import { Grid } from '../models/grid';
import { Time, Drawable } from '../models/time';

export class Canvas implements Drawable {
    static inject = ['target', 'injector', 'time', 'grid'];

    private context: CanvasRenderingContext2D;
    private grid: Grid;

    constructor(target: HTMLCanvasElement, injector: Injector, time: Time, grid: Grid) {
        const context = target.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2D context from canvas');
        }
        this.context = context;
        this.grid = grid;

        injector.mapValue('canvas', target);
        injector.mapValue('context', context);

        time.add(this);
    }

    update(): void {
        // No update logic needed
    }

    draw(): void {
        this.context.clearRect(0, 0, this.grid.width, this.grid.height);
    }
}
