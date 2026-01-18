import { Application } from '../../../index';
import Emitter from '../../../src/Emitter';
import OrientationModule, { OrientationModuleInstance } from './orientation-module';

class View {
    static inject = ['target', 'emitter', 'orientation'];

    constructor(target: HTMLElement, emitter: Emitter, orientation: OrientationModuleInstance) {
        // display the orientation when the view is created
        updateOrientation(orientation.getOrientation());

        // listen to the event dispatched by the plugin
        emitter.addListener('orientation', (data: { direction: string }) => {
            // display the orientation when a change happened
            updateOrientation(data.direction);
        });

        // display the orientation in the DOM Element
        function updateOrientation(value: string): void {
            target.innerHTML = 'Current orientation: ' + value;
        }
    }
}

class App extends Application {
    protected init(): void {
        // create the plugin
        const orientation = this.modules.create(OrientationModule);
        // create a mapping rule
        this.injector.mapValue('orientation', orientation);
        this.start();
    }

    start(): void {
        // create a view
        const reportEl = document.querySelector('.report');
        if (reportEl) {
            this.mediators.create(View, reportEl);
        }
    }
}

// Initialize the application
new App();
