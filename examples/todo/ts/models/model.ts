import Emitter from '../../../../src/Emitter';
import { events } from '../commands/commands';

export interface TodoItem {
    id: string;
    title: string;
    completed: boolean;
}

export class Model {
    static inject = ['emitter'];

    private emitter: Emitter;
    private storeKey = 'todos-somajs';
    data: TodoItem[];

    constructor(emitter: Emitter) {
        this.emitter = emitter;
        this.data = JSON.parse(this.getStore() || '[]');
    }

    addItem(title: string): void {
        this.data.push({
            id: this.uuid(),
            title: title,
            completed: false
        });
        this.update();
    }

    removeItem(id: string): void {
        const index = this.getIndexById(id);
        if (index !== -1) {
            this.data.splice(index, 1);
            this.update();
        }
    }

    toggleItem(id: string): void {
        const index = this.getIndexById(id);
        if (index !== -1) {
            const item = this.data[index];
            item.completed = !item.completed;
            this.update();
        }
    }

    updateItem(id: string, title: string): void {
        const index = this.getIndexById(id);
        if (index !== -1) {
            this.data[index].title = title;
            this.update();
        }
    }

    toggleAll(toggleValue: boolean): void {
        this.data.forEach((item) => {
            item.completed = toggleValue;
        });
        this.update();
    }

    clearCompleted(): void {
        this.data = this.data.filter((item) => !item.completed);
        this.update();
    }

    getIndexById(id: string): number {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) {
                return i;
            }
        }
        return -1;
    }

    update(): void {
        this.setStore(this.data);
        this.emitter.dispatch(events.RENDER, { items: this.data });
    }

    private getStore(): string | null {
        return localStorage.getItem(this.storeKey);
    }

    private setStore(data: TodoItem[]): void {
        localStorage.setItem(this.storeKey, JSON.stringify(data));
    }

    // UUID generator - https://gist.github.com/1308368
    private uuid(): string {
        let a: number | string = '';
        let b = '';
        for (a = b = '', a = 0; a++ < 36; b += (a as number) * 51 & 52 ? ((a as number) ^ 15 ? 8 ^ Math.random() * ((a as number) ^ 20 ? 16 : 4) : 4).toString(16) : '-');
        return b;
    }
}
