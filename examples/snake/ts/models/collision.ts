import Emitter from '../../../../src/Emitter';
import { SnakeLayer } from '../views/layers/snake';
import { FoodLayer } from '../views/layers/food';
import { Time } from './time';

export class Collision {
    static inject = ['snakeLayer', 'foodLayer', 'time', 'emitter'];

    constructor(snakeLayer: SnakeLayer, foodLayer: FoodLayer, time: Time, emitter: Emitter) {
        time.addSpeedHandler(() => {
            const snakePos = snakeLayer.getPosition();
            const foodPos = foodLayer.getPosition();
            if (snakePos && foodPos && snakePos.col === foodPos.col && snakePos.row === foodPos.row) {
                emitter.dispatch('eating');
                foodLayer.reset();
            }
        });
    }
}
