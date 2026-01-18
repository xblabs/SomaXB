/**
 * Modern TypeScript Signal Implementation
 * Replaces js-signals with a type-safe, minimal implementation
 */

export interface Binding<T = any> {
    /** Detach this binding from its signal */
    detach(): void;
    /** Whether this binding is still active */
    active: boolean;
    /** Whether this is a one-time binding */
    readonly once: boolean;
    /** The priority of this binding */
    readonly priority: number;
    /** Execute the handler manually */
    execute(data?: T): void;
    /** Curried parameters (for backward compatibility with Commands) */
    params: any[];
}

interface ListenerEntry<T> {
    handler: (data: T, ...curried: any[]) => void;
    context: any;
    priority: number;
    once: boolean;
    active: boolean;
    params: any[];
}

/**
 * A type-safe signal that can dispatch typed payloads to listeners
 */
export class Signal<T = void> {
    private listeners: ListenerEntry<T>[] = [];
    private halted = false;

    /**
     * Add a listener to this signal
     */
    add(
        handler: (data: T, ...curried: any[]) => void,
        context?: any,
        priority: number = 0
    ): Binding<T> {
        return this.addListener(handler, context, priority, false);
    }

    /**
     * Add a listener that will be automatically removed after first dispatch
     */
    addOnce(
        handler: (data: T, ...curried: any[]) => void,
        context?: any,
        priority: number = 0
    ): Binding<T> {
        return this.addListener(handler, context, priority, true);
    }

    private addListener(
        handler: (data: T, ...curried: any[]) => void,
        context: any,
        priority: number,
        once: boolean
    ): Binding<T> {
        const entry: ListenerEntry<T> = {
            handler,
            context,
            priority,
            once,
            active: true,
            params: []
        };

        // Insert sorted by priority (higher priority first)
        const insertIndex = this.listeners.findIndex(l => l.priority < priority);
        if (insertIndex === -1) {
            this.listeners.push(entry);
        } else {
            this.listeners.splice(insertIndex, 0, entry);
        }

        // Return binding object for control
        const binding: Binding<T> = {
            detach: () => this.removeEntry(entry),
            get active() { return entry.active; },
            set active(value: boolean) { entry.active = value; },
            once: entry.once,
            priority: entry.priority,
            execute: (data?: T) => {
                if (entry.active) {
                    const args = entry.params.length > 0
                        ? [...entry.params, data]
                        : [data];
                    entry.handler.apply(entry.context, args as any);
                }
            },
            get params() { return entry.params; },
            set params(value: any[]) { entry.params = value; }
        };

        return binding;
    }

    /**
     * Remove a specific listener
     */
    remove(handler: (data: T, ...curried: any[]) => void, context?: any): void {
        const index = this.listeners.findIndex(
            l => l.handler === handler && (context === undefined || l.context === context)
        );
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }

    private removeEntry(entry: ListenerEntry<T>): void {
        const index = this.listeners.indexOf(entry);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Remove all listeners
     */
    removeAll(): void {
        this.listeners = [];
    }

    /**
     * Dispatch data to all listeners
     */
    dispatch(data: T): void {
        this.halted = false;

        // Copy listeners array to handle modifications during dispatch
        const listeners = [...this.listeners];
        const toRemove: ListenerEntry<T>[] = [];

        for (const entry of listeners) {
            if (this.halted) break;
            if (!entry.active) continue;

            // Execute with curried params if present
            if (entry.params.length > 0) {
                entry.handler.apply(entry.context, [...entry.params, data] as any);
            } else {
                entry.handler.call(entry.context, data);
            }

            if (entry.once) {
                toRemove.push(entry);
            }
        }

        // Remove once listeners after dispatch
        for (const entry of toRemove) {
            this.removeEntry(entry);
        }
    }

    /**
     * Stop propagation during dispatch
     */
    halt(): void {
        this.halted = true;
    }

    /**
     * Check if a handler is registered
     */
    has(handler: (data: T, ...curried: any[]) => void, context?: any): boolean {
        return this.listeners.some(
            l => l.handler === handler && (context === undefined || l.context === context)
        );
    }

    /**
     * Get the number of listeners
     */
    getNumListeners(): number {
        return this.listeners.length;
    }

    /**
     * Clean up all listeners
     */
    dispose(): void {
        this.removeAll();
    }
}

export default Signal;
