// @ts-ignore
import Modules from '../src/Modules';
import { Injector } from '../src/infuse';

describe('Modules Tests', () => {
    let modules: Modules;
    let injector: Injector;

    beforeEach(() => {
        injector = new Injector();
        injector.mapValue('injector', injector);
        modules = new Modules(injector);
    });

    afterEach(() => {
        if (modules) {
            modules.dispose();
        }
        if (injector) {
            injector.dispose();
        }
    });

    describe('Basic Functionality', () => {
        it('should create a modules instance', () => {
            expect(modules).toBeDefined();
            expect(modules).toBeInstanceOf(Modules);
        });

        it('should have inject property', () => {
            expect(Modules.inject).toEqual(['injector']);
        });

        it('should store injector reference', () => {
            expect(modules.injector).toBe(injector);
        });

        it('should initialize with empty list', () => {
            expect(modules.list).toEqual({});
        });
    });

    describe('Module Creation', () => {
        it('should create a module from function', () => {
            const Module = function(this: any) {
                this.initialized = true;
            };
            Module.id = 'test-module';

            const instance = modules.create(Module);
            expect(instance).toBeDefined();
            expect((instance as any).initialized).toBe(true);
        });

        it('should create a module from object with module property', () => {
            const Module = function(this: any) {
                this.initialized = true;
            };
            Module.id = 'test-module';

            const instance = modules.create({ module: Module });
            expect(instance).toBeDefined();
            expect((instance as any).initialized).toBe(true);
        });

        it('should create a module from object with Module property (ES6 import style)', () => {
            const Module = function(this: any) {
                this.initialized = true;
            };
            Module.id = 'test-module';

            const instance = modules.create({ Module: Module });
            expect(instance).toBeDefined();
            expect((instance as any).initialized).toBe(true);
        });

        it('should throw error for invalid module', () => {
            expect(() => {
                modules.create({} as any);
            }).toThrow('[Modules] Error: Could not create module');
        });

        it('should throw error when module id is missing', () => {
            const Module = function() {};
            // No id property

            expect(() => {
                modules.create(Module as any);
            }).toThrow('[Modules] Error: Could not create module. The module function must contain a static "id" property');
        });

        it('should register module by default', () => {
            const Module = function() {};
            Module.id = 'test-module';

            modules.create(Module);
            expect(modules.has('test-module')).toBe(true);
        });

        it('should not register module when register is false', () => {
            const Module = function() {};
            Module.id = 'test-module';

            modules.create(Module, undefined, false);
            expect(modules.has('test-module')).toBe(false);
        });
    });

    describe('Module Retrieval', () => {
        it('should check if module exists', () => {
            const Module = function() {};
            Module.id = 'test-module';

            expect(modules.has('test-module')).toBe(false);
            modules.create(Module);
            expect(modules.has('test-module')).toBe(true);
        });

        it('should get a registered module', () => {
            const Module = function(this: any) {
                this.name = 'test';
            };
            Module.id = 'test-module';

            const instance = modules.create(Module);
            const retrieved = modules.get('test-module');

            expect(retrieved).toBe(instance);
            expect((retrieved as any).name).toBe('test');
        });

        it('should return undefined for non-existent module', () => {
            const retrieved = modules.get('non-existent');
            expect(retrieved).toBeUndefined();
        });

        it('should return existing module on duplicate creation', () => {
            const Module = function(this: any) {
                this.count = (this.count || 0) + 1;
            };
            Module.id = 'test-module';

            const instance1 = modules.create(Module);
            const instance2 = modules.create(Module);

            expect(instance1).toBe(instance2);
            expect((instance1 as any).count).toBe(1); // Only constructed once
        });
    });

    describe('Module Lifecycle', () => {
        it('should call init after creation', () => {
            const initSpy = jest.fn();

            const Module = function(this: any) {
                this.init = initSpy;
            };
            Module.id = 'test-module';

            modules.create(Module);
            expect(initSpy).toHaveBeenCalledTimes(1);
        });

        it('should not throw if init is missing', () => {
            const Module = function() {};
            Module.id = 'test-module';

            expect(() => {
                modules.create(Module);
            }).not.toThrow();
        });

        it('should call dispose on module removal', () => {
            const disposeSpy = jest.fn();

            const Module = function(this: any) {
                this.dispose = disposeSpy;
            };
            Module.id = 'test-module';

            modules.create(Module);
            modules.remove('test-module');

            expect(disposeSpy).toHaveBeenCalledTimes(1);
        });

        it('should not throw if dispose is missing', () => {
            const Module = function() {};
            Module.id = 'test-module';

            modules.create(Module);

            expect(() => {
                modules.remove('test-module');
            }).not.toThrow();
        });

        it('should remove module from list on removal', () => {
            const Module = function() {};
            Module.id = 'test-module';

            modules.create(Module);
            expect(modules.has('test-module')).toBe(true);

            modules.remove('test-module');
            expect(modules.has('test-module')).toBe(false);
        });

        it('should handle removing non-existent module', () => {
            expect(() => {
                modules.remove('non-existent');
            }).not.toThrow();
        });
    });

    describe('Module Arguments', () => {
        it('should pass arguments to module constructor', () => {
            const receivedArgs: any[] = [];

            const Module = function(...args: any[]) {
                receivedArgs.push(...args);
            };
            Module.id = 'test-module';

            const args = [1, 'test', { data: true }, [1, 2, 3]];
            modules.create(Module, args);

            expect(receivedArgs).toEqual(args);
        });

        it('should pass arguments after injected dependencies', () => {
            injector.mapValue('service', 'injected-service');

            const receivedArgs: any[] = [];

            const Module = function(this: any, service: any, ...args: any[]) {
                receivedArgs.push(service);
                receivedArgs.push(...args);
            };
            Module.id = 'test-module';
            (Module as any).inject = ['service'];

            modules.create(Module, ['arg1', 'arg2']);

            expect(receivedArgs[0]).toBe('injected-service');
            expect(receivedArgs[1]).toBe('arg1');
            expect(receivedArgs[2]).toBe('arg2');
        });

        it('should handle no arguments', () => {
            const Module = function(...args: any[]) {
                expect(args.length).toBe(0);
            };
            Module.id = 'test-module';

            modules.create(Module);
        });

        it('should handle empty arguments array', () => {
            const Module = function(...args: any[]) {
                expect(args.length).toBe(0);
            };
            Module.id = 'test-module';

            modules.create(Module, []);
        });
    });

    describe('Dependency Injection', () => {
        it('should inject dependencies into module', () => {
            injector.mapValue('testValue', 42);

            let receivedValue: any;

            const Module = function(this: any, testValue: any) {
                receivedValue = testValue;
            };
            Module.id = 'test-module';
            (Module as any).inject = ['testValue'];

            modules.create(Module);
            expect(receivedValue).toBe(42);
        });

        it('should inject injector into module', () => {
            let receivedInjector: any;

            const Module = function(this: any) {
                this.injector = undefined;
            };
            Module.id = 'test-module';

            const instance = modules.create(Module);
            receivedInjector = (instance as any).injector;

            expect(receivedInjector).toBe(injector);
        });

        it('should support property injection', () => {
            injector.mapValue('service', { name: 'test-service' });

            const Module = function(this: any) {
                this.service = undefined;
            };
            Module.id = 'test-module';

            const instance = modules.create(Module);
            expect((instance as any).service).toEqual({ name: 'test-service' });
        });

        it('should call postConstruct after injection', () => {
            injector.mapValue('dependency', 'test-value');

            const events: string[] = [];
            let injectedValue: any;

            const Module = function(this: any) {
                events.push('constructor');
                this.dependency = undefined;
                this.postConstruct = function() {
                    events.push('postConstruct');
                    injectedValue = this.dependency;
                };
            };
            Module.id = 'test-module';

            modules.create(Module);

            expect(events).toEqual(['constructor', 'postConstruct']);
            expect(injectedValue).toBe('test-value');
        });

        it('should inject undefined for missing dependencies', () => {
            let receivedValue: any = 'not-undefined';

            const Module = function(this: any, missingDep: any) {
                receivedValue = missingDep;
            };
            Module.id = 'test-module';
            (Module as any).inject = ['missingDep'];

            modules.create(Module);
            expect(receivedValue).toBeUndefined();
        });
    });

    describe('Child Injector', () => {
        it('should use main injector by default', () => {
            let moduleInjector: any;

            const Module = function(this: any) {
                this.injector = undefined;
            };
            Module.id = 'test-module';

            const instance = modules.create(Module);
            moduleInjector = (instance as any).injector;

            expect(moduleInjector).toBe(injector);
        });

        it('should use child injector when useChildInjector is true', () => {
            let moduleInjector: any;

            const Module = function(this: any) {
                this.injector = undefined;
            };
            Module.id = 'test-module';

            const instance = modules.create(Module, undefined, true, true);
            moduleInjector = (instance as any).injector;

            expect(moduleInjector).not.toBe(injector);
            expect(moduleInjector.parent).toBe(injector);
        });

        it('should map child injector to itself when useChildInjector is true', () => {
            let moduleInjector: any;
            let mappedInjector: any;

            const Module = function(this: any) {
                this.injector = undefined;
                this.postConstruct = function() {
                    mappedInjector = this.injector?.getValue('injector');
                };
            };
            Module.id = 'test-module';

            const instance = modules.create(Module, undefined, true, true);
            moduleInjector = (instance as any).injector;

            expect(mappedInjector).toBe(moduleInjector);
        });
    });

    describe('Multiple Modules', () => {
        it('should handle multiple different modules', () => {
            const Module1 = function(this: any) {
                this.id = 'module-1';
            };
            Module1.id = 'module-1';

            const Module2 = function(this: any) {
                this.id = 'module-2';
            };
            Module2.id = 'module-2';

            const instance1 = modules.create(Module1);
            const instance2 = modules.create(Module2);

            expect((instance1 as any).id).toBe('module-1');
            expect((instance2 as any).id).toBe('module-2');
            expect(modules.has('module-1')).toBe(true);
            expect(modules.has('module-2')).toBe(true);
        });

        it('should keep modules isolated', () => {
            const Module1 = function(this: any) {
                this.data = 'module-1-data';
            };
            Module1.id = 'module-1';

            const Module2 = function(this: any) {
                this.data = 'module-2-data';
            };
            Module2.id = 'module-2';

            const instance1 = modules.create(Module1);
            const instance2 = modules.create(Module2);

            expect((instance1 as any).data).toBe('module-1-data');
            expect((instance2 as any).data).toBe('module-2-data');
        });
    });

    describe('Disposal', () => {
        it('should remove all modules on dispose', () => {
            const Module1 = function() {};
            Module1.id = 'module-1';
            const Module2 = function() {};
            Module2.id = 'module-2';

            modules.create(Module1);
            modules.create(Module2);

            modules.dispose();

            expect(modules.has('module-1')).toBe(false);
            expect(modules.has('module-2')).toBe(false);
            expect(modules.list).toEqual({});
        });

        it('should call dispose on all modules', () => {
            const dispose1 = jest.fn();
            const dispose2 = jest.fn();

            const Module1 = function(this: any) {
                this.dispose = dispose1;
            };
            Module1.id = 'module-1';

            const Module2 = function(this: any) {
                this.dispose = dispose2;
            };
            Module2.id = 'module-2';

            modules.create(Module1);
            modules.create(Module2);

            modules.dispose();

            expect(dispose1).toHaveBeenCalledTimes(1);
            expect(dispose2).toHaveBeenCalledTimes(1);
        });
    });

    describe('Complex Scenarios', () => {
        it('should handle module creating other modules', () => {
            injector.mapValue('modules', modules);

            const ChildModule = function(this: any) {
                this.type = 'child';
            };
            ChildModule.id = 'child-module';

            const ParentModule = function(this: any) {
                this.modules = undefined;
                this.postConstruct = function() {
                    this.child = this.modules?.create(ChildModule);
                };
            };
            ParentModule.id = 'parent-module';

            const parent = modules.create(ParentModule) as any;

            expect(parent.child).toBeDefined();
            expect(parent.child.type).toBe('child');
            expect(modules.has('child-module')).toBe(true);
        });

        it('should support module inheritance patterns', () => {
            const baseInitSpy = jest.fn();
            const extendedInitSpy = jest.fn();

            const BaseModule = function(this: any) {
                this.base = true;
                this.init = baseInitSpy;
            };
            BaseModule.id = 'base-module';

            const ExtendedModule = function(this: any) {
                BaseModule.call(this);
                this.extended = true;
                const baseInit = this.init;
                this.init = function() {
                    baseInit.call(this);
                    extendedInitSpy();
                };
            };
            ExtendedModule.id = 'extended-module';

            const instance = modules.create(ExtendedModule) as any;

            expect(instance.base).toBe(true);
            expect(instance.extended).toBe(true);
            expect(baseInitSpy).toHaveBeenCalledTimes(1);
            expect(extendedInitSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle module with complex dependencies', () => {
            const service1 = { name: 'service1' };
            const service2 = { name: 'service2' };

            injector.mapValue('service1', service1);
            injector.mapValue('service2', service2);

            let deps: any[] = [];

            const Module = function(this: any, s1: any, s2: any) {
                deps = [s1, s2];
            };
            Module.id = 'complex-module';
            (Module as any).inject = ['service1', 'service2'];

            modules.create(Module);

            expect(deps[0]).toBe(service1);
            expect(deps[1]).toBe(service2);
        });
    });
});
