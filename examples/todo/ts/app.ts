import { Application } from '../../../index';
import * as somaTemplate from '../../../src/Template';
import { Model } from './models/model';
import { TodoTemplate } from './views/template';
import {
    events,
    TodoAddCommand,
    TodoRemoveCommand,
    TodoUpdateCommand,
    TodoToggleCommand,
    TodoToggleAllCommand,
    TodoClearCompletedCommand
} from './commands/commands';

class TodoApp extends Application {
    protected init(): void {
        this.injector.mapClass('model', Model, true);

        this.commands.add(events.ADD, TodoAddCommand);
        this.commands.add(events.REMOVE, TodoRemoveCommand);
        this.commands.add(events.UPDATE, TodoUpdateCommand);
        this.commands.add(events.TOGGLE, TodoToggleCommand);
        this.commands.add(events.TOGGLE_ALL, TodoToggleAllCommand);
        this.commands.add(events.CLEAR_COMPLETED, TodoClearCompletedCommand);

        const templateEl = document.getElementById('todoapp');
        if (templateEl) {
            const template = somaTemplate.create(templateEl);
            const childInjector = this.injector.createChild();
            childInjector.mapValue('template', template);
            childInjector.mapValue('scope', template.scope);
            childInjector.createInstance(TodoTemplate);
        }

        this.start();
    }

    start(): void {
        const model = this.injector.getValue('model') as Model;
        this.emitter.dispatch(events.RENDER, { items: model.data });
    }
}

// Initialize the app
new TodoApp();
