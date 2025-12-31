import { Application } from '../../../index';
import Emitter from '../../../src/Emitter';

class Model {
    getData(): string {
        return "Hello soma.js!";
    }
}

class Mediator {
    static inject = ['target', 'emitter', 'model'];

    constructor(target: HTMLElement, emitter: Emitter, model: Model) {
        emitter.addListener('show-hello-world', () => {
            target.innerHTML = model.getData();
        });
    }
}

class App extends Application {
    protected init(): void {
        this.injector.mapClass('model', Model, true);
        this.mediators.create(Mediator, document.getElementById('message'));
        this.start();
    }

    start(): void {
        this.emitter.dispatch('show-hello-world');
    }
}

// Initialize the application
new App();
