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
 * Event emitter with lazy signal creation and automatic cleanup
 */
export declare class Emitter<E extends EventMap = Record<string, any>> {
    private signals;
    /**
     * Add a listener for an event
     */
    addListener<K extends keyof E & string>(id: K, handler: (data: E[K], ...curried: any[]) => void, scope?: any, priority?: number): Binding<E[K]>;
    /**
     * Add a listener that fires only once
     */
    addListenerOnce<K extends keyof E & string>(id: K, handler: (data: E[K], ...curried: any[]) => void, scope?: any, priority?: number): Binding<E[K]>;
    /**
     * Remove a specific listener
     */
    removeListener<K extends keyof E & string>(id: K, handler: (data: E[K], ...curried: any[]) => void, scope?: any): void;
    /**
     * Get direct access to a signal (for advanced use)
     */
    getSignal<K extends keyof E & string>(id: K): Signal<E[K]> | undefined;
    /**
     * Stop signal propagation
     */
    haltSignal<K extends keyof E & string>(id: K): void;
    /**
     * Dispatch an event to all listeners
     */
    dispatch<K extends keyof E & string>(id: K, data?: E[K], useIdInParams?: boolean): void;
    /**
     * Check if there are listeners for an event
     */
    hasListeners<K extends keyof E & string>(id: K): boolean;
    /**
     * Clean up all signals
     */
    dispose(): void;
}
export default Emitter;
//# sourceMappingURL=Emitter.d.ts.map