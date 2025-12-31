import { Application } from '../../../index';

// Config
import { Config } from './models/config';

// Commands
import { StartCommand } from './commands/start';
import { EndCommand } from './commands/end';

// Models
import { Time } from './models/time';
import { Grid } from './models/grid';
import { Path } from './models/path';
import { Input } from './models/input';
import { Collision } from './models/collision';

// Layers
import { GridLayer } from './views/layers/grid';
import { SnakeLayer } from './views/layers/snake';
import { FoodLayer } from './views/layers/food';

// Entities
import { Snake } from './views/entities/snake';
import { Food } from './views/entities/food';

// Views
import { Canvas } from './views/canvas';

class SnakeGame extends Application {
    protected init(): void {
        // config
        this.injector.mapValue('config', Config);
        this.injector.mapValue('debug', Config.debug);

        // commands
        this.commands.add('start', StartCommand);
        this.commands.add('end', EndCommand);

        // models
        this.injector.mapClass('time', Time, true);
        this.injector.mapClass('grid', Grid, true);
        this.injector.mapClass('path', Path, true);
        this.injector.mapClass('input', Input, true);
        this.injector.mapClass('collision', Collision, true);

        // layers
        this.injector.mapClass('gridLayer', GridLayer, true);
        this.injector.mapClass('snakeLayer', SnakeLayer, true);
        this.injector.mapClass('foodLayer', FoodLayer, true);

        // entities
        this.injector.mapClass('snake', Snake);
        this.injector.mapClass('food', Food);

        // mediators
        const canvas = document.querySelector('.canvas') as HTMLCanvasElement;
        if (canvas) {
            this.mediators.create(Canvas, canvas);
        }

        this.start();
    }

    start(): void {
        this.emitter.dispatch('start');
    }
}

// Initialize the game
new SnakeGame();
