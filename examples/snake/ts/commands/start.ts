import { FoodLayer } from '../views/layers/food';
import { Time } from '../models/time';
import { Path } from '../models/path';

export class StartCommand {
    static inject = ['input', 'collision', 'gridLayer', 'snakeLayer', 'foodLayer', 'time', 'path'];

    private foodLayer: FoodLayer;
    private time: Time;
    private path: Path;

    constructor(
        _input: unknown,
        _collision: unknown,
        _gridLayer: unknown,
        _snakeLayer: unknown,
        foodLayer: FoodLayer,
        time: Time,
        path: Path
    ) {
        this.foodLayer = foodLayer;
        this.time = time;
        this.path = path;
    }

    execute(): void {
        this.foodLayer.reset();
        this.path.reset();
        this.time.start();
    }
}
