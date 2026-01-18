/**
 * Modern Signal System for SomaJS
 *
 * A type-safe replacement for js-signals, designed specifically for the Soma framework.
 *
 * Features:
 * - Full TypeScript support with generics
 * - Priority-based listener ordering
 * - One-time listeners (addOnce)
 * - Halt propagation support
 * - Scope/context binding
 * - Backward-compatible binding.params for command injection
 * - Zero external dependencies
 *
 * @example
 * // Basic usage
 * const signal = new Signal<{ message: string }>();
 * signal.add((data) => console.log(data.message));
 * signal.dispatch({ message: 'Hello!' });
 *
 * @example
 * // Type-safe emitter
 * interface AppEvents {
 *   'todo:add': { item: TodoItem };
 *   'todo:remove': { id: string };
 *   'app:ready': void;
 * }
 *
 * const emitter = new Emitter<AppEvents>();
 * emitter.addListener('todo:add', (data) => {
 *   // data is typed as { item: TodoItem }
 *   console.log(data.item);
 * });
 * emitter.dispatch('todo:add', { item: newTodo });
 */

export { Signal, Binding } from './Signal';
export { Emitter, SignalEvent, EventMap } from './Emitter';

// Default export for convenience
export { Emitter as default } from './Emitter';
