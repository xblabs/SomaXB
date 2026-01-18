// @ts-ignore
import Mediators from '../src/Mediators';
import Emitter from '../src/Emitter';
import { Injector } from '../src/infuse';

describe('Mediators Tests', () => {
    let mediators: Mediators;
    let emitter: Emitter;
    let injector: Injector;

    beforeEach(() => {
        emitter = new Emitter();
        injector = new Injector();
        injector.mapValue('emitter', emitter);
        injector.mapValue('injector', injector);
        mediators = injector.createInstance(Mediators);
    });

    afterEach(() => {
        if (mediators) {
            mediators.dispose();
        }
        if (emitter) {
            emitter.dispose();
        }
        if (injector) {
            injector.dispose();
        }
    });

    describe('Basic Functionality', () => {
        it('should create a mediators instance', () => {
            expect(mediators).toBeDefined();
            expect(mediators).toBeInstanceOf(Mediators);
        });

        it('should have inject property', () => {
            expect(Mediators.inject).toEqual(['emitter', 'injector']);
        });

        it('should inject emitter', () => {
            expect(mediators.emitter).toBe(emitter);
        });

        it('should inject injector', () => {
            expect(mediators.injector).toBe(injector);
        });
    });

    describe('Mediator Creation with HTMLElement', () => {
        let element: HTMLElement;

        beforeEach(() => {
            element = document.createElement('div');
            element.id = 'test-element';
        });

        it('should create mediator with single HTMLElement', () => {
            class TestMediator {
                static inject = ['target'];
                target?: HTMLElement;
                constructor() {}
            }

            const mediator = mediators.create(TestMediator, element);
            expect(mediator).toBeInstanceOf(TestMediator);
            expect((mediator as any).target).toBe(element);
        });

        it('should inject target into mediator', () => {
            let receivedTarget: HTMLElement | undefined;

            class TestMediator {
                static inject = ['target'];
                target?: HTMLElement;
                constructor() {}
                postConstruct() {
                    receivedTarget = this.target;
                }
            }

            mediators.create(TestMediator, element);
            expect(receivedTarget).toBe(element);
        });

        it('should call postConstruct after creation', () => {
            const postConstructSpy = jest.fn();

            class TestMediator {
                target?: HTMLElement;
                constructor() {}
                postConstruct() {
                    postConstructSpy();
                }
            }

            mediators.create(TestMediator, element);
            expect(postConstructSpy).toHaveBeenCalledTimes(1);
        });

        it('should use child injector for mediator', () => {
            let mediatorInjector: Injector | undefined;

            class TestMediator {
                static inject = ['injector', 'target'];
                injector?: Injector;
                target?: HTMLElement;
                constructor() {}
                postConstruct() {
                    mediatorInjector = this.injector;
                }
            }

            mediators.create(TestMediator, element);

            expect(mediatorInjector).toBeDefined();
            expect(mediatorInjector!.parent).toBe(injector);
        });
    });

    describe('Mediator Creation with Arrays', () => {
        let elements: HTMLElement[];

        beforeEach(() => {
            elements = [
                document.createElement('div'),
                document.createElement('div'),
                document.createElement('div')
            ];
            elements.forEach((el, i) => el.id = `element-${i}`);
        });

        it('should create single mediator for array when aggregateTarget is true', () => {
            class TestMediator {
                target?: any;
                constructor() {}
            }

            const result = mediators.create(TestMediator, elements, true);
            expect(result).toBeInstanceOf(TestMediator);
            expect(Array.isArray(result)).toBe(false);
        });

        it('should inject aggregated array as target', () => {
            let receivedTarget: any;

            class TestMediator {
                static inject = ['target'];
                target?: any;
                constructor() {}
                postConstruct() {
                    receivedTarget = this.target;
                }
            }

            mediators.create(TestMediator, elements, true);
            expect(receivedTarget).toEqual(elements);
        });

        it('should return empty array for empty element array', () => {
            class TestMediator {
                target?: any;
                constructor() {}
            }

            const result = mediators.create(TestMediator, [], true);
            expect(result).toEqual([]);
        });
    });

    describe('Mediator Creation with NodeList', () => {
        let container: HTMLElement;
        let nodeList: NodeListOf<Element>;

        beforeEach(() => {
            container = document.createElement('div');
            container.innerHTML = '<div class="item"></div><div class="item"></div><div class="item"></div>';
            document.body.appendChild(container);
            nodeList = container.querySelectorAll('.item');
        });

        afterEach(() => {
            document.body.removeChild(container);
        });

        it('should create mediator with NodeList when aggregateTarget is true', () => {
            class TestMediator {
                target?: any;
                constructor() {}
            }

            const result = mediators.create(TestMediator, nodeList, true);
            expect(result).toBeInstanceOf(TestMediator);
        });

        it('should create multiple mediators when aggregateTarget is false', () => {
            class TestMediator {
                target?: any;
                constructor() {}
            }

            const result = mediators.create(TestMediator, nodeList, false);
            expect(Array.isArray(result)).toBe(true);
            expect((result as any[]).length).toBe(3);
            (result as any[]).forEach(mediator => {
                expect(mediator).toBeInstanceOf(TestMediator);
            });
        });

        it('should inject individual elements when aggregateTarget is false', () => {
            const targets: any[] = [];

            class TestMediator {
                static inject = ['target'];
                target?: any;
                constructor() {}
                postConstruct() {
                    targets.push(this.target);
                }
            }

            mediators.create(TestMediator, nodeList, false);
            expect(targets.length).toBe(3);
            targets.forEach((target, i) => {
                expect(target).toBe(nodeList[i]);
            });
        });
    });

    describe('Mediator Creation with null/undefined', () => {
        it('should handle null target', () => {
            class TestMediator {
                target?: any;
                constructor() {}
            }

            const result = mediators.create(TestMediator, null);
            expect(result).toEqual([]);
        });

        it('should handle undefined target', () => {
            class TestMediator {
                target?: any;
                constructor() {}
            }

            const result = mediators.create(TestMediator, undefined);
            expect(result).toEqual([]);
        });
    });

    describe('Dependency Injection in Mediators', () => {
        let element: HTMLElement;

        beforeEach(() => {
            element = document.createElement('div');
        });

        it('should inject emitter into mediator', () => {
            let receivedEmitter: Emitter | undefined;

            class TestMediator {
                static inject = ['emitter', 'target'];
                emitter?: Emitter;
                target?: HTMLElement;
                constructor() {}
                postConstruct() {
                    receivedEmitter = this.emitter;
                }
            }

            mediators.create(TestMediator, element);
            expect(receivedEmitter).toBe(emitter);
        });

        it('should inject custom dependencies into mediator', () => {
            injector.mapValue('customService', { name: 'test-service' });

            let receivedService: any;

            class TestMediator {
                static inject = ['customService', 'target'];
                customService?: any;
                target?: HTMLElement;
                constructor() {}
                postConstruct() {
                    receivedService = this.customService;
                }
            }

            mediators.create(TestMediator, element);
            expect(receivedService).toEqual({ name: 'test-service' });
        });

        it('should support constructor injection in mediators', () => {
            injector.mapValue('dependency', 'injected-value');

            let receivedDependency: any;

            class TestMediator {
                static inject = ['dependency'];
                target?: HTMLElement;

                constructor(dependency: any) {
                    receivedDependency = dependency;
                }
            }

            mediators.create(TestMediator, element);
            expect(receivedDependency).toBe('injected-value');
        });
    });

    describe('Error Handling', () => {
        it('should throw error if injector is not present', () => {
            const medNoInjector = new Mediators();

            class TestMediator {
                target?: any;
                constructor() {}
            }

            const element = document.createElement('div');

            expect(() => {
                medNoInjector.create(TestMediator, element);
            }).toThrow('injector not present or has been disposed');
        });

        it('should throw error if injector has been disposed', () => {
            mediators.injector = undefined;

            class TestMediator {
                target?: any;
                constructor() {}
            }

            const element = document.createElement('div');

            expect(() => {
                mediators.create(TestMediator, element);
            }).toThrow('injector not present or has been disposed');
        });
    });

    describe('Disposal', () => {
        it('should clear emitter reference on dispose', () => {
            mediators.dispose();
            expect(mediators.emitter).toBeUndefined();
        });

        it('should clear injector reference on dispose', () => {
            mediators.dispose();
            expect(mediators.injector).toBeUndefined();
        });
    });

    describe('Integration Tests', () => {
        it('should create mediator that can dispatch signals', () => {
            const handler = jest.fn();
            emitter.addListener('test-signal', handler);

            const element = document.createElement('div');

            class TestMediator {
                static inject = ['emitter', 'target'];
                emitter?: Emitter;
                target?: HTMLElement;
                constructor() {}
                postConstruct() {
                    this.emitter?.dispatch('test-signal', { source: 'mediator' });
                }
            }

            mediators.create(TestMediator, element);
            expect(handler).toHaveBeenCalledWith(expect.objectContaining({
                source: 'mediator'
            }));
        });

        it('should support mediator lifecycle', () => {
            const events: string[] = [];

            const element = document.createElement('div');

            class TestMediator {
                target?: HTMLElement;

                constructor() {
                    events.push('constructor');
                }

                postConstruct() {
                    events.push('postConstruct');
                }
            }

            mediators.create(TestMediator, element);
            expect(events).toEqual(['constructor', 'postConstruct']);
        });

        it('should isolate mediator injectors', () => {
            const elements = [
                document.createElement('div'),
                document.createElement('div')
            ];

            const injectors: Injector[] = [];

            class TestMediator {
                static inject = ['injector', 'target'];
                injector?: Injector;
                target?: any;
                constructor() {}
                postConstruct() {
                    if (this.injector) {
                        injectors.push(this.injector);
                    }
                }
            }

            mediators.create(TestMediator, elements[0]);
            mediators.create(TestMediator, elements[1]);

            expect(injectors.length).toBe(2);
            expect(injectors[0]).not.toBe(injectors[1]);
            expect(injectors[0].parent).toBe(injector);
            expect(injectors[1].parent).toBe(injector);
        });
    });
});
