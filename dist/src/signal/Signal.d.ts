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
/**
 * A type-safe signal that can dispatch typed payloads to listeners
 */
export declare class Signal<T = void> {
    private listeners;
    private halted;
    /**
     * Add a listener to this signal
     */
    add(handler: (data: T, ...curried: any[]) => void, context?: any, priority?: number): Binding<T>;
    /**
     * Add a listener that will be automatically removed after first dispatch
     */
    addOnce(handler: (data: T, ...curried: any[]) => void, context?: any, priority?: number): Binding<T>;
    private addListener;
    /**
     * Remove a specific listener
     */
    remove(handler: (data: T, ...curried: any[]) => void, context?: any): void;
    private removeEntry;
    /**
     * Remove all listeners
     */
    removeAll(): void;
    /**
     * Dispatch data to all listeners
     */
    dispatch(data: T): void;
    /**
     * Stop propagation during dispatch
     */
    halt(): void;
    /**
     * Check if a handler is registered
     */
    has(handler: (data: T, ...curried: any[]) => void, context?: any): boolean;
    /**
     * Get the number of listeners
     */
    getNumListeners(): number;
    /**
     * Clean up all listeners
     */
    dispose(): void;
}
export default Signal;
//# sourceMappingURL=Signal.d.ts.map