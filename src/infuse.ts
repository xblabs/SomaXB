const FN_ARGS_FUNCTION = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
const FN_ARGS_CLASS = /(?!function)\s*constructor\s*[^\(|function]*\(\s*([^\)]*)\)\s*{/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

interface InfuseErrors {
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
}

interface InfuseType {
    errors: InfuseErrors;
    getDependencies: (cl: any) => string[];
}

const infuse: InfuseType = {
    errors: {
        MAPPING_BAD_PROP: '[Error Injector.MAPPING_BAD_PROP] The first parameter is invalid, a string is expected.',
        MAPPING_BAD_VALUE: '[Error Injector.MAPPING_BAD_VALUE] The second parameter is invalid, it can\'t null or undefined, with property: ',
        MAPPING_BAD_CLASS: '[Error Injector.MAPPING_BAD_CLASS] The second parameter is invalid, a function is expected, with property: ',
        MAPPING_BAD_SINGLETON: '[Error Injector.MAPPING_BAD_SINGLETON] The third parameter is invalid, a boolean is expected, with property: ',
        MAPPING_ALREADY_EXISTS: '[Error Injector.MAPPING_ALREADY_EXISTS] This mapping already exists, with property: ',
        CREATE_INSTANCE_INVALID_PARAM: '[Error Injector.CREATE_INSTANCE_INVALID_PARAM] Invalid parameter, a function is expected.',
        NO_MAPPING_FOUND: '[Error Injector.NO_MAPPING_FOUND] No mapping found',
        INJECT_INSTANCE_IN_ITSELF_PROPERTY: '[Error Injector.INJECT_INSTANCE_IN_ITSELF_PROPERTY] A matching property has been found in the target, you can\'t inject an instance in itself.',
        INJECT_INSTANCE_IN_ITSELF_CONSTRUCTOR: '[Error Injector.INJECT_INSTANCE_IN_ITSELF_CONSTRUCTOR] A matching constructor parameter has been found in the target, you can\'t inject an instance in itself.',
        DEPENDENCIES_MISSING_IN_STRICT_MODE: '[Error Injector.DEPENDENCIES_MISSING_IN_STRICT_MODE] An "inject" property (array) that describes the dependencies is missing in strict mode.',
        DEPENDENCIES_MISSING_IN_STRICT_MODE_CONSTRUCTOR_INJECTION: '[Error Injector.DEPENDENCIES_MISSING_IN_STRICT_MODE_CONSTRUCTOR_INJECTION] An "inject" property (array) that describes the dependencies of constructor is missing in strict mode.',
        DEPENDENCIES_INVALID_TARGET: '[Error Injector.DEPENDENCIES_INVALID_TARGET] Invalid target, a function or a class is expected (arrow function cannot be instantiated).'
    },
    getDependencies: function(cl: any): string[] {
        const args: string[] = [];
        let deps: string[] | undefined;

        function extractName(_all: string, _underscore: string, name: string): void {
            args.push(name);
        }

        if (cl.hasOwnProperty('inject') && Object.prototype.toString.call(cl.inject) === '[object Array]' && cl.inject.length > 0) {
            deps = cl.inject;
        }

        const clStr = cl.toString().replace(STRIP_COMMENTS, '');

        let argsFlat: RegExpMatchArray | null;

        if (clStr.indexOf('class') === 0) {
            argsFlat = clStr.replace(/function constructor/g, '').match(FN_ARGS_CLASS);
        } else if (clStr.indexOf('function') === 0) {
            argsFlat = clStr.match(FN_ARGS_FUNCTION);
        } else {
            throw new Error(infuse.errors.DEPENDENCIES_INVALID_TARGET);
        }

        if (argsFlat && argsFlat[1]) {
            const spl = argsFlat[1].split(FN_ARG_SPLIT);
            for (let i = 0, l = spl.length; i < l; i++) {
                const splItem = spl[i];
                if (splItem) {
                    // removes default es6 values
                    const cArg = splItem.split('=')[0]?.replace(/\s/g, '') || '';
                    // Only override arg with non-falsey deps value at same key
                    const depItem = deps?.[i];
                    const arg = depItem || cArg;
                    if (arg) {
                        arg.replace(FN_ARG, extractName as any);
                    }
                }
            }
        }

        return args;
    }
};

function contains(arr: any[], value: any): boolean {
    let i = arr.length;
    while (i--) {
        if (arr[i] === value) {
            return true;
        }
    }
    return false;
}

class MappingVO {
    prop: string;
    value: any;
    cl: Function | undefined;
    singleton: boolean;

    constructor(prop: string, value: any, cl: Function | undefined, singleton: boolean | undefined) {
        this.prop = prop;
        this.value = value;
        this.cl = cl;
        this.singleton = singleton || false;
    }
}

function validateProp(prop: any): void {
    if (typeof prop !== 'string') {
        throw new Error(infuse.errors.MAPPING_BAD_PROP);
    }
}

function validateValue(prop: string, val: any): void {
    if (val === undefined || val === null) {
        throw new Error(infuse.errors.MAPPING_BAD_VALUE + prop);
    }
}

function validateClass(prop: string, val: any): void {
    if (typeof val !== 'function') {
        throw new Error(infuse.errors.MAPPING_BAD_CLASS + prop);
    }
}

function validateBooleanSingleton(prop: string, singleton: any): void {
    if (typeof singleton !== 'boolean') {
        throw new Error(infuse.errors.MAPPING_BAD_SINGLETON + prop);
    }
}

function validateConstructorInjectionLoop(name: string, cl: any): void {
    const params = infuse.getDependencies(cl);
    if (contains(params, name)) {
        throw new Error(infuse.errors.INJECT_INSTANCE_IN_ITSELF_CONSTRUCTOR);
    }
}

function validatePropertyInjectionLoop(name: string, target: any): void {
    if (target.hasOwnProperty(name)) {
        throw new Error(infuse.errors.INJECT_INSTANCE_IN_ITSELF_PROPERTY);
    }
}

function formatMappingError(propName?: string, className?: string): string {
    const nameInfo = propName !== undefined ? ' for the injection name: "' + propName + '"' : '';
    const classInfo = className !== undefined ? ' when instantiating: "' + className + '"' : '';
    return infuse.errors.NO_MAPPING_FOUND + nameInfo + classInfo + '.';
}

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
        this.mappings[prop] = new MappingVO(prop, val, undefined, undefined);
        return this;
    }

    mapClass(prop: string, cl: Function, singleton?: boolean): Injector {
        if (this.mappings[prop]) {
            throw new Error(infuse.errors.MAPPING_ALREADY_EXISTS + prop);
        }
        validateProp(prop);
        validateClass(prop, cl);
        if (singleton) {
            validateBooleanSingleton(prop, singleton);
        }
        this.mappings[prop] = new MappingVO(prop, null, cl, singleton);
        return this;
    }

    removeMapping(prop: string): Injector {
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
        let vo = this.mappings[prop];
        if (!vo) {
            if (this.parent) {
                vo = this.parent.getMappingVo(prop) as MappingVO;
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
        let vo = this.mappings[prop];
        if (!vo) {
            if (this.parent) {
                vo = this.parent.getMappingVo(prop) as MappingVO;
            } else {
                return undefined;
            }
        }
        if (vo.cl) {
            return vo.cl;
        }
        return undefined;
    }

    instantiate(TargetClass: any, ...extraArgs: any[]): any {
        if (typeof TargetClass !== 'function') {
            throw new Error(infuse.errors.CREATE_INSTANCE_INVALID_PARAM);
        }
        const params = infuse.getDependencies(TargetClass);
        if (this.strictMode && !TargetClass.hasOwnProperty('inject')) {
            throw new Error(infuse.errors.DEPENDENCIES_MISSING_IN_STRICT_MODE);
        } else if (this.strictModeConstructorInjection && params.length > 0 && !TargetClass.hasOwnProperty('inject')) {
            throw new Error(infuse.errors.DEPENDENCIES_MISSING_IN_STRICT_MODE_CONSTRUCTOR_INJECTION);
        }
        const args: any[] = [null];
        for (let i = 0, l = params.length; i < l; i++) {
            if (extraArgs.length > i && extraArgs[i] !== undefined && extraArgs[i] !== null) {
                // argument found
                args.push(extraArgs[i]);
            } else {
                const name = params[i];
                // no argument found
                const vo = this.getMappingVo(name);
                if (!!vo) {
                    // found mapping
                    const val = this.getInjectedValue(vo, name);
                    args.push(val);
                } else {
                    // no mapping found
                    if (this.throwOnMissing) {
                        throw new Error(formatMappingError(name, TargetClass.name));
                    }
                    args.push(undefined);
                }
            }
        }
        return new (Function.prototype.bind.apply(TargetClass, args as any))();
    }

    inject(target: any, isParent?: boolean): Injector {
        if (this.parent) {
            this.parent.inject(target, true);
        }
        for (const name in this.mappings) {
            if (this.mappings.hasOwnProperty(name)) {
                const vo = this.getMappingVo(name);
                if (vo && (target.hasOwnProperty(vo.prop) || (target.constructor && target.constructor.prototype && target.constructor.prototype.hasOwnProperty(vo.prop)))) {
                    target[name] = this.getInjectedValue(vo, name);
                }
            }
        }
        if (typeof target.postConstruct === 'function' && !isParent) {
            target.postConstruct();
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
        }
        return val;
    }

    createInstance(TargetClass: any, ...args: any[]): any {
        const instance = this.instantiate(TargetClass, ...args);
        this.inject(instance);
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
            throw new Error(formatMappingError(undefined, cl.name));
        }
    }

    dispose(): void {
        this.mappings = {};
    }
}

// Function.prototype.bind polyfill
if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that: any, ...bindArgs: any[]): Function {
        const target = this;
        if (typeof target !== 'function') {
            throw new Error('Error, you must bind a function.');
        }
        const bound = function (this: any, ...callArgs: any[]) {
            if (this instanceof bound) {
                const F = function () {};
                F.prototype = target.prototype;
                const self = new (F as any)();
                const result = target.apply(self, bindArgs.concat(callArgs));
                if (Object(result) === result) {
                    return result;
                }
                return self;
            } else {
                return target.apply(that, bindArgs.concat(callArgs));
            }
        };
        return bound;
    };
}

export { infuse };
