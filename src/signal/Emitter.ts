/**
 * Modern TypeScript Emitter Implementation
 * A typed event emitter built on top of Signal
 */

import { Signal, Binding } from './Signal';

/**
 * Base event type that includes the signal identifier
 */
export interface SignalEvent {
    signalType?: string;
    [key: string]: any;
}

/**
 * Type-safe event definitions for strong typing
 * Usage:
 *   interface MyEvents {
 *     'user:login': { userId: string };
 *     'user:logout': void;
 *   }
 *   const emitter = new Emitter<MyEvents>();
 */
export type EventMap = Record<string, any>;

/**
 * Signal pool for internal storage
 */
type SignalPool<E extends EventMap> = {
    [K in keyof E]?: Signal<E[K]>;
};

/**
 * Event emitter with lazy signal creation and automatic cleanup
 */
export class Emitter<E extends EventMap = Record<string, any>> {
    private signals: SignalPool<E> = {};

    /**
     * Add a listener for an event
     */
    addListener<K extends keyof E & string>(
        id: K,
        handler: (data: E[K], ...curried: any[]) => void,
        scope?: any,
        priority?: number
    ): Binding<E[K]> {
        if (!this.signals[id]) {
            this.signals[id] = new Signal<E[K]>();
        }
        return this.signals[id]!.add(handler, scope, priority);
    }

    /**
     * Add a listener that fires only once
     */
    addListenerOnce<K extends keyof E & string>(
        id: K,
        handler: (data: E[K], ...curried: any[]) => void,
        scope?: any,
        priority?: number
    ): Binding<E[K]> {
        if (!this.signals[id]) {
            this.signals[id] = new Signal<E[K]>();
        }
        return this.signals[id]!.addOnce(handler, scope, priority);
    }

    /**
     * Remove a specific listener
     */
    removeListener<K extends keyof E & string>(
        id: K,
        handler: (data: E[K], ...curried: any[]) => void,
        scope?: any
    ): void {
        const signal = this.signals[id];
        if (signal) {
            signal.remove(handler, scope);
        }
    }

    /**
     * Get direct access to a signal (for advanced use)
     */
    getSignal<K extends keyof E & string>(id: K): Signal<E[K]> | undefined {
        return this.signals[id];
    }

    /**
     * Stop signal propagation
     */
    haltSignal<K extends keyof E & string>(id: K): void {
        const signal = this.signals[id];
        if (signal) {
            signal.halt();
        }
    }

    /**
     * Dispatch an event to all listeners
     */
    dispatch<K extends keyof E & string>(
        id: K,
        data?: E[K],
        useIdInParams: boolean = true
    ): void {
        const signal = this.signals[id];
        if (signal) {
            if (data !== undefined) {
                // Auto-inject signalType for object payloads
                if (
                    useIdInParams &&
                    typeof data === 'object' &&
                    data !== null &&
                    !Array.isArray(data) &&
                    !('signalType' in data)
                ) {
                    (data as SignalEvent).signalType = id;
                }
                signal.dispatch(data);
            } else {
                signal.dispatch(undefined as E[K]);
            }
        }
    }

    /**
     * Check if there are listeners for an event
     */
    hasListeners<K extends keyof E & string>(id: K): boolean {
        const signal = this.signals[id];
        return signal ? signal.getNumListeners() > 0 : false;
    }

    /**
     * Clean up all signals
     */
    dispose(): void {
        for (const id in this.signals) {
            if (Object.prototype.hasOwnProperty.call(this.signals, id)) {
                this.signals[id]!.removeAll();
                delete this.signals[id];
            }
        }
        this.signals = {};
    }
}

export default Emitter;
