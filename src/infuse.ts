const FN_ARGS_FUNCTION = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
const FN_ARGS_CLASS = /(?!function)\s*constructor\s*[^\(|function]*\(\s*([^\)]*)\)\s*{/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

interface InfuseNamespace {
    errors: {
        MAPPING_BAD_PROP: string;
        MAPPING_BAD_VALUE: string;
        MAPPING_BAD_CLASS: string;
        MAPPING_BAD_SINGLETON: string;
        MAPPING_ALREADY_EXISTS: string;
        CREATE_INSTANCE_INVALID_PARAM: string;
        NO_MAPPING_FOUND: string;
        INJECT_INSTANCE_IN_ITSELF_PROPERTY: string;
        INJECT_INSTANCE_IN_ITSELF_CONSTRUCTOR: string;
        DEPENDENCIES_MISSING_IN_STRICT_MODE: string;
        DEPENDENCIES_MISSING_IN_STRICT_MODE_CONSTRUCTOR_INJECTION: string;
        DEPENDENCIES_INVALID_TARGET: string;
    };
    getDependencies: (cl: any) => string[];
    getExplicitInjectDependencies: (cl: any) => string[];
}

const infuse: InfuseNamespace = {} as InfuseNamespace;

const depsCache: { [key: string]: string[] } = {};

function contains(arr: any[], value: any): boolean {
    let i = arr.length;
    while (i--) {
        if (arr[i] === value) {
            return true;
        }
    }
    return false;
}

infuse.errors = {
    MAPPING_BAD_PROP: '[Error Injector.MAPPING_BAD_PROP] The first parameter is invalid, a string is expected.',
    MAPPING_BAD_VALUE: '[Error Injector.MAPPING_BAD_VALUE] The second parameter is invalid, it can\'t null or undefined, with property: ',
    MAPPING_BAD_CLASS: '[Error Injector.MAPPING_BAD_CLASS] The second parameter is invalid, a function is expected, with property: ',
    MAPPING_BAD_SINGLETON: '[Error Injector.MAPPING_BAD_SINGLETON] The third parameter is invalid, a boolean is expected, with property: ',
    MAPPING_ALREADY_EXISTS: '[Error Injector.MAPPING_ALREADY_EXISTS] This mapping already exists, with property: ',
    CREATE_INSTANCE_INVALID_PARAM: '[Error Injector.CREATE_INSTANCE_INVALID_PARAM] Invalid parameter, a function is expected.',
    NO_MAPPING_FOUND: '[Error Injector.NO_MAPPING_FOUND] No mapping found',
    INJECT_INSTANCE_IN_ITSELF_PROPERTY: '[Error Injector.INJECT_INSTANCE_IN_ITSELF_PROPERTY] A matching property `%p` has been found in the target, you can\'t inject an instance in itself.',
    INJECT_INSTANCE_IN_ITSELF_CONSTRUCTOR: '[Error Injector.INJECT_INSTANCE_IN_ITSELF_CONSTRUCTOR] A matching constructor parameter has been found in the target, you can\'t inject an instance in itself.',
    DEPENDENCIES_MISSING_IN_STRICT_MODE: '[Error Injector.DEPENDENCIES_MISSING_IN_STRICT_MODE] An "inject" property (array) that describes the dependencies is missing in strict mode.',
    DEPENDENCIES_MISSING_IN_STRICT_MODE_CONSTRUCTOR_INJECTION: '[Error Injector.DEPENDENCIES_MISSING_IN_STRICT_MODE_CONSTRUCTOR_INJECTION] An "inject" property (array) that describes the dependencies of constructor is missing in strict mode.',
    DEPENDENCIES_INVALID_TARGET: '[Error Injector.DEPENDENCIES_INVALID_TARGET] Invalid target, a function or a class is expected (arrow function cannot be instantiated).'
};

class MappingVO {
    prop: string;
    value: any;
    cl: Function | null;
    singleton: boolean;
    singletonPostConstructed: boolean;

    constructor(prop: string, value: any, cl: Function | null, singleton: boolean) {
        this.prop = prop;
        this.value = value;
        this.cl = cl;
        this.singleton = singleton || false;
        this.singletonPostConstructed = false;
    }
}

const validateProp = (prop: any): void => {
    if (typeof prop !== 'string') {
        throw new Error(infuse.errors.MAPPING_BAD_PROP);
    }
};

const validateValue = (prop: string, val: any): void => {
    if (val === undefined || val === null) {
        throw new Error(infuse.errors.MAPPING_BAD_VALUE + prop);
    }
};

const validateClass = (prop: string, val: any): void => {
    if (typeof val !== 'function') {
        throw new Error(infuse.errors.MAPPING_BAD_CLASS + prop);
    }
};

const validateBooleanSingleton = (prop: string, singleton: any): void => {
    if (typeof singleton !== 'boolean') {
        throw new Error(infuse.errors.MAPPING_BAD_SINGLETON + prop);
    }
};

const validateConstructorInjectionLoop = (name: string, cl: Function): void => {
    const params = infuse.getDependencies(cl);
    if (contains(params, name)) {
        throw new Error(infuse.errors.INJECT_INSTANCE_IN_ITSELF_CONSTRUCTOR);
    }
};

const validatePropertyInjectionLoop = (name: string, target: any): void => {
    if (target.hasOwnProperty(name)) {
        throw new Error(infuse.errors.INJECT_INSTANCE_IN_ITSELF_PROPERTY.replace('%p', name));
    }
};

const formatMappingError = (propName?: string, className?: string): string => {
    const nameInfo = propName !== undefined ? ' for the injection name: "' + propName + '"' : '';
    const classInfo = className !== undefined ? ' when instantiating: "' + className + '"' : '';
    return infuse.errors.NO_MAPPING_FOUND + nameInfo + classInfo + '.';
};

export class Injector {
    mappings: { [key: string]: MappingVO };
    parent: Injector | null;
    strictMode: boolean;
    strictModeConstructorInjection: boolean;
    throwOnMissing: boolean;

    constructor() {
        this.mappings = {};
        this.parent = null;
        this.strictMode = false;
        this.strictModeConstructorInjection = false;
        this.throwOnMissing = true;
    }

    createChild(): Injector {
        const injector = new Injector();
        injector.parent = this;
        injector.strictMode = this.strictMode;
        injector.strictModeConstructorInjection = this.strictModeConstructorInjection;
        injector.throwOnMissing = this.throwOnMissing;
        return injector;
    }

    getMappingVo(prop: string): MappingVO | null {
        if (!this.mappings) {
            return null;
        }
        if (this.mappings[prop]) {
            return this.mappings[prop];
        }
        if (this.parent) {
            return this.parent.getMappingVo(prop);
        }
        return null;
    }

    mapValue(prop: string, val: any): Injector {
        if (this.mappings[prop]) {
            throw new Error(infuse.errors.MAPPING_ALREADY_EXISTS + prop);
        }
        validateProp(prop);
        validateValue(prop, val);
        this.mappings[prop] = new MappingVO(prop, val, null, false);
        return this;
    }

    mapClass(prop: string, cl: Function, singleton?: boolean): Injector {
        if (this.mappings[prop]) {
            throw new Error(infuse.errors.MAPPING_ALREADY_EXISTS + prop + "  in " + ((cl as any).name ?? 'n/a'));
        }
        validateProp(prop);
        validateClass(prop, cl);
        if (singleton) {
            validateBooleanSingleton(prop, singleton);
        }
        this.mappings[prop] = new MappingVO(prop, null, cl, singleton || false);
        return this;
    }

    removeMapping(prop: string): Injector {
        this.mappings[prop] = null as any;
        delete this.mappings[prop];
        return this;
    }

    hasMapping(prop: string): boolean {
        return !!this.mappings[prop];
    }

    hasInheritedMapping(prop: string): boolean {
        return !!this.getMappingVo(prop);
    }

    getMapping(value: any): string | undefined {
        for (const name in this.mappings) {
            if (this.mappings.hasOwnProperty(name)) {
                const vo = this.mappings[name];
                if (vo.value === value || vo.cl === value) {
                    return vo.prop;
                }
            }
        }
        return undefined;
    }

    getValue(prop: string, ...args: any[]): any {
        let vo: MappingVO | null = this.mappings[prop];
        if (!vo) {
            if (this.parent) {
                vo = this.parent.getMappingVo(prop);
                if (!vo) {
                    if (this.throwOnMissing) {
                        throw new Error(formatMappingError(prop));
                    } else {
                        return;
                    }
                }
            } else if (this.throwOnMissing) {
                throw new Error(formatMappingError(prop));
            } else {
                return;
            }
        }
        if (vo.cl) {
            if (vo.singleton) {
                if (!vo.value) {
                    vo.value = this.createInstance(vo.cl, ...args);
                }
                return vo.value;
            } else {
                return this.createInstance(vo.cl, ...args);
            }
        }
        return vo.value;
    }

    getClass(prop: string): Function | undefined {
        const vo = this.mappings[prop];
        if (!vo) {
            if (this.parent) {
                const parentVo = this.parent.getMappingVo(prop);
                if (parentVo && parentVo.cl) {
                    return parentVo.cl;
                }
            }
            return undefined;
        }
        if (vo.cl) {
            return vo.cl;
        }
        return undefined;
    }

    instantiate(TargetClass: any, ...args: any[]): any {
        if (typeof TargetClass !== 'function') {
            throw new Error(infuse.errors.CREATE_INSTANCE_INVALID_PARAM);
        }
        const params = infuse.getDependencies(TargetClass);
        if (this.strictMode && !TargetClass.hasOwnProperty('inject')) {
            throw new Error(infuse.errors.DEPENDENCIES_MISSING_IN_STRICT_MODE + " : " + TargetClass.name + "(" + params.join(', ') + ")");
        } else if (this.strictModeConstructorInjection && params.length > 0 && !TargetClass.hasOwnProperty('inject')) {
            throw new Error(infuse.errors.DEPENDENCIES_MISSING_IN_STRICT_MODE_CONSTRUCTOR_INJECTION + " : " + TargetClass.name + "(" + params.join(', ') + ")");
        }
        const constructorArgs: any[] = [null];
        for (let i = 0, l = params.length; i < l; i++) {
            if (args.length > i && args[i] !== undefined && args[i] !== null) {
                // argument found
                constructorArgs.push(args[i]);
            } else {
                const name = params[i];
                // no argument found
                const vo = this.getMappingVo(name);
                if (!!vo) {
                    // found mapping
                    const val = this.getInjectedValue(vo, name);
                    constructorArgs.push(val);
                } else {
                    // no mapping found
                    if (this.throwOnMissing) {
                        throw new Error(formatMappingError(name, TargetClass.name));
                    }
                    constructorArgs.push(undefined);
                }
            }
        }
        return new (Function.prototype.bind.apply(TargetClass, constructorArgs as [any, ...any[]]))();
    }

    inject(target: any, isParent?: boolean): Injector {
        if (this.parent) {
            this.parent.inject(target, true);
        }

        const directInjectDeps = infuse.getExplicitInjectDependencies(target.constructor);

        for (const name in this.mappings) {
            if (this.mappings.hasOwnProperty(name)) {
                const vo = this.mappings[name];
                if (vo && (
                    target.hasOwnProperty(vo.prop) ||
                    typeof target[vo.prop] !== 'undefined' ||
                    (target.constructor && target.constructor.prototype && target.constructor.prototype.hasOwnProperty(vo.prop)) ||
                    (typeof target.constructor.inject !== 'undefined' && target.constructor.inject.includes(vo.prop))
                )) {
                    target[name] = this.getInjectedValue(vo, name);
                }
            }
        }

        return this;
    }

    getInjectedValue(vo: MappingVO, name: string): any {
        let val = vo.value;
        let injectee: any;
        if (vo.cl) {
            if (vo.singleton) {
                if (!vo.value) {
                    validateConstructorInjectionLoop(name, vo.cl);
                    vo.value = this.instantiate(vo.cl);
                    injectee = vo.value;
                }
                val = vo.value;
            } else {
                validateConstructorInjectionLoop(name, vo.cl);
                val = this.instantiate(vo.cl);
                injectee = val;
            }
        }
        if (injectee) {
            validatePropertyInjectionLoop(name, injectee);
            this.inject(injectee);
            if (typeof injectee.postConstruct === 'function') {
                injectee.postConstruct();
            }
        }
        return val;
    }

    createInstance(TargetClass: any, ...args: any[]): any {
        const instance = this.instantiate(TargetClass, ...args);
        this.inject(instance);

        if (typeof instance.postConstruct === 'function') {
            instance.postConstruct();
        }

        return instance;
    }

    getValueFromClass(cl: Function, ...args: any[]): any {
        for (const name in this.mappings) {
            if (this.mappings.hasOwnProperty(name)) {
                const vo = this.mappings[name];
                if (vo.cl === cl) {
                    if (vo.singleton) {
                        if (!vo.value) {
                            vo.value = this.createInstance(cl, ...args);
                        }
                        return vo.value;
                    } else {
                        return this.createInstance(cl, ...args);
                    }
                }
            }
        }
        if (this.parent) {
            return this.parent.getValueFromClass(cl, ...args);
        } else if (this.throwOnMissing) {
            throw new Error(formatMappingError(undefined, (cl as any).name));
        }
    }

    dispose(): void {
        this.mappings = {};
    }
}

infuse.getExplicitInjectDependencies = function(cl: any): string[] {
    if (typeof cl.inject !== 'undefined' && Object.prototype.toString.call(cl.inject) === '[object Array]' && cl.inject.length > 0) {
        const deps = cl.inject;
        return deps;
    }
    return [];
};

infuse.getDependencies = function(cl: any): string[] {
    const args: string[] = [];

    function extractName(all: string, underscore: string, name: string): void {
        args.push(name);
    }

    const deps = infuse.getExplicitInjectDependencies(cl);

    const clStr = cl.toString().replace(STRIP_COMMENTS, '');

    let argsFlat: RegExpMatchArray | null;

    if (clStr.indexOf('class') === 0) {
        argsFlat = clStr.replace(/function constructor/g, '').match(FN_ARGS_CLASS);
    } else if (clStr.indexOf('function') === 0) {
        argsFlat = clStr.match(FN_ARGS_FUNCTION);
    } else {
        throw new Error(infuse.errors.DEPENDENCIES_INVALID_TARGET);
    }

    if (argsFlat) {
        const spl = argsFlat[1].split(FN_ARG_SPLIT);
        for (let i = 0, l = spl.length; i < l; i++) {
            // removes default es6 values
            const cArg = spl[i].split('=')[0].replace(/\s/g, '');
            // Only override arg with non-falsey deps value at same key
            const arg = (deps && deps[i]) ? deps[i] : cArg;
            arg.replace(FN_ARG, extractName as any);
        }
    }

    return args;
};

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that: any, ...bindArgs: any[]): any {
        const target = this;
        if (typeof target !== 'function') {
            throw new Error('Error, you must bind a function.');
        }
        const args = bindArgs;
        const bound = function(this: any, ...callArgs: any[]): any {
            if (this instanceof bound) {
                const F = function() {};
                F.prototype = target.prototype;
                const self = new (F as any)();
                const result = target.apply(self, args.concat(callArgs));
                if (Object(result) === result) {
                    return result;
                }
                return self;
            } else {
                return target.apply(that, args.concat(callArgs));
            }
        };
        return bound;
    };
}

export {infuse};
