// @ts-ignore
import Commands from '../src/Commands';
import Emitter from '../src/Emitter';
import { Injector } from '../src/infuse';

describe('Commands Tests', () => {
    let commands: Commands;
    let emitter: Emitter;
    let injector: Injector;

    beforeEach(() => {
        emitter = new Emitter();
        injector = new Injector();
        injector.mapValue('emitter', emitter);
        injector.mapValue('injector', injector);
        commands = new Commands(emitter, injector);
    });

    afterEach(() => {
        if (commands) {
            commands.dispose();
        }
        if (emitter) {
            emitter.dispose();
        }
        if (injector) {
            injector.dispose();
        }
    });

    describe('Basic Functionality', () => {
        it('should create a commands instance', () => {
            expect(commands).toBeDefined();
            expect(commands).toBeInstanceOf(Commands);
        });

        it('should have inject property', () => {
            expect(Commands.inject).toEqual(['emitter', 'injector']);
        });

        it('should initialize with empty list', () => {
            expect(commands.list).toEqual({});
        });

        it('should store emitter reference', () => {
            expect(commands.emitter).toBe(emitter);
        });

        it('should store injector reference', () => {
            expect(commands.injector).toBe(injector);
        });
    });

    describe('Command Registration', () => {
        it('should add a command', () => {
            class TestCommand {
                execute() {}
            }

            const options = commands.add('test-command', TestCommand);
            expect(commands.list['test-command']).toBe(TestCommand);
            expect(options).toBeDefined();
            expect(options.setInjector).toBeDefined();
        });

        it('should throw error when adding duplicate command', () => {
            class TestCommand {
                execute() {}
            }

            commands.add('test-command', TestCommand);
            expect(() => {
                commands.add('test-command', TestCommand);
            }).toThrow('[Commands] Error: a command with the id: "test-command" has already been registered');
        });

        it('should get a registered command', () => {
            class TestCommand {
                execute() {}
            }

            commands.add('test-command', TestCommand);
            const retrieved = commands.get('test-command');
            expect(retrieved).toBe(TestCommand);
        });

        it('should return undefined for non-existent command', () => {
            const retrieved = commands.get('non-existent');
            expect(retrieved).toBeUndefined();
        });
    });

    describe('Command Execution', () => {
        it('should execute command when signal is dispatched', () => {
            const executeSpy = jest.fn();

            class TestCommand {
                execute() {
                    executeSpy();
                }
            }

            commands.add('test-command', TestCommand);
            emitter.dispatch('test-command');

            expect(executeSpy).toHaveBeenCalledTimes(1);
        });

        it('should pass arguments to command execute method', () => {
            const executeSpy = jest.fn();

            class TestCommand {
                execute(...args: any[]) {
                    executeSpy(...args);
                }
            }

            commands.add('test-command', TestCommand);
            emitter.dispatch('test-command', { data: 42, extra: 'test' });

            expect(executeSpy).toHaveBeenCalledWith(expect.objectContaining({
                data: 42,
                extra: 'test'
            }));
        });

        it('should inject id into command', () => {
            let receivedId: string | undefined;

            class TestCommand {
                id?: string;
                execute() {
                    receivedId = this.id;
                }
            }

            commands.add('test-command', TestCommand);
            emitter.dispatch('test-command');

            expect(receivedId).toBe('test-command');
        });

        it('should inject signal into command', () => {
            let receivedSignal: any;

            class TestCommand {
                signal?: any;
                execute() {
                    receivedSignal = this.signal;
                }
            }

            commands.add('test-command', TestCommand);
            emitter.dispatch('test-command');

            expect(receivedSignal).toBe(emitter.getSignal('test-command'));
        });

        it('should inject binding into command', () => {
            let receivedBinding: any;

            class TestCommand {
                binding?: any;
                execute() {
                    receivedBinding = this.binding;
                }
            }

            commands.add('test-command', TestCommand);
            emitter.dispatch('test-command');

            expect(receivedBinding).toBeDefined();
            expect(receivedBinding.getListener()).toBeDefined();
        });

        it('should use child injector for each command execution', () => {
            const injectors: Injector[] = [];

            class TestCommand {
                injector?: Injector;
                execute() {
                    if (this.injector) {
                        injectors.push(this.injector);
                    }
                }
            }

            commands.add('test-command', TestCommand);
            emitter.dispatch('test-command');
            emitter.dispatch('test-command');

            expect(injectors.length).toBe(2);
            // Each execution should have its own child injector
            expect(injectors[0]).not.toBe(injectors[1]);
            // But they should both have the main injector as parent
            expect(injectors[0].parent).toBe(injector);
            expect(injectors[1].parent).toBe(injector);
        });

        it('should dispose child injector after command execution', () => {
            const disposeSpy = jest.fn();
            const originalCreateChild = injector.createChild.bind(injector);

            injector.createChild = function() {
                const child = originalCreateChild();
                const originalDispose = child.dispose.bind(child);
                child.dispose = function() {
                    disposeSpy();
                    originalDispose();
                };
                return child;
            };

            class TestCommand {
                execute() {}
            }

            commands.add('test-command', TestCommand);
            emitter.dispatch('test-command');

            expect(disposeSpy).toHaveBeenCalledTimes(1);
        });

        it('should not throw if execute method is missing', () => {
            class TestCommand {
                // No execute method
            }

            commands.add('test-command', TestCommand);
            expect(() => {
                emitter.dispatch('test-command');
            }).not.toThrow();
        });
    });

    describe('Command Options', () => {
        it('should allow setting custom injector', () => {
            const customInjector = new Injector();
            customInjector.mapValue('customValue', 'test');

            let receivedValue: any;

            class TestCommand {
                customValue?: any;
                execute() {
                    receivedValue = this.customValue;
                }
            }

            commands.add('test-command', TestCommand)
                .setInjector(customInjector);

            emitter.dispatch('test-command');

            expect(receivedValue).toBe('test');
            customInjector.dispose();
        });

        it('should chain setInjector calls', () => {
            const customInjector = new Injector();

            class TestCommand {
                execute() {}
            }

            const options = commands.add('test-command', TestCommand);
            const result = options.setInjector(customInjector);

            expect(result).toBeDefined();
            expect(result.setInjector).toBeDefined();
            customInjector.dispose();
        });
    });

    describe('Command Removal', () => {
        it('should remove a command', () => {
            class TestCommand {
                execute() {}
            }

            commands.add('test-command', TestCommand);
            commands.remove('test-command');

            expect(commands.list['test-command']).toBeUndefined();
        });

        it('should remove signal when command is removed', () => {
            const executeSpy = jest.fn();

            class TestCommand {
                execute() {
                    executeSpy();
                }
            }

            commands.add('test-command', TestCommand);
            commands.remove('test-command');
            emitter.dispatch('test-command');

            expect(executeSpy).not.toHaveBeenCalled();
        });

        it('should handle removing non-existent command', () => {
            expect(() => {
                commands.remove('non-existent');
            }).not.toThrow();
        });

        it('should handle removing already removed command', () => {
            class TestCommand {
                execute() {}
            }

            commands.add('test-command', TestCommand);
            commands.remove('test-command');

            expect(() => {
                commands.remove('test-command');
            }).not.toThrow();
        });
    });

    describe('Multiple Commands', () => {
        it('should handle multiple different commands', () => {
            const spy1 = jest.fn();
            const spy2 = jest.fn();

            class Command1 {
                execute() {
                    spy1();
                }
            }

            class Command2 {
                execute() {
                    spy2();
                }
            }

            commands.add('command-1', Command1);
            commands.add('command-2', Command2);

            emitter.dispatch('command-1');
            expect(spy1).toHaveBeenCalledTimes(1);
            expect(spy2).not.toHaveBeenCalled();

            emitter.dispatch('command-2');
            expect(spy1).toHaveBeenCalledTimes(1);
            expect(spy2).toHaveBeenCalledTimes(1);
        });

        it('should pass different data to different commands', () => {
            const received1: any[] = [];
            const received2: any[] = [];

            class Command1 {
                execute(data: any) {
                    received1.push(data);
                }
            }

            class Command2 {
                execute(data: any) {
                    received2.push(data);
                }
            }

            commands.add('command-1', Command1);
            commands.add('command-2', Command2);

            emitter.dispatch('command-1', { id: 1 });
            emitter.dispatch('command-2', { id: 2 });

            expect(received1[0]).toEqual(expect.objectContaining({ id: 1 }));
            expect(received2[0]).toEqual(expect.objectContaining({ id: 2 }));
        });
    });

    describe('Disposal', () => {
        it('should remove all commands on dispose', () => {
            class Command1 {
                execute() {}
            }
            class Command2 {
                execute() {}
            }

            commands.add('command-1', Command1);
            commands.add('command-2', Command2);

            commands.dispose();

            expect(commands.list['command-1']).toBeUndefined();
            expect(commands.list['command-2']).toBeUndefined();
            expect(commands.list).toEqual({});
        });

        it('should remove all signals on dispose', () => {
            const spy1 = jest.fn();
            const spy2 = jest.fn();

            class Command1 {
                execute() {
                    spy1();
                }
            }
            class Command2 {
                execute() {
                    spy2();
                }
            }

            commands.add('command-1', Command1);
            commands.add('command-2', Command2);

            commands.dispose();

            emitter.dispatch('command-1');
            emitter.dispatch('command-2');

            expect(spy1).not.toHaveBeenCalled();
            expect(spy2).not.toHaveBeenCalled();
        });

        it('should clear emitter reference on dispose', () => {
            commands.dispose();
            expect(commands.emitter).toBeNull();
        });

        it('should clear injector reference on dispose', () => {
            commands.dispose();
            expect(commands.injector).toBeUndefined();
        });
    });

    describe('Integration with Dependency Injection', () => {
        it('should inject custom dependencies into command', () => {
            injector.mapValue('testData', { value: 42 });

            let receivedData: any;

            class TestCommand {
                testData?: any;
                execute() {
                    receivedData = this.testData;
                }
            }

            commands.add('test-command', TestCommand);
            emitter.dispatch('test-command');

            expect(receivedData).toEqual({ value: 42 });
        });

        it('should support constructor injection in commands', () => {
            injector.mapValue('dependency', 'injected-value');

            let receivedDependency: any;

            class TestCommand {
                static inject = ['dependency'];

                constructor(dependency: any) {
                    receivedDependency = dependency;
                }

                execute() {}
            }

            commands.add('test-command', TestCommand);
            emitter.dispatch('test-command');

            expect(receivedDependency).toBe('injected-value');
        });

        it('should support property injection in commands', () => {
            injector.mapValue('service', { name: 'test-service' });

            let receivedService: any;

            class TestCommand {
                service?: any;

                execute() {
                    receivedService = this.service;
                }
            }

            commands.add('test-command', TestCommand);
            emitter.dispatch('test-command');

            expect(receivedService).toEqual({ name: 'test-service' });
        });
    });
});
