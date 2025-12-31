import { Template as SomaTemplate } from '../../../../src/Template';
import { ModelInterface, TodoItem } from '../models/model';

const ENTER_KEY = 13;

interface TodoScope {
    todos: TodoItem[];
    active: number;
    completed: number;
    allCompleted: boolean;
    clearCompletedVisible: boolean;
    footerVisible: boolean;
    itemLabel: string;
    completedClass: (completed: boolean) => string;
    add: (event: KeyboardEvent) => void;
    remove: (event: Event, todo: TodoItem) => void;
    toggle: (event: Event, todo: TodoItem) => void;
    edit: (event: Event, todo: TodoItem) => void;
    update: (event: KeyboardEvent, todo: TodoItem) => void;
    toggleAll: (event: Event) => void;
    clearCompleted: () => void;
    clear: (event: Event) => void;
}

export class TodoTemplate {
    static inject = ['scope', 'template', 'model'];

    constructor(scope: TodoScope, template: SomaTemplate, model: ModelInterface) {
        let todos = scope.todos = model.get();

        const render = (): void => {
            scope.active = getActiveItems(scope.todos);
            scope.completed = scope.todos.length - scope.active;
            scope.allCompleted = scope.todos.length > 0 && scope.active === 0;
            scope.clearCompletedVisible = scope.completed > 0;
            scope.footerVisible = scope.todos.length > 0;
            scope.itemLabel = scope.active === 1 ? 'item' : 'items';

            model.set(todos);
            template.render();
        };

        scope.completedClass = (completed: boolean): string => {
            return completed ? 'completed' : '';
        };

        scope.add = (event: KeyboardEvent): void => {
            const target = event.currentTarget as HTMLInputElement;
            const value = target.value.trim();
            if (event.which === ENTER_KEY && value !== '') {
                todos.push({
                    title: value,
                    completed: false
                });
                render();
                target.value = '';
            }
        };

        scope.remove = (_event: Event, todo: TodoItem): void => {
            if (todo) {
                todos.splice(todos.indexOf(todo), 1);
                render();
            }
        };

        scope.toggle = (_event: Event, todo: TodoItem): void => {
            todo.completed = !todo.completed;
            render();
        };

        scope.edit = (_event: Event, todo: TodoItem): void => {
            todo.editing = 'editing';
            render();
        };

        scope.update = (event: KeyboardEvent, todo: TodoItem): void => {
            const target = event.currentTarget as HTMLInputElement;
            const value = target.value.trim();
            if (event.which === ENTER_KEY) {
                if (value) {
                    todo.title = value;
                } else {
                    todos.splice(todos.indexOf(todo), 1);
                }
                todo.editing = '';
                render();
            }
        };

        scope.toggleAll = (event: Event): void => {
            const target = event.currentTarget as HTMLInputElement;
            todos.forEach((todo) => {
                todo.completed = target.checked;
            });
            render();
        };

        scope.clearCompleted = (): void => {
            todos = scope.todos = todos.filter((todo) => !todo.completed);
            render();
        };

        scope.clear = (event: Event): void => {
            const target = event.currentTarget as HTMLInputElement;
            target.value = '';
        };

        function getActiveItems(_data: TodoItem[]): number {
            return todos.filter((todo) => !todo.completed).length;
        }

        render();
    }
}
