/* soma - v3.0.4 - 31/12/2025 - https://github.com/soundstep/soma */
import { Signal } from 'signals';

const FN_ARGS_FUNCTION = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
const FN_ARGS_CLASS = /(?!function)\s*constructor\s*[^\(|function]*\(\s*([^\)]*)\)\s*{/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const infuse = {};
function contains(arr, value) {
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
    constructor(prop, value, cl, singleton) {
        this.prop = prop;
        this.value = value;
        this.cl = cl;
        this.singleton = singleton || false;
        this.singletonPostConstructed = false;
    }
}
const validateProp = (prop) => {
    if (typeof prop !== 'string') {
        throw new Error(infuse.errors.MAPPING_BAD_PROP);
    }
};
const validateValue = (prop, val) => {
    if (val === undefined || val === null) {
        throw new Error(infuse.errors.MAPPING_BAD_VALUE + prop);
    }
};
const validateClass = (prop, val) => {
    if (typeof val !== 'function') {
        throw new Error(infuse.errors.MAPPING_BAD_CLASS + prop);
    }
};
const validateBooleanSingleton = (prop, singleton) => {
    if (typeof singleton !== 'boolean') {
        throw new Error(infuse.errors.MAPPING_BAD_SINGLETON + prop);
    }
};
const validateConstructorInjectionLoop = (name, cl) => {
    const params = infuse.getDependencies(cl);
    if (contains(params, name)) {
        throw new Error(infuse.errors.INJECT_INSTANCE_IN_ITSELF_CONSTRUCTOR);
    }
};
const validatePropertyInjectionLoop = (name, target) => {
    if (target.hasOwnProperty(name)) {
        throw new Error(infuse.errors.INJECT_INSTANCE_IN_ITSELF_PROPERTY.replace('%p', name));
    }
};
const formatMappingError = (propName, className) => {
    const nameInfo = propName !== undefined ? ' for the injection name: "' + propName + '"' : '';
    const classInfo = className !== undefined ? ' when instantiating: "' + className + '"' : '';
    return infuse.errors.NO_MAPPING_FOUND + nameInfo + classInfo + '.';
};
class Injector$1 {
    constructor() {
        this.mappings = {};
        this.parent = null;
        this.strictMode = false;
        this.strictModeConstructorInjection = false;
        this.throwOnMissing = true;
    }
    createChild() {
        const injector = new Injector$1();
        injector.parent = this;
        injector.strictMode = this.strictMode;
        injector.strictModeConstructorInjection = this.strictModeConstructorInjection;
        injector.throwOnMissing = this.throwOnMissing;
        return injector;
    }
    getMappingVo(prop) {
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
    mapValue(prop, val) {
        if (this.mappings[prop]) {
            throw new Error(infuse.errors.MAPPING_ALREADY_EXISTS + prop);
        }
        validateProp(prop);
        validateValue(prop, val);
        this.mappings[prop] = new MappingVO(prop, val, null, false);
        return this;
    }
    mapClass(prop, cl, singleton) {
        if (this.mappings[prop]) {
            throw new Error(infuse.errors.MAPPING_ALREADY_EXISTS + prop + "  in " + (cl.name ?? 'n/a'));
        }
        validateProp(prop);
        validateClass(prop, cl);
        if (singleton) {
            validateBooleanSingleton(prop, singleton);
        }
        this.mappings[prop] = new MappingVO(prop, null, cl, singleton || false);
        return this;
    }
    removeMapping(prop) {
        this.mappings[prop] = null;
        delete this.mappings[prop];
        return this;
    }
    hasMapping(prop) {
        return !!this.mappings[prop];
    }
    hasInheritedMapping(prop) {
        return !!this.getMappingVo(prop);
    }
    getMapping(value) {
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
    getValue(prop, ...args) {
        let vo = this.mappings[prop];
        if (!vo) {
            if (this.parent) {
                vo = this.parent.getMappingVo(prop);
                if (!vo) {
                    if (this.throwOnMissing) {
                        throw new Error(formatMappingError(prop));
                    }
                    else {
                        return;
                    }
                }
            }
            else if (this.throwOnMissing) {
                throw new Error(formatMappingError(prop));
            }
            else {
                return;
            }
        }
        if (vo.cl) {
            if (vo.singleton) {
                if (!vo.value) {
                    vo.value = this.createInstance(vo.cl, ...args);
                }
                return vo.value;
            }
            else {
                return this.createInstance(vo.cl, ...args);
            }
        }
        return vo.value;
    }
    getClass(prop) {
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
    instantiate(TargetClass, ...args) {
        if (typeof TargetClass !== 'function') {
            throw new Error(infuse.errors.CREATE_INSTANCE_INVALID_PARAM);
        }
        const params = infuse.getDependencies(TargetClass);
        if (this.strictMode && !TargetClass.hasOwnProperty('inject')) {
            throw new Error(infuse.errors.DEPENDENCIES_MISSING_IN_STRICT_MODE + " : " + TargetClass.name + "(" + params.join(', ') + ")");
        }
        else if (this.strictModeConstructorInjection && params.length > 0 && !TargetClass.hasOwnProperty('inject')) {
            throw new Error(infuse.errors.DEPENDENCIES_MISSING_IN_STRICT_MODE_CONSTRUCTOR_INJECTION + " : " + TargetClass.name + "(" + params.join(', ') + ")");
        }
        const constructorArgs = [null];
        for (let i = 0, l = params.length; i < l; i++) {
            if (args.length > i && args[i] !== undefined && args[i] !== null) {
                // argument found
                constructorArgs.push(args[i]);
            }
            else {
                const name = params[i];
                // no argument found
                const vo = this.getMappingVo(name);
                if (!!vo) {
                    // found mapping
                    const val = this.getInjectedValue(vo, name);
                    constructorArgs.push(val);
                }
                else {
                    // no mapping found
                    if (this.throwOnMissing) {
                        throw new Error(formatMappingError(name, TargetClass.name));
                    }
                    constructorArgs.push(undefined);
                }
            }
        }
        return new (Function.prototype.bind.apply(TargetClass, constructorArgs))();
    }
    inject(target, isParent) {
        if (this.parent) {
            this.parent.inject(target, true);
        }
        infuse.getExplicitInjectDependencies(target.constructor);
        for (const name in this.mappings) {
            if (this.mappings.hasOwnProperty(name)) {
                const vo = this.mappings[name];
                if (vo && (target.hasOwnProperty(vo.prop) ||
                    typeof target[vo.prop] !== 'undefined' ||
                    (target.constructor && target.constructor.prototype && target.constructor.prototype.hasOwnProperty(vo.prop)) ||
                    (typeof target.constructor.inject !== 'undefined' && target.constructor.inject.includes(vo.prop)))) {
                    target[name] = this.getInjectedValue(vo, name);
                }
            }
        }
        return this;
    }
    getInjectedValue(vo, name) {
        let val = vo.value;
        let injectee;
        if (vo.cl) {
            if (vo.singleton) {
                if (!vo.value) {
                    validateConstructorInjectionLoop(name, vo.cl);
                    vo.value = this.instantiate(vo.cl);
                    injectee = vo.value;
                }
                val = vo.value;
            }
            else {
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
    createInstance(TargetClass, ...args) {
        const instance = this.instantiate(TargetClass, ...args);
        this.inject(instance);
        if (typeof instance.postConstruct === 'function') {
            instance.postConstruct();
        }
        return instance;
    }
    getValueFromClass(cl, ...args) {
        for (const name in this.mappings) {
            if (this.mappings.hasOwnProperty(name)) {
                const vo = this.mappings[name];
                if (vo.cl === cl) {
                    if (vo.singleton) {
                        if (!vo.value) {
                            vo.value = this.createInstance(cl, ...args);
                        }
                        return vo.value;
                    }
                    else {
                        return this.createInstance(cl, ...args);
                    }
                }
            }
        }
        if (this.parent) {
            return this.parent.getValueFromClass(cl, ...args);
        }
        else if (this.throwOnMissing) {
            throw new Error(formatMappingError(undefined, cl.name));
        }
    }
    dispose() {
        this.mappings = {};
    }
}
infuse.getExplicitInjectDependencies = function (cl) {
    if (typeof cl.inject !== 'undefined' && Object.prototype.toString.call(cl.inject) === '[object Array]' && cl.inject.length > 0) {
        const deps = cl.inject;
        return deps;
    }
    return [];
};
infuse.getDependencies = function (cl) {
    const args = [];
    function extractName(all, underscore, name) {
        args.push(name);
    }
    const deps = infuse.getExplicitInjectDependencies(cl);
    const clStr = cl.toString().replace(STRIP_COMMENTS, '');
    let argsFlat;
    if (clStr.indexOf('class') === 0) {
        argsFlat = clStr.replace(/function constructor/g, '').match(FN_ARGS_CLASS);
    }
    else if (clStr.indexOf('function') === 0) {
        argsFlat = clStr.match(FN_ARGS_FUNCTION);
    }
    else {
        throw new Error(infuse.errors.DEPENDENCIES_INVALID_TARGET);
    }
    if (argsFlat) {
        const spl = argsFlat[1].split(FN_ARG_SPLIT);
        for (let i = 0, l = spl.length; i < l; i++) {
            // removes default es6 values
            const cArg = spl[i].split('=')[0].replace(/\s/g, '');
            // Only override arg with non-falsey deps value at same key
            const arg = (deps && deps[i]) ? deps[i] : cArg;
            arg.replace(FN_ARG, extractName);
        }
    }
    return args;
};
if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that, ...bindArgs) {
        const target = this;
        if (typeof target !== 'function') {
            throw new Error('Error, you must bind a function.');
        }
        const args = bindArgs;
        const bound = function (...callArgs) {
            if (this instanceof bound) {
                const F = function () { };
                F.prototype = target.prototype;
                const self = new F();
                const result = target.apply(self, args.concat(callArgs));
                if (Object(result) === result) {
                    return result;
                }
                return self;
            }
            else {
                return target.apply(that, args.concat(callArgs));
            }
        };
        return bound;
    };
}

class Injector extends Injector$1 {
    constructor() {
        super();
    }
}

class Emitter__ // TODO IMPORTANT DEACTIVATED IN FAVOOUR OF CODE HIGHLIGHTUNG THE LIB'S SINGLETON
 {
    // static getInstance(): Emitter
    // {
    //     if( !Emitter._instance ) {
    //         Emitter._instance = new Emitter();
    //     }
    //     return Emitter._instance;
    // }
    constructor() {
        this.signals = {};
    }
    addListener(id, handler, scope, priority) {
        if (!this.signals[id]) {
            this.signals[id] = new Signal();
        }
        return this.signals[id].add(handler, scope, priority);
    }
    addListenerOnce(id, handler, scope, priority) {
        if (!this.signals[id]) {
            this.signals[id] = new Signal();
        }
        return this.signals[id].addOnce(handler, scope, priority);
    }
    removeListener(id, handler, scope) {
        const signal = this.signals[id];
        if (signal) {
            signal.remove(handler, scope);
        }
    }
    getSignal(id) {
        return this.signals[id];
    }
    haltSignal(id) {
        if (this.signals[id]) {
            this.signals[id].halt();
        }
    }
    dispatch(id, data, useIdInParams = true) {
        const signal = this.signals[id];
        if (signal) {
            if (data) {
                if (useIdInParams && Object.prototype.toString.call(data) === '[object Object]' && !data.hasOwnProperty('signalType')) {
                    data.signalType = id;
                }
                signal.dispatch.apply(signal, [data]);
            }
            else {
                signal.dispatch();
            }
        }
    }
    dispose() {
        let sigs = this.signals;
        for (const id in sigs) {
            if (!sigs.hasOwnProperty(id)) {
                continue;
            }
            sigs[id].removeAll();
            //sigs[id] = undefined;
            delete sigs[id];
        }
        this.signals = {};
    }
}

function interceptorHandler(injector, id, CommandClass, signal, binding, ...args) {
    const childInjector = injector.createChild();
    childInjector.mapValue('id', id);
    childInjector.mapValue('signal', signal);
    childInjector.mapValue('binding', binding);
    const command = childInjector.createInstance(CommandClass);
    if (typeof command.execute === 'function') {
        command.execute.apply(command, args);
    }
    childInjector.dispose();
}
function addInterceptor(scope, id, CommandClass) {
    const binding = scope.emitter.addListener(id, interceptorHandler, scope);
    binding.params = [scope.injector, id, CommandClass, scope.emitter.getSignal(id), binding];
    return binding;
}
function removeInterceptor(scope, id) {
    const signal = scope.emitter.getSignal(id);
    if (signal) {
        signal.removeAll();
    }
}
function commandOptions(binding) {
    return {
        setInjector: function (injector) {
            if (binding && injector) {
                binding.params[0] = injector;
            }
            return commandOptions(binding);
        }
    };
}
class Commands {
    constructor(emitter, injector) {
        this.list = {};
        this.emitter = emitter;
        this.injector = injector;
    }
    add(id, CommandClass) {
        if (this.list[id]) {
            throw new Error('[Commands] Error: a command with the id: "' + id + '" has already been registered');
        }
        this.list[id] = CommandClass;
        const binding = addInterceptor(this, id, CommandClass);
        return commandOptions(binding);
    }
    get(id) {
        return this.list[id];
    }
    remove(id) {
        if (this.list[id]) {
            this.list[id] = undefined;
            delete this.list[id];
            removeInterceptor(this, id);
        }
    }
    dispose() {
        for (const id in this.list) {
            this.remove(id);
        }
        this.list = {};
        this.emitter = null;
        this.injector = undefined;
    }
}
Commands.inject = ["emitter", "injector"];

const isJQueryLike = (value) => {
    return !!value
        && typeof value.get === 'function'
        && typeof value.length === 'number';
};
class Mediators {
    constructor() {
        this.emitter = undefined;
        this.injector = undefined;
    }
    // setInjector( injector: Injector ): void
    // {
    //     this.injector = injector
    // }
    //
    // setEmitter( emitter: Emitter ): void
    // {
    //     this.emitter = emitter
    // }
    /**
     *
     * @param MediatorClass
     * @param target
     * @param aggregateTarget - if set to true, and target is a list, either of Elements or a NodeList of elements, then only ONE mediator will be created with "target" being the aggregate list of elements / nodes
     *  default set to true in order to avoid unwanted object pollution / amount of concurrent mediator instances where one is in most cases sufficient
     */
    create(MediatorClass, target, aggregateTarget = true) {
        if (!this.injector) {
            throw new Error('injector not present or has been disposed');
        }
        // Normalise jQuery-like input to an array of Elements
        if (isJQueryLike(target)) {
            if (!target.length) {
                return [];
            }
            target = target.get();
        }
        let targetList = [];
        const mediatorList = [];
        if (Array.isArray(target) && target.length > 0) {
            targetList = [...target];
            // if( aggregateTarget ) {
            //     targetList = target
            // } else {
            //     targetList = [...target]
            // }
        }
        else if (target instanceof HTMLElement) {
            targetList = [target];
        }
        else if (target instanceof NodeList) {
            if (aggregateTarget) {
                targetList = [target];
            }
            else {
                target.forEach(node => {
                    targetList.push(node);
                });
            }
        }
        for (let i = 0, l = targetList.length; i < l; i++) {
            const injector = this.injector.createChild();
            //const injector = this.injector;
            injector.mapValue('target', targetList[i]);
            const mediator = injector.createInstance(MediatorClass);
            //call init() method if present -- NOTE already covered in infuse.injector postConstruct()
            // if( typeof MediatorClass.prototype.postConstruct === 'function' ) {
            //     mediator.postConstruct.call( mediator )
            // }
            if (targetList.length === 1) {
                return mediator;
            }
            mediatorList.push(mediator);
        }
        return mediatorList;
    }
    dispose() {
        delete this.emitter;
        delete this.injector;
    }
}
Mediators.inject = ["emitter", "injector"];

const utils = {};
utils.is = {
    object: (value) => typeof value === 'object' && value !== null,
    array: Array.isArray || ((value) => Object.prototype.toString.call(value) === '[object Array]'),
    func: (value) => typeof value === 'function'
};
utils.applyProperties = (target, extension, bindToExtension, list) => {
    if (Object.prototype.toString.apply(list) === '[object Array]') {
        for (let i = 0, l = list.length; i < l; i++) {
            if (target[list[i]] === undefined || target[list[i]] === null) {
                if (bindToExtension && typeof extension[list[i]] === 'function') {
                    target[list[i]] = extension[list[i]].bind(extension);
                }
                else {
                    target[list[i]] = extension[list[i]];
                }
            }
        }
    }
    else {
        for (const prop in extension) {
            if (bindToExtension && typeof extension[prop] === 'function') {
                target[prop] = extension[prop].bind(extension);
            }
            else {
                target[prop] = extension[prop];
            }
        }
    }
};
utils.augment = (target, extension, list) => {
    if (!extension.prototype || !target.prototype) {
        return;
    }
    if (Object.prototype.toString.apply(list) === '[object Array]') {
        for (let i = 0, l = list.length; i < l; i++) {
            if (!target.prototype[list[i]]) {
                target.prototype[list[i]] = extension.prototype[list[i]];
            }
        }
    }
    else {
        for (const prop in extension.prototype) {
            if (!target.prototype[prop]) {
                target.prototype[prop] = extension.prototype[prop];
            }
        }
    }
};
utils.inherit = (parent, obj) => {
    let Parent;
    if (obj && obj.hasOwnProperty('constructor')) {
        // use constructor if defined
        Parent = obj.constructor;
    }
    else {
        // call the super constructor
        Parent = function () {
            return parent.apply(this, arguments);
        };
    }
    // set the prototype chain to inherit from the parent without calling parent's constructor
    const Chain = function () { };
    Chain.prototype = parent.prototype;
    Parent.prototype = new Chain();
    // add obj properties
    if (obj) {
        utils.applyProperties(Parent.prototype, obj);
    }
    // point constructor to the Parent
    Parent.prototype.constructor = Parent;
    // set super class reference
    Parent.parent = parent.prototype;
    // add extend shortcut
    Parent.extend = function (obj) {
        return utils.inherit(Parent, obj);
    };
    return Parent;
};
utils.extend = (obj) => utils.inherit(function () { }, obj);

class Modules {
    constructor(injector) {
        this.injector = injector;
        this.list = {};
    }
    create(module, args, register, useChildInjector) {
        let moduleInstance;
        let moduleClass;
        const shouldRegister = register !== false;
        const shouldUseChildInjector = useChildInjector === true;
        // register module
        const add = (list, id, instance) => {
            if (!list[id] && shouldRegister) {
                list[id] = instance;
            }
        };
        // validate module
        const validate = (moduleClass) => {
            let valid = true;
            if (moduleClass === undefined || moduleClass === null) {
                valid = false;
            }
            else if (typeof moduleClass.id !== 'string') {
                valid = false;
            }
            return valid;
        };
        // create module instance
        const instantiate = (injector, value, args) => {
            const params = infuse.getDependencies(value);
            // add module function
            let moduleArgs = [value];
            // add injection mappings
            for (let i = 0, l = params.length; i < l; i++) {
                if (injector.hasMapping(params[i]) || injector.hasInheritedMapping(params[i])) {
                    moduleArgs.push(injector.getValue(params[i]));
                }
                else {
                    moduleArgs.push(undefined);
                }
            }
            // trim array
            for (let a = moduleArgs.length - 1; a >= 0; a--) {
                if (typeof moduleArgs[a] === 'undefined') {
                    moduleArgs.splice(a, 1);
                }
                else {
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
            moduleClass = module;
        }
        else if (utils.is.object(module) && utils.is.func(module.module)) {
            // module function is contained in an object, on a "module"
            moduleClass = module.module;
        }
        else if (utils.is.object(module) && utils.is.func(module.Module)) {
            // module function is coming from an ES6 import as a Module property
            moduleClass = module.Module;
        }
        else {
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
            }
            else {
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
        return moduleInstance;
    }
    has(id) {
        return this.list[id] !== undefined;
    }
    get(id) {
        return this.list[id];
    }
    remove(id) {
        if (this.list[id]) {
            if (typeof this.list[id].dispose === 'function') {
                this.list[id].dispose();
            }
            this.list[id] = undefined;
            delete this.list[id];
        }
    }
    dispose() {
        for (const id in this.list) {
            this.remove(id);
        }
        this.list = {};
    }
}
Modules.inject = ["injector"];

//import {Injector} from "./infuse";
//import utils from './utils';
class Application {
    get emitter() {
        return this._emitter || new Emitter__();
    }
    get injector() {
        return this._injector || new Injector();
    }
    set commands(value) {
        this._commands = value;
    }
    get commands() {
        if (!this._commands) {
            throw new Error('Commands not initialized. Call setup() first.');
        }
        return this._commands;
    }
    get mediators() {
        return this._mediators || new Mediators();
    }
    get modules() {
        if (!this._modules) {
            throw new Error('Modules not initialized. Call setup() first.');
        }
        return this._modules;
    }
    constructor() {
        this.setup();
        this.init();
        this.initDone();
    }
    setupEmitter() {
        if (this._injector) {
            this._injector.mapClass('emitter', Emitter__, true);
            this._emitter = this._injector.getValue('emitter');
        }
    }
    setup() {
        // create injector
        this._injector = new Injector();
        this._injector.throwOnMissing = false;
        this._injector.mapValue('injector', this._injector);
        // instance
        this._injector.mapValue('instance', this);
        this.setupEmitter();
        // commands
        this._injector.mapClass('commands', Commands, true);
        this._commands = this._injector.getValue('commands');
        // mediators
        this._injector.mapClass('mediators', Mediators, true);
        this._mediators = this._injector.getValue('mediators');
        // modules
        this._injector.mapClass('modules', Modules, true);
        this._modules = this._injector.getValue('modules');
    }
    init() {
    }
    initDone() {
    }
    dispose() {
        if (this._injector) {
            this._injector.dispose();
        }
        if (this.emitter) {
            this.emitter.dispose();
        }
        if (this._commands) {
            this._commands.dispose();
        }
        if (this._mediators) {
            this._mediators.dispose();
        }
        if (this._modules) {
            this._modules.dispose();
        }
        this._injector = undefined;
        this._emitter = undefined;
        this._commands = undefined;
        this._mediators = undefined;
        this._modules = undefined;
    }
}

export { Application, Commands, Emitter__ as Emitter, Mediators, Modules, infuse, utils };
