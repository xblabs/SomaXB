import Emitter from '../../../../src/Emitter';
import { Template as SomaTemplate } from '../../../../src/Template';
import { events } from '../commands/commands';
import { TodoItem } from '../models/model';

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
    edit: (event: Event, todo: TodoItem) => void;
    update: (event: KeyboardEvent, id: string) => void;
    remove: (event: Event, id: string) => void;
    toggle: (event: Event, id: string) => void;
    toggleAll: (event: Event) => void;
    clearCompleted: () => void;
    clear: (event: Event) => void;
}

function getLi(element: Element | null): HTMLLIElement | null {
    if (!element) return null;
    return element.tagName === 'LI' ? element as HTMLLIElement : getLi(element.parentElement);
}

function getActiveItems(data: TodoItem[]): number {
    return data.filter((todo) => !todo.completed).length;
}

export class TodoTemplate {
    static inject = ['scope', 'template', 'emitter'];

    constructor(scope: TodoScope, template: SomaTemplate, emitter: Emitter) {
        emitter.addListener(events.RENDER, (data: { items: TodoItem[] }) => {
            const items = data.items;

            // update template data
            scope.todos = items;
            scope.active = getActiveItems(items);
            scope.completed = scope.todos.length - scope.active;
            scope.allCompleted = scope.todos.length > 0 && scope.active === 0;
            scope.clearCompletedVisible = scope.completed > 0;
            scope.footerVisible = scope.todos.length > 0;
            scope.itemLabel = scope.active === 1 ? 'item' : 'items';

            // render template
            template.render();
        });

        scope.completedClass = (completed: boolean): string => {
            return completed ? 'completed' : '';
        };

        scope.add = (event: KeyboardEvent): void => {
            const target = event.currentTarget as HTMLInputElement;
            const value = target.value.trim();
            if (event.which === ENTER_KEY && value !== '') {
                emitter.dispatch(events.ADD, { item: value });
                target.value = '';
            }
        };

        scope.edit = (event: Event, _todo: TodoItem): void => {
            const li = getLi(event.currentTarget as Element);
            if (li) {
                li.classList.add('editing');
            }
        };

        scope.update = (event: KeyboardEvent, id: string): void => {
            const target = event.currentTarget as HTMLInputElement;
            const value = target.value.trim();
            if (event.which === ENTER_KEY) {
                if (value) {
                    emitter.dispatch(events.UPDATE, {
                        item: { id, title: value }
                    });
                } else {
                    emitter.dispatch(events.REMOVE, { item: id });
                }
                const li = getLi(target);
                if (li) {
                    li.classList.remove('editing');
                }
            }
        };

        scope.remove = (_event: Event, id: string): void => {
            emitter.dispatch(events.REMOVE, { item: id });
        };

        scope.toggle = (_event: Event, id: string): void => {
            emitter.dispatch(events.TOGGLE, { item: id });
        };

        scope.toggleAll = (event: Event): void => {
            const target = event.currentTarget as HTMLInputElement;
            emitter.dispatch(events.TOGGLE_ALL, { item: target.checked });
        };

        scope.clearCompleted = (): void => {
            emitter.dispatch(events.CLEAR_COMPLETED);
        };

        scope.clear = (event: Event): void => {
            const target = event.currentTarget as HTMLInputElement;
            target.value = '';
        };
    }
}
