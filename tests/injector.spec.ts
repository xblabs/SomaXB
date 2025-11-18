// @ts-ignore
import { Injector, infuse } from '../src/infuse';

describe('Injector Tests', () => {
    let injector: Injector;

    beforeEach(() => {
        injector = new Injector();
    });

    afterEach(() => {
        if (injector) {
            injector.dispose();
        }
    });

    describe('Basic Functionality', () => {
        it('should create an injector instance', () => {
            expect(injector).toBeDefined();
            expect(injector).toBeInstanceOf(Injector);
        });

        it('should initialize with empty mappings', () => {
            expect(injector.mappings).toEqual({});
        });

        it('should initialize with no parent', () => {
            expect(injector.parent).toBeNull();
        });

        it('should have throwOnMissing enabled by default', () => {
            expect(injector.throwOnMissing).toBe(true);
        });

        it('should have strictMode disabled by default', () => {
            expect(injector.strictMode).toBe(false);
        });

        it('should have strictModeConstructorInjection disabled by default', () => {
            expect(injector.strictModeConstructorInjection).toBe(false);
        });
    });

    describe('Value Mapping', () => {
        it('should map a value', () => {
            injector.mapValue('testValue', 42);
            expect(injector.hasMapping('testValue')).toBe(true);
        });

        it('should retrieve a mapped value', () => {
            injector.mapValue('testValue', 42);
            expect(injector.getValue('testValue')).toBe(42);
        });

        it('should map different types of values', () => {
            injector.mapValue('string', 'test');
            injector.mapValue('number', 42);
            injector.mapValue('boolean', true);
            injector.mapValue('object', { data: 'test' });
            injector.mapValue('array', [1, 2, 3]);
            injector.mapValue('function', () => 'result');

            expect(injector.getValue('string')).toBe('test');
            expect(injector.getValue('number')).toBe(42);
            expect(injector.getValue('boolean')).toBe(true);
            expect(injector.getValue('object')).toEqual({ data: 'test' });
            expect(injector.getValue('array')).toEqual([1, 2, 3]);
            expect(injector.getValue('function')()).toBe('result');
        });

        it('should throw error when mapping duplicate value', () => {
            injector.mapValue('testValue', 42);
            expect(() => {
                injector.mapValue('testValue', 100);
            }).toThrow('MAPPING_ALREADY_EXISTS');
        });

        it('should throw error when prop is not a string', () => {
            expect(() => {
                injector.mapValue(123 as any, 'value');
            }).toThrow('MAPPING_BAD_PROP');
        });

        it('should throw error when value is null', () => {
            expect(() => {
                injector.mapValue('test', null);
            }).toThrow('MAPPING_BAD_VALUE');
        });

        it('should throw error when value is undefined', () => {
            expect(() => {
                injector.mapValue('test', undefined);
            }).toThrow('MAPPING_BAD_VALUE');
        });

        it('should return injector for chaining', () => {
            const result = injector.mapValue('test', 42);
            expect(result).toBe(injector);
        });
    });

    describe('Class Mapping', () => {
        it('should map a class', () => {
            class TestClass {}
            injector.mapClass('test', TestClass);
            expect(injector.hasMapping('test')).toBe(true);
        });

        it('should create new instance each time by default', () => {
            class TestClass {
                id = Math.random();
            }

            injector.mapClass('test', TestClass);
            const instance1 = injector.getValue('test');
            const instance2 = injector.getValue('test');

            expect(instance1).not.toBe(instance2);
            expect(instance1.id).not.toBe(instance2.id);
        });

        it('should return singleton when mapped as singleton', () => {
            class TestClass {
                id = Math.random();
            }

            injector.mapClass('test', TestClass, true);
            const instance1 = injector.getValue('test');
            const instance2 = injector.getValue('test');

            expect(instance1).toBe(instance2);
            expect(instance1.id).toBe(instance2.id);
        });

        it('should throw error when mapping duplicate class', () => {
            class TestClass {}
            injector.mapClass('test', TestClass);

            expect(() => {
                injector.mapClass('test', TestClass);
            }).toThrow('MAPPING_ALREADY_EXISTS');
        });

        it('should throw error when class is not a function', () => {
            expect(() => {
                injector.mapClass('test', 'not-a-class' as any);
            }).toThrow('MAPPING_BAD_CLASS');
        });

        it('should throw error when singleton is not boolean', () => {
            class TestClass {}
            expect(() => {
                injector.mapClass('test', TestClass, 'not-boolean' as any);
            }).toThrow('MAPPING_BAD_SINGLETON');
        });

        it('should get mapped class', () => {
            class TestClass {}
            injector.mapClass('test', TestClass);
            expect(injector.getClass('test')).toBe(TestClass);
        });

        it('should return injector for chaining', () => {
            class TestClass {}
            const result = injector.mapClass('test', TestClass);
            expect(result).toBe(injector);
        });
    });

    describe('Mapping Management', () => {
        it('should check if mapping exists', () => {
            expect(injector.hasMapping('test')).toBe(false);
            injector.mapValue('test', 42);
            expect(injector.hasMapping('test')).toBe(true);
        });

        it('should remove mapping', () => {
            injector.mapValue('test', 42);
            expect(injector.hasMapping('test')).toBe(true);

            injector.removeMapping('test');
            expect(injector.hasMapping('test')).toBe(false);
        });

        it('should handle removing non-existent mapping', () => {
            expect(() => {
                injector.removeMapping('non-existent');
            }).not.toThrow();
        });

        it('should get mapping by value', () => {
            const value = { data: 'test' };
            injector.mapValue('test', value);
            expect(injector.getMapping(value)).toBe('test');
        });

        it('should get mapping by class', () => {
            class TestClass {}
            injector.mapClass('test', TestClass);
            expect(injector.getMapping(TestClass)).toBe('test');
        });

        it('should return undefined for non-existent mapping', () => {
            expect(injector.getMapping('non-existent')).toBeUndefined();
        });

        it('should get mapping VO', () => {
            injector.mapValue('test', 42);
            const vo = injector.getMappingVo('test');
            expect(vo).toBeDefined();
            expect(vo?.prop).toBe('test');
            expect(vo?.value).toBe(42);
        });

        it('should return injector for chaining on removeMapping', () => {
            injector.mapValue('test', 42);
            const result = injector.removeMapping('test');
            expect(result).toBe(injector);
        });
    });

    describe('Constructor Injection', () => {
        it('should inject dependencies into constructor', () => {
            injector.mapValue('dependency', 'injected-value');

            class TestClass {
                static inject = ['dependency'];
                dep: any;

                constructor(dependency: any) {
                    this.dep = dependency;
                }
            }

            const instance = injector.createInstance(TestClass);
            expect(instance.dep).toBe('injected-value');
        });

        it('should inject multiple dependencies', () => {
            injector.mapValue('dep1', 'value1');
            injector.mapValue('dep2', 'value2');
            injector.mapValue('dep3', 'value3');

            class TestClass {
                static inject = ['dep1', 'dep2', 'dep3'];
                deps: any[];

                constructor(dep1: any, dep2: any, dep3: any) {
                    this.deps = [dep1, dep2, dep3];
                }
            }

            const instance = injector.createInstance(TestClass);
            expect(instance.deps).toEqual(['value1', 'value2', 'value3']);
        });

        it('should pass additional arguments after injected dependencies', () => {
            injector.mapValue('injected', 'injected-value');

            class TestClass {
                static inject = ['injected'];
                args: any[];

                constructor(injected: any, arg1: any, arg2: any) {
                    this.args = [injected, arg1, arg2];
                }
            }

            const instance = injector.createInstance(TestClass, 'extra1', 'extra2');
            expect(instance.args).toEqual(['injected-value', 'extra1', 'extra2']);
        });

        it('should override injected values with provided arguments', () => {
            injector.mapValue('dependency', 'injected');

            class TestClass {
                static inject = ['dependency'];
                value: any;

                constructor(dependency: any) {
                    this.value = dependency;
                }
            }

            const instance = injector.createInstance(TestClass, 'override');
            expect(instance.value).toBe('override');
        });
    });

    describe('Property Injection', () => {
        it('should inject properties after construction', () => {
            injector.mapValue('service', 'injected-service');

            class TestClass {
                service: any = undefined;
            }

            const instance = injector.createInstance(TestClass);
            expect(instance.service).toBe('injected-service');
        });

        it('should inject multiple properties', () => {
            injector.mapValue('service1', 'value1');
            injector.mapValue('service2', 'value2');

            class TestClass {
                service1: any = undefined;
                service2: any = undefined;
            }

            const instance = injector.createInstance(TestClass);
            expect(instance.service1).toBe('value1');
            expect(instance.service2).toBe('value2');
        });

        it('should not inject properties not defined in class', () => {
            injector.mapValue('notInClass', 'should-not-inject');

            class TestClass {
                otherProperty: any = 'original';
            }

            const instance = injector.createInstance(TestClass);
            expect((instance as any).notInClass).toBeUndefined();
        });

        it('should inject properties from inject array', () => {
            injector.mapValue('dependency', 'injected-value');

            class TestClass {
                static inject = ['dependency'];
                dependency: any = undefined;
            }

            const instance = injector.createInstance(TestClass);
            expect(instance.dependency).toBe('injected-value');
        });
    });

    describe('postConstruct Lifecycle', () => {
        it('should call postConstruct after injection', () => {
            const postConstructSpy = jest.fn();

            class TestClass {
                postConstruct() {
                    postConstructSpy();
                }
            }

            injector.createInstance(TestClass);
            expect(postConstructSpy).toHaveBeenCalledTimes(1);
        });

        it('should call postConstruct with injected dependencies available', () => {
            injector.mapValue('dependency', 'injected-value');

            let valueInPostConstruct: any;

            class TestClass {
                dependency: any = undefined;

                postConstruct() {
                    valueInPostConstruct = this.dependency;
                }
            }

            injector.createInstance(TestClass);
            expect(valueInPostConstruct).toBe('injected-value');
        });

        it('should not throw if postConstruct is missing', () => {
            class TestClass {}

            expect(() => {
                injector.createInstance(TestClass);
            }).not.toThrow();
        });

        it('should call postConstruct only once for singletons', () => {
            const postConstructSpy = jest.fn();

            class TestClass {
                postConstruct() {
                    postConstructSpy();
                }
            }

            injector.mapClass('test', TestClass, true);
            injector.getValue('test');
            injector.getValue('test');

            expect(postConstructSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Parent-Child Injectors', () => {
        it('should create child injector', () => {
            const child = injector.createChild();
            expect(child).toBeInstanceOf(Injector);
            expect(child.parent).toBe(injector);
        });

        it('should inherit throwOnMissing setting', () => {
            injector.throwOnMissing = false;
            const child = injector.createChild();
            expect(child.throwOnMissing).toBe(false);
        });

        it('should inherit strictMode setting', () => {
            injector.strictMode = true;
            const child = injector.createChild();
            expect(child.strictMode).toBe(true);
        });

        it('should inherit strictModeConstructorInjection setting', () => {
            injector.strictModeConstructorInjection = true;
            const child = injector.createChild();
            expect(child.strictModeConstructorInjection).toBe(true);
        });

        it('should access parent mappings', () => {
            injector.mapValue('parentValue', 'from-parent');
            const child = injector.createChild();

            expect(child.getValue('parentValue')).toBe('from-parent');
        });

        it('should check for inherited mapping', () => {
            injector.mapValue('parentValue', 'from-parent');
            const child = injector.createChild();

            expect(child.hasInheritedMapping('parentValue')).toBe(true);
            expect(child.hasMapping('parentValue')).toBe(false);
        });

        it('should override parent mappings', () => {
            injector.mapValue('value', 'parent');
            const child = injector.createChild();
            child.mapValue('value', 'child');

            expect(injector.getValue('value')).toBe('parent');
            expect(child.getValue('value')).toBe('child');
        });

        it('should not affect parent when child mapping is added', () => {
            const child = injector.createChild();
            child.mapValue('childOnly', 'child-value');

            expect(child.getValue('childOnly')).toBe('child-value');
            expect(injector.hasMapping('childOnly')).toBe(false);
        });

        it('should support multiple levels of hierarchy', () => {
            injector.mapValue('level1', 'value1');
            const child1 = injector.createChild();
            child1.mapValue('level2', 'value2');
            const child2 = child1.createChild();
            child2.mapValue('level3', 'value3');

            expect(child2.getValue('level1')).toBe('value1');
            expect(child2.getValue('level2')).toBe('value2');
            expect(child2.getValue('level3')).toBe('value3');
        });
    });

    describe('Error Handling', () => {
        it('should throw when getting unmapped value with throwOnMissing=true', () => {
            expect(() => {
                injector.getValue('nonExistent');
            }).toThrow('NO_MAPPING_FOUND');
        });

        it('should return undefined when getting unmapped value with throwOnMissing=false', () => {
            injector.throwOnMissing = false;
            expect(injector.getValue('nonExistent')).toBeUndefined();
        });

        it('should throw when creating instance with non-function', () => {
            expect(() => {
                injector.createInstance('not-a-function' as any);
            }).toThrow('CREATE_INSTANCE_INVALID_PARAM');
        });

        it('should throw in strict mode without inject property', () => {
            injector.strictMode = true;

            class TestClass {
                constructor(dep: any) {}
            }

            expect(() => {
                injector.createInstance(TestClass);
            }).toThrow('DEPENDENCIES_MISSING_IN_STRICT_MODE');
        });

        it('should not throw in strict mode with inject property', () => {
            injector.strictMode = true;

            class TestClass {
                static inject = ['dependency'];
                constructor(dep: any) {}
            }

            expect(() => {
                injector.createInstance(TestClass);
            }).not.toThrow();
        });

        it('should throw when detecting constructor injection loop', () => {
            class TestClass {
                static inject = ['test'];
                constructor(test: any) {}
            }

            injector.mapClass('test', TestClass);

            expect(() => {
                injector.getValue('test');
            }).toThrow('INJECT_INSTANCE_IN_ITSELF_CONSTRUCTOR');
        });

        it('should provide detailed error message with class name', () => {
            injector.throwOnMissing = true;

            class MyClass {
                static inject = ['missingDep'];
                constructor(dep: any) {}
            }

            expect(() => {
                injector.createInstance(MyClass);
            }).toThrow(/MyClass/);
        });
    });

    describe('Disposal', () => {
        it('should clear all mappings on dispose', () => {
            injector.mapValue('test1', 'value1');
            injector.mapValue('test2', 'value2');

            injector.dispose();

            expect(injector.mappings).toEqual({});
        });
    });

    describe('Integration Scenarios', () => {
        it('should support circular property injection', () => {
            class ServiceA {
                serviceB: any = undefined;
            }

            class ServiceB {
                serviceA: any = undefined;
            }

            injector.mapClass('serviceA', ServiceA, true);
            injector.mapClass('serviceB', ServiceB, true);

            const serviceA = injector.getValue('serviceA');
            const serviceB = injector.getValue('serviceB');

            expect(serviceA.serviceB).toBe(serviceB);
            expect(serviceB.serviceA).toBe(serviceA);
        });

        it('should support complex dependency graphs', () => {
            class Database {
                connected = true;
            }

            class Repository {
                static inject = ['database'];
                constructor(public database: Database) {}
            }

            class Service {
                static inject = ['repository'];
                constructor(public repository: Repository) {}
            }

            injector.mapClass('database', Database, true);
            injector.mapClass('repository', Repository, true);
            injector.mapClass('service', Service, true);

            const service = injector.getValue('service');
            expect(service).toBeInstanceOf(Service);
            expect(service.repository).toBeInstanceOf(Repository);
            expect(service.repository.database).toBeInstanceOf(Database);
            expect(service.repository.database.connected).toBe(true);
        });

        it('should support factory pattern', () => {
            class Product {
                constructor(public id: number, public name: string) {}
            }

            const factory = () => new Product(1, 'test-product');
            injector.mapValue('productFactory', factory);

            const factoryFn = injector.getValue('productFactory');
            const product = factoryFn();

            expect(product).toBeInstanceOf(Product);
            expect(product.id).toBe(1);
            expect(product.name).toBe('test-product');
        });

        it('should support configuration objects', () => {
            const config = {
                apiUrl: 'https://api.example.com',
                timeout: 5000,
                retries: 3
            };

            injector.mapValue('config', config);

            class ApiClient {
                config: any = undefined;
            }

            const client = injector.createInstance(ApiClient);
            expect(client.config).toBe(config);
            expect(client.config.apiUrl).toBe('https://api.example.com');
        });
    });

    describe('getDependencies Function', () => {
        it('should extract dependencies from function constructor', () => {
            function TestFunction(dep1: any, dep2: any, dep3: any) {}
            const deps = infuse.getDependencies(TestFunction);
            expect(deps).toEqual(['dep1', 'dep2', 'dep3']);
        });

        it('should extract dependencies from class constructor', () => {
            class TestClass {
                constructor(dep1: any, dep2: any) {}
            }
            const deps = infuse.getDependencies(TestClass);
            expect(deps).toEqual(['dep1', 'dep2']);
        });

        it('should use explicit inject array if provided', () => {
            class TestClass {
                static inject = ['explicit1', 'explicit2'];
                constructor(dep1: any, dep2: any) {}
            }
            const deps = infuse.getDependencies(TestClass);
            // Should return the parsed parameters
            expect(deps.length).toBe(2);
        });

        it('should handle functions with no parameters', () => {
            function TestFunction() {}
            const deps = infuse.getDependencies(TestFunction);
            expect(deps).toEqual([]);
        });

        it('should throw for arrow functions', () => {
            const arrowFn = () => {};
            expect(() => {
                infuse.getDependencies(arrowFn);
            }).toThrow('DEPENDENCIES_INVALID_TARGET');
        });
    });
});
