import { Config } from './config';

export interface Drawable {
    update(): void;
    draw(): void;
}

export type SpeedHandler = () => void;

export class Time {
    static inject = ['config'];

    private speedHandlers: SpeedHandler[] = [];
    private speedTimeoutId: ReturnType<typeof setTimeout> | undefined;
    private speed: number;

    constructor(config: Config) {
        this.speed = config.speed;
    }

    private speedLoop = (): void => {
        for (let i = 0, l = this.speedHandlers.length; i < l; i++) {
            if (typeof this.speedHandlers[i] === 'function') {
                this.speedHandlers[i]();
            }
        }
        this.speedTimeoutId = setTimeout(this.speedLoop, this.speed * 1000);
    };

    add(target: Drawable): void {
        if (typeof target.update === 'function' && typeof target.draw === 'function') {
            const loop = (): void => {
                target.update();
                target.draw();
                window.requestAnimationFrame(loop);
            };
            loop();
        }
    }

    addSpeedHandler(handler: SpeedHandler): void {
        this.speedHandlers.push(handler);
    }

    start(): void {
        if (this.speedTimeoutId === undefined) {
            this.speedLoop();
        }
    }
}
