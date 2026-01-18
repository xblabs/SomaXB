import { Application } from '../../../index';
import * as somaTemplate from '../../../src/Template';
import { Model } from './models/model';
import { TodoTemplate } from './views/template';

// Director router is loaded externally
declare var Router: any;

class TodoApp extends Application {
    protected init(): void {
        this.injector.mapClass('model', Model, true);
        this.injector.mapValue('router', new Router().init());

        const templateEl = document.getElementById('todoapp');
        if (templateEl) {
            const template = somaTemplate.create(templateEl);
            const childInjector = this.injector.createChild();
            childInjector.mapValue('template', template);
            childInjector.mapValue('scope', template.scope);
            childInjector.createInstance(TodoTemplate);
        }
    }
}

// Initialize the app
new TodoApp();
