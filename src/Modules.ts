import {infuse} from './infuse';
import utils from './utils';

interface Injector {
    createChild(): Injector;
    mapValue(prop: string, val: any): Injector;
    hasMapping(prop: string): boolean;
    hasInheritedMapping(prop: string): boolean;
    getValue(prop: string): any;
    createInstance(TargetClass: any, ...args: any[]): any;
}

interface ModuleClass {
    (this: any, ...args: any[]): any;
    id: string;
}

export interface ModuleInstance {
    [key: string]: any;
    init?(): void;
    dispose?(): void;
}

interface ModuleInput {
    module?: ModuleClass;
    Module?: ModuleClass;
}

class Modules {
    injector: Injector;
    list: { [id: string]: ModuleInstance };

    static inject = ["injector"];

    constructor(injector: Injector) {
        this.injector = injector;
        this.list = {};
    }

    create(
        module: ModuleClass | ModuleInput,
        args?: any[],
        register?: boolean,
        useChildInjector?: boolean
    ): ModuleInstance {
        let moduleInstance: ModuleInstance;
        let moduleClass: ModuleClass;
        const shouldRegister = register !== false;
        const shouldUseChildInjector = useChildInjector === true;

        // register module
        const add = (list: { [id: string]: ModuleInstance }, id: string, instance: ModuleInstance): void => {
            if (!list[id] && shouldRegister) {
                list[id] = instance;
            }
        };

        // validate module
        const validate = (moduleClass: ModuleClass): boolean => {
            let valid = true;
            if (moduleClass === undefined || moduleClass === null) {
                valid = false;
            } else if (typeof moduleClass.id !== 'string') {
                valid = false;
            }
            return valid;
        };

        // create module instance
        const instantiate = (injector: Injector, value: ModuleClass, args?: any[]): ModuleInstance => {
            const params = infuse.getDependencies(value);

            // add module function
            let moduleArgs: any[] = [value];

            // add injection mappings
            for (let i = 0, l = params.length; i < l; i++) {
                if (injector.hasMapping(params[i]) || injector.hasInheritedMapping(params[i])) {
                    moduleArgs.push(injector.getValue(params[i]));
                } else {
                    moduleArgs.push(undefined);
                }
            }

            // trim array
            for (let a = moduleArgs.length - 1; a >= 0; a--) {
                if (typeof moduleArgs[a] === 'undefined') {
                    moduleArgs.splice(a, 1);
                } else {
                    break;
                }
            }

            // add arguments
            if (args) {
                moduleArgs = moduleArgs.concat(args);
            }

            const [targetClass, ...instanceArgs] = moduleArgs;
            return injector.createInstance(targetClass, ...instanceArgs);
        };

        // find module class
        if (utils.is.func(module)) {
            // module function is sent directly
            moduleClass = module as ModuleClass;
        } else if (utils.is.object(module) && utils.is.func((module as ModuleInput).module)) {
            // module function is contained in an object, on a "module"
            moduleClass = (module as ModuleInput).module!;
        } else if (utils.is.object(module) && utils.is.func((module as ModuleInput).Module)) {
            // module function is coming from an ES6 import as a Module property
            moduleClass = (module as ModuleInput).Module!;
        } else {
            throw new Error('[Modules] Error: Could not create module. The module must be a function or an object containing a module property referencing a function.');
        }

        // validate module
        if (!validate(moduleClass)) {
            throw new Error('[Modules] Error: Could not create module. The module function must contain a static "id" property, ex: function Module(){}; Module.id = "module-name"; ');
        }

        // instantiate
        if (moduleClass) {
            if (this.has(moduleClass.id)) {
                // module already exists
                moduleInstance = this.get(moduleClass.id);
            } else {
                let injectorTarget = this.injector;
                if (shouldUseChildInjector) {
                    injectorTarget = this.injector.createChild();
                    injectorTarget.mapValue('injector', injectorTarget);
                }
                moduleInstance = instantiate(injectorTarget, moduleClass, args);
                add(this.list, moduleClass.id, moduleInstance);
                if (typeof moduleInstance.init === 'function') {
                    moduleInstance.init();
                }
            }
        }

        return moduleInstance!;
    }

    has(id: string): boolean {
        return this.list[id] !== undefined;
    }

    get(id: string): ModuleInstance {
        return this.list[id];
    }

    remove(id: string): void {
        if (this.list[id]) {
            if (typeof this.list[id].dispose === 'function') {
                this.list[id].dispose!();
            }
            this.list[id] = undefined as any;
            delete this.list[id];
        }
    }

    dispose(): void {
        for (const id in this.list) {
            this.remove(id);
        }
        this.list = {};
    }
}

export default Modules;
