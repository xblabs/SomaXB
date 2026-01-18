import Emitter from '../../../../src/Emitter';
import { Direction } from '../vo/cell';

export class Input {
    static inject = ['emitter'];

    constructor(emitter: Emitter) {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            let key: Direction | undefined;
            switch (event.keyCode) {
                case 37:
                    key = 'left';
                    break;
                case 38:
                    key = 'up';
                    break;
                case 39:
                    key = 'right';
                    break;
                case 40:
                    key = 'down';
                    break;
            }
            if (key) {
                emitter.dispatch('keydown', { key });
            }
        });
    }
}
