// @ts-ignore
import Emitter from '../src/Emitter';
import { Signal } from 'signals';

describe('Emitter Tests', () => {
    let emitter: Emitter;

    beforeEach(() => {
        emitter = new Emitter();
    });

    afterEach(() => {
        if (emitter) {
            emitter.dispose();
        }
    });

    describe('Basic Functionality', () => {
        it('should create an emitter instance', () => {
            expect(emitter).toBeDefined();
            expect(emitter).toBeInstanceOf(Emitter);
        });

        it('should add a listener to a signal', () => {
            const handler = jest.fn();
            const binding = emitter.addListener('test-signal', handler);
            expect(binding).toBeDefined();
            expect(binding.listener).toBe(handler);
        });

        it('should dispatch a signal without data', () => {
            const handler = jest.fn();
            emitter.addListener('test-signal', handler);
            emitter.dispatch('test-signal');
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('should dispatch a signal with data', () => {
            const handler = jest.fn();
            const data = { value: 42, name: 'test' };
            emitter.addListener('test-signal', handler);
            emitter.dispatch('test-signal', data);
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(data);
        });

        it('should inject signalType into data object when useIdInParams is true', () => {
            const handler = jest.fn();
            const data: any = { value: 42 };
            emitter.addListener('my-signal', handler);
            emitter.dispatch('my-signal', data, true);
            expect(handler).toHaveBeenCalledWith(expect.objectContaining({
                value: 42,
                signalType: 'my-signal'
            }));
        });

        it('should not inject signalType when useIdInParams is false', () => {
            const handler = jest.fn();
            const data: any = { value: 42 };
            emitter.addListener('my-signal', handler);
            emitter.dispatch('my-signal', data, false);
            expect(handler).toHaveBeenCalledWith({ value: 42 });
            expect(handler.mock.calls[0][0]).not.toHaveProperty('signalType');
        });

        it('should not inject signalType when data already has signalType property', () => {
            const handler = jest.fn();
            const data: any = { value: 42, signalType: 'original-type' };
            emitter.addListener('my-signal', handler);
            emitter.dispatch('my-signal', data, true);
            expect(handler).toHaveBeenCalledWith(expect.objectContaining({
                signalType: 'original-type'
            }));
        });
    });

    describe('Listener Management', () => {
        it('should add multiple listeners to the same signal', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            emitter.addListener('test-signal', handler1);
            emitter.addListener('test-signal', handler2);
            emitter.dispatch('test-signal');
            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(1);
        });

        it('should add one-time listener', () => {
            const handler = jest.fn();
            emitter.addListenerOnce('test-signal', handler);
            emitter.dispatch('test-signal');
            emitter.dispatch('test-signal');
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('should remove a specific listener', () => {
            const handler = jest.fn();
            emitter.addListener('test-signal', handler);
            emitter.removeListener('test-signal', handler);
            emitter.dispatch('test-signal');
            expect(handler).not.toHaveBeenCalled();
        });

        it('should handle removing listener from non-existent signal', () => {
            const handler = jest.fn();
            expect(() => {
                emitter.removeListener('non-existent', handler);
            }).not.toThrow();
        });

        it('should respect listener scope', () => {
            const scope = { name: 'test-scope' };
            const handler = jest.fn(function(this: any) {
                expect(this).toBe(scope);
            });
            emitter.addListener('test-signal', handler, scope);
            emitter.dispatch('test-signal');
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('should respect listener priority', () => {
            const callOrder: number[] = [];
            const handler1 = jest.fn(() => callOrder.push(1));
            const handler2 = jest.fn(() => callOrder.push(2));
            const handler3 = jest.fn(() => callOrder.push(3));

            emitter.addListener('test-signal', handler2, undefined, 0);
            emitter.addListener('test-signal', handler1, undefined, 10);
            emitter.addListener('test-signal', handler3, undefined, -10);

            emitter.dispatch('test-signal');
            expect(callOrder).toEqual([1, 2, 3]);
        });
    });

    describe('Signal Management', () => {
        it('should get a signal by id', () => {
            const handler = jest.fn();
            emitter.addListener('test-signal', handler);
            const signal = emitter.getSignal('test-signal');
            expect(signal).toBeDefined();
            expect(signal).toBeInstanceOf(Signal);
        });

        it('should return undefined for non-existent signal', () => {
            const signal = emitter.getSignal('non-existent');
            expect(signal).toBeUndefined();
        });

        it('should halt a signal', () => {
            const handler1 = jest.fn(() => {
                emitter.haltSignal('test-signal');
            });
            const handler2 = jest.fn();

            emitter.addListener('test-signal', handler1);
            emitter.addListener('test-signal', handler2);
            emitter.dispatch('test-signal');

            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).not.toHaveBeenCalled();
        });

        it('should handle halting non-existent signal', () => {
            expect(() => {
                emitter.haltSignal('non-existent');
            }).not.toThrow();
        });
    });

    describe('Multiple Signals', () => {
        it('should handle multiple different signals', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();

            emitter.addListener('signal-1', handler1);
            emitter.addListener('signal-2', handler2);

            emitter.dispatch('signal-1');
            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).not.toHaveBeenCalled();

            emitter.dispatch('signal-2');
            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(1);
        });

        it('should pass different data to different signals', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();

            emitter.addListener('signal-1', handler1);
            emitter.addListener('signal-2', handler2);

            const data1 = { id: 1 };
            const data2 = { id: 2 };

            emitter.dispatch('signal-1', data1);
            emitter.dispatch('signal-2', data2);

            expect(handler1).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
            expect(handler2).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
        });
    });

    describe('Disposal', () => {
        it('should remove all signals on dispose', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();

            emitter.addListener('signal-1', handler1);
            emitter.addListener('signal-2', handler2);

            emitter.dispose();

            emitter.dispatch('signal-1');
            emitter.dispatch('signal-2');

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
        });

        it('should clear signals object on dispose', () => {
            emitter.addListener('signal-1', jest.fn());
            emitter.addListener('signal-2', jest.fn());
            emitter.dispose();

            const signal1 = emitter.getSignal('signal-1');
            const signal2 = emitter.getSignal('signal-2');

            expect(signal1).toBeUndefined();
            expect(signal2).toBeUndefined();
        });
    });

    describe('Edge Cases', () => {
        it('should handle dispatching to signal with no listeners', () => {
            expect(() => {
                emitter.dispatch('no-listeners');
            }).not.toThrow();
        });

        it('should handle null data', () => {
            const handler = jest.fn();
            emitter.addListener('test-signal', handler);
            emitter.dispatch('test-signal', null as any);
            expect(handler).toHaveBeenCalledWith(null);
        });

        it('should handle undefined data', () => {
            const handler = jest.fn();
            emitter.addListener('test-signal', handler);
            emitter.dispatch('test-signal', undefined);
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('should handle primitive data types', () => {
            const handler = jest.fn();
            emitter.addListener('test-signal', handler);

            emitter.dispatch('test-signal', 'string' as any);
            expect(handler).toHaveBeenCalledWith('string');

            handler.mockClear();
            emitter.dispatch('test-signal', 42 as any);
            expect(handler).toHaveBeenCalledWith(42);

            handler.mockClear();
            emitter.dispatch('test-signal', true as any);
            expect(handler).toHaveBeenCalledWith(true);
        });

        it('should handle array data', () => {
            const handler = jest.fn();
            const data = [1, 2, 3];
            emitter.addListener('test-signal', handler);
            emitter.dispatch('test-signal', data as any);
            expect(handler).toHaveBeenCalledWith(data);
        });
    });
});
