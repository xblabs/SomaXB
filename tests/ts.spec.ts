// @ts-ignore
import {Injector} from '../src/infuse'
import Application from '../src/Application'
import Emitter from '../src/Emitter'
import Commands from '../src/Commands'
import Mediators from '../src/Mediators'
import Modules from '../src/Modules'


class ApplicationTest extends Application {

}


describe('Soma Tests', () => {

    let app: Application

    beforeEach(() => {
        app = new ApplicationTest()
    })

    afterEach(() => {
        if (app instanceof Application) {
            app.dispose()
        }
    })


    it('creates an application', function () {
        app = new Application()
        expect(app).toBeDefined()
        expect(app).toBeInstanceOf(Application)
    })


    it('calls the init function', function () {
        let called: boolean = false
        class AppExt extends Application {
            init() {
                called = true
            }
        }

        app = new AppExt()
        expect(called).toBeTruthy()
    })

    it('calls the setup function', function () {
        let called: boolean = false

        class AppExt extends Application {
            setup() {
                called = true
            }
        }

        app = new AppExt()
        expect(called).toBeTruthy()
    })


    it('calls the dispose function', function () {
        let called: boolean = false

        class AppExt extends Application {
            dispose() {
                called = true
            }
        }

        app = new AppExt()
        app.dispose()
        expect(called).toBeTruthy()
    })


    it('creates an injector', function () {
        const injector = app.injector
        expect(injector).toBeInstanceOf(Injector)
        if (injector) {
            expect(injector.throwOnMissing).toBeFalsy()
        }
    })


    it('creates an injector mapping', function () {
        const injector = app.injector
        if (injector) {
            expect(injector.getValue('injector')).toBe(injector)
        }
    })

    it('creates an instance mapping', function () {
        const injector = app.injector
        if (injector) {
            expect(injector.getValue('instance')).toBe(app)
        }
    })

    it('creates an emitter', function () {
        expect(app.emitter).toBeInstanceOf(Emitter)
    })


    it('creates an emitter mapping', function () {
        const emitter = app.emitter
        const injector = app.injector
        expect(injector.getValue('emitter')).toBe(emitter)
    })



     it('creates a command manager', function() {
        expect(app.commands).toBeInstanceOf(Commands)
    })

    it('creates a command manager mapping', function() {
        expect(app.injector.getValue('commands')).toBe(app.commands)
    });

    it('creates a mediator manager', function() {
        expect(app.mediators).toBeInstanceOf(Mediators)
    });

    it('creates a mediator manager mapping', function() {
         expect(app.injector.getValue('mediators')).toBe(app.mediators)
    });

    it('creates a module manager', function() {
        expect(app.modules).toBeInstanceOf(Modules)
    });

    it('creates a module manager mapping', function() {
        expect(app.injector.getValue('modules')).toBe(app.modules)
    });

    it('can inject into the module', function() {
        const DummyModuleInjected = function( this:{instance?:Application,mediators?:Mediators, commands?:Commands,injector?:Injector,emitter?:Emitter,modules?:Modules} ) {
            this.instance = undefined
            this.mediators = undefined
            this.commands = undefined
            this.injector = undefined
            this.emitter = undefined
            this.modules = undefined
        };
        DummyModuleInjected.id = 'moduleName';
        app = new Application()
        expect(app.injector.getValue('modules')).toBe( app.modules )
        const module = app.modules.create(DummyModuleInjected);
        expect(app).toBe(module.instance)
        expect(app.injector).toBe(module.injector)
        expect(app.mediators).toBe(module.mediators)
        expect(app.commands).toBe(module.commands)
        expect(app.emitter).toBe(module.emitter)
        expect(app.modules).toBe(module.modules)
    });

    it('a module can receive parameters and property injection', function() {
        const params = [10, false, 'string', [1, 2, 3], {data:1}];
        const received:Array<any> = [];
        let inst: any;
        let em: any;
        const Module = function(this:{instance?:Application,emitter?:Emitter, postConstruct:Function}, num: any, bool: any, str: any, arr: any, obj: any) {
            received.push(num);
            received.push(bool);
            received.push(str);
            received.push(arr);
            received.push(obj);
            this.instance = undefined;
            this.emitter = undefined;

            this.postConstruct = function() {
                inst = this.instance;
                em = this.emitter;
            };
        };
        Module.id = 'moduleName';
        app.modules.create(Module, params);
        expect(inst).toBe(app)
        expect(em).toBe(app.emitter)
        expect(received[0]).toBe(params[0])
        expect(received[1]).toBe(params[1])
        expect(received[2]).toBe(params[2])
        expect(received[3]).toBe(params[3])
        expect(received[4]).toBe(params[4])
    });

    it('should dispose the injector', function() {
        app = new Application();
        const spy = jest.spyOn(app.injector, 'dispose');
        app.dispose();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should dispose the emitter', function() {
        app = new Application();
        const spy = jest.spyOn(app.emitter, 'dispose');
        app.dispose();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should dispose the commands', function() {
        app = new Application();
        const spy = jest.spyOn(app.commands, 'dispose');
        app.dispose();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should dispose the mediators', function() {
        app = new Application();
        const spy = jest.spyOn(app.mediators, 'dispose');
        app.dispose();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should dispose the modules', function() {
        app = new Application();
        const spy = jest.spyOn(app.modules, 'dispose');
        app.dispose();
        expect(spy).toHaveBeenCalledTimes(1);
    });


})

