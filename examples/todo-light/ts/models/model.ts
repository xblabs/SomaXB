export interface TodoItem {
    title: string;
    completed: boolean;
    editing?: string;
}

export interface ModelInterface {
    get(): TodoItem[];
    set(items: TodoItem[]): void;
}

export class Model implements ModelInterface {
    private storeKey = 'todos-somajs';

    get(): TodoItem[] {
        return JSON.parse(localStorage.getItem(this.storeKey) || '[]');
    }

    set(items: TodoItem[]): void {
        localStorage.setItem(this.storeKey, JSON.stringify(items));
    }
}
