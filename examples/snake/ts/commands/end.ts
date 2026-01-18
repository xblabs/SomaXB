import Emitter from '../../../../src/Emitter';

export class EndCommand {
    static inject = ['emitter'];

    private emitter: Emitter;

    constructor(emitter: Emitter) {
        this.emitter = emitter;
    }

    execute(): void {
        // display game over screen or restart game
        this.emitter.dispatch('start');
    }
}
