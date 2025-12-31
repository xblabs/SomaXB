import { Model, TodoItem } from '../models/model';

export const events = {
    ADD: 'add',
    RENDER: 'render',
    REMOVE: 'remove',
    UPDATE: 'update',
    TOGGLE: 'toggle',
    TOGGLE_ALL: 'toggle_all',
    CLEAR_COMPLETED: 'clear_completed'
} as const;

export class TodoAddCommand {
    static inject = ['model'];

    private model: Model;

    constructor(model: Model) {
        this.model = model;
    }

    execute(data: { item: string }): void {
        this.model.addItem(data.item);
    }
}

export class TodoRemoveCommand {
    static inject = ['model'];

    private model: Model;

    constructor(model: Model) {
        this.model = model;
    }

    execute(data: { item: string }): void {
        this.model.removeItem(data.item);
    }
}

export class TodoUpdateCommand {
    static inject = ['model'];

    private model: Model;

    constructor(model: Model) {
        this.model = model;
    }

    execute(data: { item: { id: string; title: string } }): void {
        this.model.updateItem(data.item.id, data.item.title);
    }
}

export class TodoToggleCommand {
    static inject = ['model'];

    private model: Model;

    constructor(model: Model) {
        this.model = model;
    }

    execute(data: { item: string }): void {
        this.model.toggleItem(data.item);
    }
}

export class TodoToggleAllCommand {
    static inject = ['model'];

    private model: Model;

    constructor(model: Model) {
        this.model = model;
    }

    execute(data: { item: boolean }): void {
        this.model.toggleAll(data.item);
    }
}

export class TodoClearCompletedCommand {
    static inject = ['model'];

    private model: Model;

    constructor(model: Model) {
        this.model = model;
    }

    execute(): void {
        this.model.clearCompleted();
    }
}
