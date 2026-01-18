import { Application } from '../../../index';
import Emitter from '../../../src/Emitter';

// Director router is loaded externally
declare var Router: any;

interface RouterInterface {
    on(route: string | RegExp, handler: () => void): void;
    init(initialRoute: string): void;
    getRoute(): string[];
}

class Navigation {
    static inject = ['router', 'emitter'];

    constructor(router: RouterInterface, emitter: Emitter) {
        router.on('/home', () => {
            dispatchRoute('home');
        });

        router.on('/page1', () => {
            dispatchRoute('page1');
        });

        router.on('/page2', () => {
            dispatchRoute('page2');
        });

        // in this demo, all routes could have been handled with this single regex route
        // router.on(/.*/, () => {
        //   dispatchRoute(router.getRoute()[0]);
        // });

        router.init('/home');

        function dispatchRoute(id: string): void {
            console.log('> dispatching route id:', id);
            emitter.dispatch('show-view', { viewId: id });
        }
    }
}

class View {
    static inject = ['target', 'emitter'];

    constructor(target: HTMLElement, emitter: Emitter) {
        emitter.addListener('show-view', (data: { viewId: string }) => {
            const isCurrentView = target.className.indexOf(data.viewId) !== -1;
            target.style.display = isCurrentView ? 'block' : 'none';
            if (isCurrentView) {
                console.log('  showing the view:', data.viewId);
            }
        });
    }
}

class App extends Application {
    protected init(): void {
        // create the Director router and make it available through the framework
        this.injector.mapValue('router', new Router());
        // create mediators for the views (DOM Element)
        const views = Array.from(document.querySelectorAll('.view'));
        this.mediators.create(View, views);
        this.start();
    }

    start(): void {
        // instantiate Navigation to start the app
        this.injector.createInstance(Navigation);
    }
}

// Initialize the application
new App();
