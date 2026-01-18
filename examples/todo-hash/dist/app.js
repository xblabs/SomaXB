(function () {
    'use strict';

    const FN_ARGS_FUNCTION = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    const FN_ARGS_CLASS = /(?!function)\s*constructor\s*[^\(|function]*\(\s*([^\)]*)\)\s*{/m;
    const FN_ARG_SPLIT = /,/;
    const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    const infuse = {};
    function contains$1(arr, value) {
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
        if (contains$1(params, name)) {
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

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*jslint onevar:true, undef:true, newcap:true, regexp:true, bitwise:true, maxerr:50, indent:4, white:false, nomen:false, plusplus:false */

    var signals = createCommonjsModule(function (module) {
    /*global define:false, require:false, exports:false, module:false, signals:false */

    /** @license
     * JS Signals <http://millermedeiros.github.com/js-signals/>
     * Released under the MIT license
     * Author: Miller Medeiros
     * Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
     */

    (function(global){

        // SignalBinding -------------------------------------------------
        //================================================================

        /**
         * Object that represents a binding between a Signal and a listener function.
         * <br />- <strong>This is an internal constructor and shouldn't be called by regular users.</strong>
         * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
         * @author Miller Medeiros
         * @constructor
         * @internal
         * @name SignalBinding
         * @param {Signal} signal Reference to Signal object that listener is currently bound to.
         * @param {Function} listener Handler function bound to the signal.
         * @param {boolean} isOnce If binding should be executed just once.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. (default = 0).
         */
        function SignalBinding(signal, listener, isOnce, listenerContext, priority) {

            /**
             * Handler function bound to the signal.
             * @type Function
             * @private
             */
            this._listener = listener;

            /**
             * If binding should be executed just once.
             * @type boolean
             * @private
             */
            this._isOnce = isOnce;

            /**
             * Context on which listener will be executed (object that should represent the `this` variable inside listener function).
             * @memberOf SignalBinding.prototype
             * @name context
             * @type Object|undefined|null
             */
            this.context = listenerContext;

            /**
             * Reference to Signal object that listener is currently bound to.
             * @type Signal
             * @private
             */
            this._signal = signal;

            /**
             * Listener priority
             * @type Number
             * @private
             */
            this._priority = priority || 0;
        }

        SignalBinding.prototype = {

            /**
             * If binding is active and should be executed.
             * @type boolean
             */
            active : true,

            /**
             * Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute`. (curried parameters)
             * @type Array|null
             */
            params : null,

            /**
             * Call listener passing arbitrary parameters.
             * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p>
             * @param {Array} [paramsArr] Array of parameters that should be passed to the listener
             * @return {*} Value returned by the listener.
             */
            execute : function (paramsArr) {
                var handlerReturn, params;
                if (this.active && !!this._listener) {
                    params = this.params? this.params.concat(paramsArr) : paramsArr;
                    handlerReturn = this._listener.apply(this.context, params);
                    if (this._isOnce) {
                        this.detach();
                    }
                }
                return handlerReturn;
            },

            /**
             * Detach binding from signal.
             * - alias to: mySignal.remove(myBinding.getListener());
             * @return {Function|null} Handler function bound to the signal or `null` if binding was previously detached.
             */
            detach : function () {
                return this.isBound()? this._signal.remove(this._listener, this.context) : null;
            },

            /**
             * @return {Boolean} `true` if binding is still bound to the signal and have a listener.
             */
            isBound : function () {
                return (!!this._signal && !!this._listener);
            },

            /**
             * @return {boolean} If SignalBinding will only be executed once.
             */
            isOnce : function () {
                return this._isOnce;
            },

            /**
             * @return {Function} Handler function bound to the signal.
             */
            getListener : function () {
                return this._listener;
            },

            /**
             * @return {Signal} Signal that listener is currently bound to.
             */
            getSignal : function () {
                return this._signal;
            },

            /**
             * Delete instance properties
             * @private
             */
            _destroy : function () {
                delete this._signal;
                delete this._listener;
                delete this.context;
            },

            /**
             * @return {string} String representation of the object.
             */
            toString : function () {
                return '[SignalBinding isOnce:' + this._isOnce +', isBound:'+ this.isBound() +', active:' + this.active + ']';
            }

        };


    /*global SignalBinding:false*/

        // Signal --------------------------------------------------------
        //================================================================

        function validateListener(listener, fnName) {
            if (typeof listener !== 'function') {
                throw new Error( 'listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName) );
            }
        }

        /**
         * Custom event broadcaster
         * <br />- inspired by Robert Penner's AS3 Signals.
         * @name Signal
         * @author Miller Medeiros
         * @constructor
         */
        function Signal() {
            /**
             * @type Array.<SignalBinding>
             * @private
             */
            this._bindings = [];
            this._prevParams = null;

            // enforce dispatch to aways work on same context (#47)
            var self = this;
            this.dispatch = function(){
                Signal.prototype.dispatch.apply(self, arguments);
            };
        }

        Signal.prototype = {

            /**
             * Signals Version Number
             * @type String
             * @const
             */
            VERSION : '1.0.0',

            /**
             * If Signal should keep record of previously dispatched parameters and
             * automatically execute listener during `add()`/`addOnce()` if Signal was
             * already dispatched before.
             * @type boolean
             */
            memorize : false,

            /**
             * @type boolean
             * @private
             */
            _shouldPropagate : true,

            /**
             * If Signal is active and should broadcast events.
             * <p><strong>IMPORTANT:</strong> Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
             * @type boolean
             */
            active : true,

            /**
             * @param {Function} listener
             * @param {boolean} isOnce
             * @param {Object} [listenerContext]
             * @param {Number} [priority]
             * @return {SignalBinding}
             * @private
             */
            _registerListener : function (listener, isOnce, listenerContext, priority) {

                var prevIndex = this._indexOfListener(listener, listenerContext),
                    binding;

                if (prevIndex !== -1) {
                    binding = this._bindings[prevIndex];
                    if (binding.isOnce() !== isOnce) {
                        throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
                    }
                } else {
                    binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
                    this._addBinding(binding);
                }

                if(this.memorize && this._prevParams){
                    binding.execute(this._prevParams);
                }

                return binding;
            },

            /**
             * @param {SignalBinding} binding
             * @private
             */
            _addBinding : function (binding) {
                //simplified insertion sort
                var n = this._bindings.length;
                do { --n; } while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);
                this._bindings.splice(n + 1, 0, binding);
            },

            /**
             * @param {Function} listener
             * @return {number}
             * @private
             */
            _indexOfListener : function (listener, context) {
                var n = this._bindings.length,
                    cur;
                while (n--) {
                    cur = this._bindings[n];
                    if (cur._listener === listener && cur.context === context) {
                        return n;
                    }
                }
                return -1;
            },

            /**
             * Check if listener was attached to Signal.
             * @param {Function} listener
             * @param {Object} [context]
             * @return {boolean} if Signal has the specified listener.
             */
            has : function (listener, context) {
                return this._indexOfListener(listener, context) !== -1;
            },

            /**
             * Add a listener to the signal.
             * @param {Function} listener Signal handler function.
             * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
             * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
             * @return {SignalBinding} An Object representing the binding between the Signal and listener.
             */
            add : function (listener, listenerContext, priority) {
                validateListener(listener, 'add');
                return this._registerListener(listener, false, listenerContext, priority);
            },

            /**
             * Add listener to the signal that should be removed after first execution (will be executed only once).
             * @param {Function} listener Signal handler function.
             * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
             * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
             * @return {SignalBinding} An Object representing the binding between the Signal and listener.
             */
            addOnce : function (listener, listenerContext, priority) {
                validateListener(listener, 'addOnce');
                return this._registerListener(listener, true, listenerContext, priority);
            },

            /**
             * Remove a single listener from the dispatch queue.
             * @param {Function} listener Handler function that should be removed.
             * @param {Object} [context] Execution context (since you can add the same handler multiple times if executing in a different context).
             * @return {Function} Listener handler function.
             */
            remove : function (listener, context) {
                validateListener(listener, 'remove');

                var i = this._indexOfListener(listener, context);
                if (i !== -1) {
                    this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
                    this._bindings.splice(i, 1);
                }
                return listener;
            },

            /**
             * Remove all listeners from the Signal.
             */
            removeAll : function () {
                var n = this._bindings.length;
                while (n--) {
                    this._bindings[n]._destroy();
                }
                this._bindings.length = 0;
            },

            /**
             * @return {number} Number of listeners attached to the Signal.
             */
            getNumListeners : function () {
                return this._bindings.length;
            },

            /**
             * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
             * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
             * @see Signal.prototype.disable
             */
            halt : function () {
                this._shouldPropagate = false;
            },

            /**
             * Dispatch/Broadcast Signal to all listeners added to the queue.
             * @param {...*} [params] Parameters that should be passed to each handler.
             */
            dispatch : function (params) {
                if (! this.active) {
                    return;
                }

                var paramsArr = Array.prototype.slice.call(arguments),
                    n = this._bindings.length,
                    bindings;

                if (this.memorize) {
                    this._prevParams = paramsArr;
                }

                if (! n) {
                    //should come after memorize
                    return;
                }

                bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
                this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

                //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
                //reverse loop since listeners with higher priority will be added at the end of the list
                do { n--; } while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);
            },

            /**
             * Forget memorized arguments.
             * @see Signal.memorize
             */
            forget : function(){
                this._prevParams = null;
            },

            /**
             * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
             * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
             */
            dispose : function () {
                this.removeAll();
                delete this._bindings;
                delete this._prevParams;
            },

            /**
             * @return {string} String representation of the object.
             */
            toString : function () {
                return '[Signal active:'+ this.active +' numListeners:'+ this.getNumListeners() +']';
            }

        };


        // Namespace -----------------------------------------------------
        //================================================================

        /**
         * Signals namespace
         * @namespace
         * @name signals
         */
        var signals = Signal;

        /**
         * Custom event broadcaster
         * @see Signal
         */
        // alias for backwards compatibility (see #gh-44)
        signals.Signal = Signal;



        //exports to multiple environments
        if (module.exports){ //node
            module.exports = signals;
        } else { //browser
            //use string because of Google closure compiler ADVANCED_MODE
            /*jslint sub:true */
            global['signals'] = signals;
        }

    }(commonjsGlobal));
    });

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
                this.signals[id] = new signals.Signal();
            }
            return this.signals[id].add(handler, scope, priority);
        }
        addListenerOnce(id, handler, scope, priority) {
            if (!this.signals[id]) {
                this.signals[id] = new signals.Signal();
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

    // Initialize soma namespace
    const soma = {};
    soma.template = {};
    soma.template.version = '0.3.0';
    soma.template.errors = {
        TEMPLATE_STRING_NO_ELEMENT: 'Error in soma.template, a string template requirement a second parameter: an element target - soma.template.create(\'string\', element)',
        TEMPLATE_NO_PARAM: 'Error in soma.template, a template requires at least 1 parameter - soma.template.create(element)'
    };
    let tokenStart = '{{';
    let tokenEnd = '}}';
    let helpersObject = {};
    let helpersScopeObject = {};
    const settings = soma.template.settings = {};
    settings.autocreate = true;
    const tokens = settings.tokens = {
        start: function (value) {
            if (isDefined(value) && value !== '') {
                tokenStart = escapeRegExp(value);
                setRegEX(value, true);
            }
            return tokenStart;
        },
        end: function (value) {
            if (isDefined(value) && value !== '') {
                tokenEnd = escapeRegExp(value);
                setRegEX(value, false);
            }
            return tokenEnd;
        }
    };
    const attributes = settings.attributes = {
        'skip': 'data-skip',
        'repeat': 'data-repeat',
        'src': 'data-src',
        'href': 'data-href',
        'show': 'data-show',
        'hide': 'data-hide',
        'cloak': 'data-cloak',
        'checked': 'data-checked',
        'disabled': 'data-disabled',
        'multiple': 'data-multiple',
        'readonly': 'data-readonly',
        'selected': 'data-selected',
        'template': 'data-template',
        'html': 'data-html',
        'class': 'data-class'
    };
    const vars = settings.vars = {
        index: '$index',
        key: '$key',
        element: '$element',
        parentElement: '$parentElement',
        attribute: '$attribute',
        scope: '$scope'
    };
    const events = settings.events = {};
    settings.eventsPrefix = 'data-';
    const eventsString = 'click dblclick mousedown mouseup mouseover mouseout mousemove mouseenter mouseleave keydown keyup focus blur change select selectstart scroll copy cut paste mousewheel keypress error contextmenu input textinput drag dragenter dragleave dragover dragend dragstart dragover drop load submit reset search resize beforepaste beforecut beforecopy';
    const eventsStringTouch = ' touchstart touchend touchmove touchenter touchleave touchcancel gesturestart gesturechange gestureend';
    const eventsArray = (eventsString + eventsStringTouch).split(' ');
    for (let i = 0, l = eventsArray.length; i < l; i++) {
        events[settings.eventsPrefix + eventsArray[i]] = eventsArray[i];
    }
    const regex = {
        sequence: null,
        token: null,
        expression: null,
        escape: /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
        trim: /^[\s+]+|[\s+]+$/g,
        repeat: /(.*)\s+in\s+(.*)/,
        func: /(.*)\((.*)\)/,
        params: /,\s+|,|\s+,\s+/,
        quote: /\"|\'/g,
        content: /[^.|^\s]/gm,
        depth: /..\//g,
        string: /^(\"|\')(.*)(\"|\')$/
    };
    // Utility functions
    function isArray(value) {
        return Array.isArray(value);
    }
    function isObject(value) {
        return typeof value === 'object' && value !== null;
    }
    function isString(value) {
        return typeof value === 'string';
    }
    function isElement(value) {
        return value ? value.nodeType > 0 : false;
    }
    function isTextNode(el) {
        return el && el.nodeType && el.nodeType === 3;
    }
    function isFunction(value) {
        return value && typeof value === 'function';
    }
    function isDefined(value) {
        return value !== null && value !== undefined;
    }
    function normalizeBoolean(value) {
        if (!isDefined(value)) {
            return false;
        }
        if (value === 'true' || value === '1' || value === true || value === 1) {
            return true;
        }
        if (value === 'false' || value === '0' || value === false || value === 0 || (isString(value) && hasInterpolation(value))) {
            return false;
        }
        return !!value;
    }
    function isExpression(value) {
        return value && isFunction(value.toString) && value.toString() === '[object Expression]';
    }
    function isExpFunction(value) {
        if (!isString(value)) {
            return false;
        }
        return !!value.match(regex.func);
    }
    function childNodeIsTemplate(node) {
        return !!(node && node.parent && templates.get(node.element));
    }
    function escapeRegExp(str) {
        return str.replace(regex.escape, '\\$&');
    }
    function setRegEX(nonEscapedValue, isStartToken) {
        const unescapedCurrentStartToken = tokens.start().replace(/\\/g, '');
        let endSequence = '';
        const ts = isStartToken ? nonEscapedValue : unescapedCurrentStartToken;
        if (ts.length > 1) {
            endSequence = '|\\' + ts[0] + '(?!\\' + ts[1] + ')[^' + ts[0] + ']*';
        }
        regex.sequence = new RegExp(tokens.start() + '.+?' + tokens.end() + '|[^' + tokens.start() + ']+' + endSequence, 'g');
        regex.token = new RegExp(tokens.start() + '.*?' + tokens.end(), 'g');
        regex.expression = new RegExp(tokens.start() + '|' + tokens.end(), 'gm');
    }
    function trim(value) {
        return value.replace(regex.trim, '');
    }
    function trimQuotes(value) {
        if (regex.string.test(value)) {
            return value.slice(1, -1);
        }
        return value;
    }
    function trimArray(value) {
        if (value[0] === '') {
            value.shift();
        }
        if (value[value.length - 1] === '') {
            value.pop();
        }
        return value;
    }
    function trimTokens(value) {
        return value.replace(regex.expression, '');
    }
    function trimScopeDepth(value) {
        return value.replace(regex.depth, '');
    }
    function insertBefore(referenceNode, newNode) {
        if (!referenceNode.parentNode) {
            return;
        }
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
    }
    function insertAfter(referenceNode, newNode) {
        if (!referenceNode.parentNode) {
            return;
        }
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }
    function removeClass(elm, className) {
        elm.classList.remove(className);
    }
    // Modern contains function
    function contains(a, b) {
        if (!b)
            return false;
        const adown = a.nodeType === 9 ? a.documentElement : a;
        const bup = b && b.parentNode;
        return a === bup || !!(bup && bup.nodeType === 1 && adown.contains && adown.contains(bup));
    }
    class HashMap {
        constructor(id) {
            this.items = {};
            this.count = 0;
            this.id = id;
        }
        uuid() {
            return String(++this.count) + this.id;
        }
        getKey(target) {
            if (!target) {
                return;
            }
            if (typeof target !== 'object') {
                return target;
            }
            let result;
            try {
                result = target[this.id] ? target[this.id] : target[this.id] = this.uuid();
            }
            catch (err) {
                // Ignore errors (IE 7-8 text nodes)
            }
            return result;
        }
        remove(key) {
            const k = this.getKey(key);
            if (k) {
                delete this.items[k];
            }
        }
        get(key) {
            const k = this.getKey(key);
            return k ? this.items[k] : undefined;
        }
        put(key, value) {
            const k = this.getKey(key);
            if (k) {
                this.items[k] = value;
            }
        }
        has(key) {
            const k = this.getKey(key);
            return k ? typeof this.items[k] !== 'undefined' : false;
        }
        getData() {
            return this.items;
        }
        dispose() {
            for (const key in this.items) {
                if (this.items.hasOwnProperty(key)) {
                    delete this.items[key];
                }
            }
        }
    }
    function getRepeaterData(repeaterValue, scope) {
        const parts = repeaterValue.match(regex.repeat);
        if (!parts) {
            return;
        }
        const source = parts[2];
        const exp = new Expression(source);
        return exp.getValue(scope);
    }
    function updateScopeWithRepeaterData(repeaterValue, scope, data) {
        const parts = repeaterValue.match(regex.repeat);
        if (!parts) {
            return;
        }
        const name = parts[1];
        scope[name] = data;
    }
    function getWatcherValue(exp, newValue) {
        const node = exp.node || (exp.attribute?.node);
        if (!node)
            return newValue;
        const watchers = node.template?.watchers;
        const nodeTarget = node.element;
        if (!watchers) {
            return newValue;
        }
        let watcherNode = watchers.get(nodeTarget);
        if (!watcherNode && isTextNode(node.element) && node.parent) {
            watcherNode = watchers.get(node.parent.element);
        }
        const watcher = watcherNode ? watcherNode : watchers.get(exp.pattern);
        if (isFunction(watcher)) {
            const watcherValue = watcher(exp.value, newValue, exp.pattern, node.scope, node, exp.attribute);
            if (isDefined(watcherValue)) {
                return watcherValue;
            }
        }
        return newValue;
    }
    function getScopeFromPattern(scope, pattern) {
        let depth = getScopeDepth(pattern);
        let scopeTarget = scope;
        while (depth > 0) {
            scopeTarget = scopeTarget._parent ? scopeTarget._parent : scopeTarget;
            depth--;
        }
        return scopeTarget;
    }
    function getValueFromPattern(scope, pattern, context) {
        const exp = new Expression(pattern);
        return getValue(scope, exp.pattern, exp.path, exp.params, undefined, undefined, undefined, context);
    }
    function getValue(scope, pattern, pathString, params, getFunction, getParams, paramsFound, context) {
        // context
        if (pattern === vars.element) {
            return context?.[vars.element];
        }
        if (pattern === vars.parentElement) {
            return context?.[vars.parentElement];
        }
        if (pattern === vars.attribute) {
            return context?.[vars.attribute];
        }
        if (pattern === vars.scope) {
            return context?.[vars.scope];
        }
        // string
        if (regex.string.test(pattern)) {
            return trimQuotes(pattern);
        }
        else if (!isNaN(Number(pattern))) {
            return +pattern;
        }
        // find params
        const paramsValues = [];
        if (!paramsFound && params) {
            for (let j = 0, jl = params.length; j < jl; j++) {
                paramsValues.push(getValueFromPattern(scope, params[j], context));
            }
        }
        else if (paramsFound) {
            paramsValues.push(...paramsFound);
        }
        if (getParams) {
            return paramsValues;
        }
        // find scope
        const scopeTarget = getScopeFromPattern(scope, pattern);
        // remove parent string
        pattern = pattern.replace(/..\//g, '');
        const cleanPathString = pathString?.replace(/..\//g, '') || '';
        if (!scopeTarget) {
            return undefined;
        }
        // search path
        let path = scopeTarget;
        const pathParts = cleanPathString.split(/\.|\[|\]/g);
        if (pathParts.length > 0) {
            for (let i = 0, l = pathParts.length; i < l; i++) {
                if (pathParts[i] !== '') {
                    path = path[pathParts[i]];
                }
                if (!isDefined(path)) {
                    // no path, search in parent
                    if (scopeTarget._parent) {
                        return getValue(scopeTarget._parent, pattern, cleanPathString, params, getFunction, getParams, paramsValues, context);
                    }
                    else {
                        return undefined;
                    }
                }
            }
        }
        // return value
        if (!isFunction(path)) {
            return path;
        }
        else {
            if (getFunction) {
                return path;
            }
            else {
                return path.apply(null, paramsValues);
            }
        }
    }
    function getExpressionPath(value) {
        const val = value.split('(')[0];
        return trimScopeDepth(val);
    }
    function getParamsFromString(value) {
        return trimArray(value.split(regex.params));
    }
    function getScopeDepth(value) {
        const val = value.split('(')[0];
        const matches = val.match(regex.depth);
        return !matches ? 0 : matches.length;
    }
    function addAttribute(node, name, value) {
        let attr;
        node.attributes = node.attributes || [];
        if (name === settings.attributes.skip) {
            node.skip = normalizeBoolean(value);
        }
        if (name === settings.attributes.html) {
            node.html = normalizeBoolean(value);
        }
        if (name === settings.attributes.repeat && !node.isRepeaterDescendant) {
            node.repeater = value;
        }
        if (hasInterpolation(name + ':' + value) ||
            name === settings.attributes.repeat ||
            name === settings.attributes.skip ||
            name === settings.attributes.html ||
            name === settings.attributes.show ||
            name === settings.attributes.hide ||
            name === settings.attributes.href ||
            name === settings.attributes.class ||
            name === settings.attributes.checked ||
            name === settings.attributes.disabled ||
            name === settings.attributes.multiple ||
            name === settings.attributes.readonly ||
            name === settings.attributes.selected ||
            value.indexOf(settings.attributes.cloak) !== -1) {
            attr = new Attribute(name, value, node);
            node.attributes.push(attr);
        }
        if (events[name]) {
            attr = new Attribute(name, value, node);
            node.attributes.push(attr);
        }
        return attr;
    }
    function getNodeFromElement(element, scope) {
        const node = new TemplateNode(element, scope);
        node.previousSibling = element.previousSibling;
        node.nextSibling = element.nextSibling;
        const eventsArray = [];
        const attrs = element.attributes;
        for (let j = 0, jj = attrs && attrs.length; j < jj; j++) {
            const attr = attrs[j];
            // Modern browsers only include specified attributes in element.attributes
            const newAttr = addAttribute(node, attr.name, attr.value);
            if (events[attr.name] && newAttr) {
                if (events[attr.name] && !node.isRepeaterChild) {
                    eventsArray.push({ name: events[attr.name], value: attr.value, attr: newAttr });
                }
            }
        }
        for (let a = 0, b = eventsArray.length; a < b; a++) {
            node.addEvent(eventsArray[a].name, eventsArray[a].value, eventsArray[a].attr);
        }
        return node;
    }
    function hasInterpolation(value) {
        const matches = value.match(regex.token);
        return matches !== null && matches.length > 0;
    }
    function hasContent(value) {
        return regex.content.test(value);
    }
    function isElementValid(element) {
        if (!element) {
            return false;
        }
        const type = element.nodeType;
        if (!element || !type) {
            return false;
        }
        // comment
        if (type === 8) {
            return false;
        }
        // empty text node
        if (type === 3 && !hasContent(element.nodeValue || '') && !hasInterpolation(element.nodeValue || '')) {
            return false;
        }
        return true;
    }
    function compile(template, element, parent, nodeTarget) {
        if (!isElementValid(element)) {
            return;
        }
        // get node
        let node;
        if (!nodeTarget) {
            node = getNodeFromElement(element, parent ? parent.scope : new Scope(helpersScopeObject)._createChild());
        }
        else {
            node = nodeTarget;
            node.parent = parent || null;
        }
        if (parent && (parent.repeater || parent.isRepeaterChild)) {
            node.isRepeaterChild = true;
        }
        node.template = template;
        // children
        if (node.skip) {
            return node;
        }
        let child = element.firstChild;
        while (child) {
            const childNode = compile(template, child, node);
            if (childNode) {
                childNode.parent = node;
                node.children.push(childNode);
            }
            child = child.nextSibling;
        }
        return node;
    }
    function updateScopeWithData(scope, data) {
        clearScope(scope);
        for (const d in data) {
            if (data.hasOwnProperty(d)) {
                scope[d] = data[d];
            }
        }
    }
    function clearScope(scope) {
        for (const key in scope) {
            if (scope.hasOwnProperty(key)) {
                if (!key.startsWith('_')) {
                    scope[key] = null;
                    delete scope[key];
                }
            }
        }
    }
    function updateNodeChildren(node) {
        if (node.repeater || !node.children || childNodeIsTemplate(node)) {
            return;
        }
        for (let i = 0, l = node.children.length; i < l; i++) {
            node.children[i].update();
        }
    }
    function renderNodeChildren(node) {
        if (!node.children || childNodeIsTemplate(node)) {
            return;
        }
        for (let i = 0, l = node.children.length; i < l; i++) {
            node.children[i].render();
        }
    }
    function renderNodeRepeater(node) {
        const data = getRepeaterData(node.repeater, node.scope);
        let previousElement;
        if (isArray(data)) {
            // process array
            for (let i = 0, l1 = data.length, l2 = node.childrenRepeater.length, l = l1 > l2 ? l1 : l2; i < l; i++) {
                if (i < l1) {
                    previousElement = createRepeaterChild(node, i, data[i], vars.index, i, previousElement);
                }
                else {
                    node.parent.element.removeChild(node.childrenRepeater[i].element);
                    node.childrenRepeater[i].dispose();
                }
            }
            if (node.childrenRepeater.length > data.length) {
                node.childrenRepeater.length = data.length;
            }
        }
        else {
            // process object
            let count = -1;
            for (const o in data) {
                if (data.hasOwnProperty(o)) {
                    count++;
                    previousElement = createRepeaterChild(node, count, data[o], vars.key, o, previousElement);
                }
            }
            const size = count;
            while (count++ < node.childrenRepeater.length - 1) {
                node.parent.element.removeChild(node.childrenRepeater[count].element);
                node.childrenRepeater[count].dispose();
            }
            node.childrenRepeater.length = size + 1;
        }
        if (node.element.parentNode) {
            node.element.parentNode.removeChild(node.element);
        }
    }
    function compileClone(node, newNode) {
        if (!isElementValid(newNode.element)) {
            return;
        }
        // create attribute
        if (node.attributes) {
            for (let i = 0, l = node.attributes.length; i < l; i++) {
                const attr = node.attributes[i];
                const newAttr = addAttribute(newNode, attr.name, attr.value);
                if (events[attr.name] && newAttr) {
                    newNode.addEvent(events[attr.name], attr.value, newAttr);
                }
            }
        }
        // children
        let child = node.element.firstChild;
        let newChild = newNode.element.firstChild;
        let newChildNode;
        // loop
        while (child && newChild) {
            const childNode = node.getNode(child);
            newChildNode = new TemplateNode(newChild, newNode.scope);
            newNode.children.push(newChildNode);
            newChildNode.parent = newNode;
            newChildNode.template = newNode.template;
            newChildNode.isRepeaterChild = true;
            const compiledNode = compileClone(childNode, newChildNode);
            if (compiledNode) {
                compiledNode.parent = newChildNode;
                compiledNode.template = newChildNode.template;
                newChildNode.children.push(compiledNode);
            }
            child = child.nextSibling;
            newChild = newChild.nextSibling;
        }
        return newChildNode;
    }
    function cloneRepeaterNode(element, node) {
        const newNode = new TemplateNode(element, node.scope._createChild());
        newNode.template = node.template;
        newNode.parent = node;
        newNode.isRepeaterChild = true;
        newNode.isRepeaterDescendant = true;
        compileClone(node, newNode);
        return newNode;
    }
    function appendRepeaterElement(previousElement, node, newElement) {
        if (!previousElement) {
            if (node.element.previousSibling) {
                insertAfter(node.element.previousSibling, newElement);
            }
            else if (node.element.nextSibling) {
                insertBefore(node.element.nextSibling, newElement);
            }
            else {
                node.parent.element.appendChild(newElement);
            }
        }
        else {
            insertAfter(previousElement, newElement);
        }
    }
    function createRepeaterChild(node, count, data, indexVar, indexVarValue, previousElement) {
        const existingChild = node.childrenRepeater[count];
        if (!existingChild) {
            const newElement = node.element.cloneNode(true);
            appendRepeaterElement(previousElement, node, newElement);
            const newNode = cloneRepeaterNode(newElement, node);
            node.childrenRepeater[count] = newNode;
            updateScopeWithRepeaterData(node.repeater, newNode.scope, data);
            newNode.scope[indexVar] = indexVarValue;
            newNode.update();
            newNode.render();
            return newElement;
        }
        else {
            // existing node
            updateScopeWithRepeaterData(node.repeater, existingChild.scope, data);
            existingChild.scope[indexVar] = indexVarValue;
            existingChild.update();
            existingChild.render();
            return existingChild.element;
        }
    }
    class Scope {
        constructor(data) {
            return this.createObject(data);
        }
        createObject(data) {
            const self = this;
            const obj = data || {};
            obj._parent = null;
            obj._children = [];
            obj._createChild = function () {
                const child = self.createObject();
                child._parent = obj;
                obj._children.push(child);
                return child;
            };
            return obj;
        }
        _createChild() {
            return this.createObject();
        }
    }
    class TemplateNode {
        constructor(element, scope) {
            this.attributes = null;
            this.value = null;
            this.interpolation = null;
            this.invalidate = false;
            this.skip = false;
            this.repeater = null;
            this.isRepeaterDescendant = false;
            this.isRepeaterChild = false;
            this.parent = null;
            this.children = [];
            this.childrenRepeater = [];
            this.previousSibling = null;
            this.nextSibling = null;
            this.template = null;
            this.eventHandlers = {};
            this.html = false;
            this.element = element;
            this.scope = scope;
            if (isTextNode(this.element)) {
                this.value = this.element.nodeValue;
                this.interpolation = new Interpolation(this.value || '', this, undefined);
            }
        }
        toString() {
            return '[object Node]';
        }
        dispose() {
            this.clearEvents();
            if (this.children) {
                for (let i = 0, l = this.children.length; i < l; i++) {
                    this.children[i].dispose();
                }
            }
            if (this.childrenRepeater) {
                for (let i = 0, l = this.childrenRepeater.length; i < l; i++) {
                    this.childrenRepeater[i].dispose();
                }
            }
            if (this.attributes) {
                for (let i = 0, l = this.attributes.length; i < l; i++) {
                    this.attributes[i].dispose();
                }
            }
            if (this.interpolation) {
                this.interpolation.dispose();
            }
            this.element = null;
            this.scope = null;
            this.attributes = null;
            this.value = null;
            this.interpolation = null;
            this.repeater = null;
            this.parent = null;
            this.children = null;
            this.childrenRepeater = null;
            this.previousSibling = null;
            this.nextSibling = null;
            this.template = null;
            this.eventHandlers = null;
        }
        getNode(element) {
            if (element === this.element) {
                return this;
            }
            if (this.childrenRepeater.length > 0) {
                for (let k = 0, kl = this.childrenRepeater.length; k < kl; k++) {
                    const node = this.childrenRepeater[k].getNode(element);
                    if (node) {
                        return node;
                    }
                }
            }
            for (let i = 0, l = this.children.length; i < l; i++) {
                const node = this.children[i].getNode(element);
                if (node) {
                    return node;
                }
            }
            return null;
        }
        getAttribute(name) {
            if (this.attributes) {
                for (let i = 0, l = this.attributes.length; i < l; i++) {
                    const att = this.attributes[i];
                    if (att.interpolationName && att.interpolationName.value === name) {
                        return att;
                    }
                }
            }
            return undefined;
        }
        update() {
            if (childNodeIsTemplate(this)) {
                return;
            }
            if (isDefined(this.interpolation)) {
                this.interpolation.update();
            }
            if (isDefined(this.attributes)) {
                for (let i = 0, l = this.attributes.length; i < l; i++) {
                    this.attributes[i].update();
                }
            }
            updateNodeChildren(this);
        }
        invalidateData() {
            if (childNodeIsTemplate(this)) {
                return;
            }
            this.invalidate = true;
            if (this.attributes) {
                for (let i = 0, l = this.attributes.length; i < l; i++) {
                    this.attributes[i].invalidate = true;
                }
            }
            for (let i = 0, l = this.childrenRepeater.length; i < l; i++) {
                this.childrenRepeater[i].invalidateData();
            }
            for (let i = 0, l = this.children.length; i < l; i++) {
                this.children[i].invalidateData();
            }
        }
        addEvent(type, pattern, attr) {
            if (this.repeater) {
                return;
            }
            if (this.eventHandlers[type]) {
                this.removeEvent(type);
            }
            const scope = this.scope;
            const node = this;
            const handler = function (event) {
                const exp = new Expression(pattern, node, attr);
                const func = exp.getValue(scope, true);
                const params = exp.getValue(scope, false, true);
                params.unshift(event);
                if (func) {
                    func.apply(null, params);
                }
            };
            this.eventHandlers[type] = handler;
            addEvent(this.element, type, handler);
        }
        removeEvent(type) {
            removeEvent(this.element, type, this.eventHandlers[type]);
            this.eventHandlers[type] = null;
            delete this.eventHandlers[type];
        }
        clearEvents() {
            if (this.eventHandlers) {
                for (const key in this.eventHandlers) {
                    if (this.eventHandlers.hasOwnProperty(key)) {
                        this.removeEvent(key);
                    }
                }
            }
            if (this.children) {
                for (let k = 0, kl = this.children.length; k < kl; k++) {
                    this.children[k].clearEvents();
                }
            }
            if (this.childrenRepeater) {
                for (let f = 0, fl = this.childrenRepeater.length; f < fl; f++) {
                    this.childrenRepeater[f].clearEvents();
                }
            }
        }
        render() {
            if (childNodeIsTemplate(this)) {
                return;
            }
            if (this.invalidate) {
                this.invalidate = false;
                if (isTextNode(this.element)) {
                    if (this.parent && this.parent.html) {
                        this.value = this.parent.element.innerHTML = this.interpolation.render();
                    }
                    else {
                        this.value = this.element.nodeValue = this.interpolation.render();
                    }
                }
            }
            if (this.attributes) {
                for (let i = 0, l = this.attributes.length; i < l; i++) {
                    this.attributes[i].render();
                }
            }
            if (this.repeater) {
                renderNodeRepeater(this);
            }
            else {
                renderNodeChildren(this);
            }
        }
    }
    class Attribute {
        constructor(name, value, node) {
            this.invalidate = false;
            this.name = name;
            this.value = value;
            this.node = node;
            this.interpolationName = new Interpolation(this.name, null, this);
            this.interpolationValue = new Interpolation(this.value, null, this);
        }
        toString() {
            return '[object Attribute]';
        }
        dispose() {
            if (this.interpolationName) {
                this.interpolationName.dispose();
            }
            if (this.interpolationValue) {
                this.interpolationValue.dispose();
            }
            this.interpolationName = null;
            this.interpolationValue = null;
            this.node = null;
            this.name = null;
            this.value = null;
            this.previousName = undefined;
        }
        update() {
            if (this.node.repeater) {
                return;
            }
            this.interpolationName.update();
            this.interpolationValue.update();
        }
        render() {
            if (this.node.repeater) {
                return;
            }
            const element = this.node.element;
            // normal attribute
            function renderAttribute(name, value, node) {
                const el = node.element;
                if (name === 'value' && el.value !== undefined) {
                    el.value = value;
                }
                else if (name === 'class') {
                    el.className = value;
                }
                else {
                    el.setAttribute(name, value);
                }
            }
            // special attribute
            function renderSpecialAttribute(value, attrName, el) {
                if (normalizeBoolean(value)) {
                    el.setAttribute(attrName, attrName);
                }
                else {
                    el.removeAttribute(attrName);
                }
            }
            // src attribute
            function renderSrc(value, el) {
                el.setAttribute('src', value);
            }
            // href attribute
            function renderHref(value, el) {
                el.setAttribute('href', value);
            }
            if (this.invalidate) {
                this.invalidate = false;
                this.previousName = this.name;
                this.name = isDefined(this.interpolationName.render()) ? this.interpolationName.render() : this.name;
                this.value = isDefined(this.interpolationValue.render()) ? this.interpolationValue.render() : this.value;
                if (this.name === attributes.src) {
                    renderSrc(this.value, element);
                }
                else if (this.name === attributes.href) {
                    renderHref(this.value, element);
                }
                else {
                    element.removeAttribute(this.interpolationName.value);
                    if (this.previousName) {
                        if (this.previousName === 'class') {
                            element.className = '';
                        }
                        else {
                            element.removeAttribute(this.previousName);
                        }
                    }
                    renderAttribute(this.name, this.value, this.node);
                }
            }
            // class
            if (this.name === attributes.class) {
                let classConfig;
                try {
                    classConfig = JSON.parse(this.value);
                }
                catch (ex) {
                    throw new Error('Error, the value of a data-class attribute must be a valid JSON: ' + this.value);
                }
                for (const configProperty in classConfig) {
                    const propValue = classConfig[configProperty];
                    const activateClass = propValue ? normalizeBoolean(propValue) : false;
                    if (activateClass) {
                        element.classList.add(configProperty);
                    }
                    else {
                        removeClass(element, configProperty);
                    }
                }
            }
            // cloak
            if (this.name === 'class' && this.value.indexOf(settings.attributes.cloak) !== -1) {
                removeClass(element, settings.attributes.cloak);
            }
            // hide
            if (this.name === attributes.hide) {
                const bool = normalizeBoolean(this.value);
                renderAttribute(this.name, bool, this.node);
                element.style.display = bool ? 'none' : '';
            }
            // show
            if (this.name === attributes.show) {
                const bool = normalizeBoolean(this.value);
                renderAttribute(this.name, bool, this.node);
                element.style.display = bool ? '' : 'none';
            }
            // checked
            if (this.name === attributes.checked) {
                renderSpecialAttribute(this.value, 'checked', element);
                renderAttribute(this.name, normalizeBoolean(this.value), this.node);
                element.checked = normalizeBoolean(this.value);
            }
            // disabled
            if (this.name === attributes.disabled) {
                renderSpecialAttribute(this.value, 'disabled', element);
                renderAttribute(this.name, normalizeBoolean(this.value), this.node);
            }
            // multiple
            if (this.name === attributes.multiple) {
                renderSpecialAttribute(this.value, 'multiple', element);
                renderAttribute(this.name, normalizeBoolean(this.value), this.node);
            }
            // readonly
            if (this.name === attributes.readonly) {
                const bool = normalizeBoolean(this.value);
                renderSpecialAttribute(this.value, 'readonly', element);
                renderAttribute(this.name, bool, this.node);
            }
            // selected
            if (this.name === attributes.selected) {
                renderSpecialAttribute(this.value, 'selected', element);
                renderAttribute(this.name, normalizeBoolean(this.value), this.node);
            }
        }
    }
    class Interpolation {
        constructor(value, node, attribute) {
            this.sequence = [];
            this.expressions = [];
            this.value = node && !isTextNode(node.element) ? trim(value) : value;
            this.node = node;
            this.attribute = attribute;
            const parts = this.value.match(regex.sequence);
            if (parts) {
                for (let i = 0, l = parts.length; i < l; i++) {
                    if (parts[i].match(regex.token)) {
                        const exp = new Expression(trimTokens(parts[i]), this.node, this.attribute);
                        this.sequence.push(exp);
                        this.expressions.push(exp);
                    }
                    else {
                        this.sequence.push(parts[i]);
                    }
                }
                trimArray(this.sequence);
            }
        }
        toString() {
            return '[object Interpolation]';
        }
        dispose() {
            if (this.expressions) {
                for (let i = 0, l = this.expressions.length; i < l; i++) {
                    this.expressions[i].dispose();
                }
            }
            this.value = null;
            this.node = null;
            this.attribute = null;
            this.sequence = null;
            this.expressions = null;
        }
        update() {
            for (let i = 0, l = this.expressions.length; i < l; i++) {
                this.expressions[i].update();
            }
        }
        render() {
            let rendered = '';
            if (this.sequence) {
                for (let i = 0, l = this.sequence.length; i < l; i++) {
                    let val = '';
                    if (isExpression(this.sequence[i])) {
                        val = this.sequence[i].value;
                    }
                    else {
                        val = this.sequence[i];
                    }
                    if (!isDefined(val)) {
                        val = '';
                    }
                    rendered += val;
                }
            }
            return rendered;
        }
    }
    class Expression {
        constructor(pattern, node, attribute) {
            if (!isDefined(pattern)) {
                this.pattern = '';
                this.isString = false;
                this.node = null;
                this.attribute = null;
                this.value = undefined;
                this.isFunction = false;
                this.depth = null;
                this.path = null;
                this.params = null;
                return;
            }
            this.pattern = pattern;
            this.isString = regex.string.test(pattern);
            this.node = node || null;
            this.attribute = attribute;
            this.value = this.isString ? this.pattern : undefined;
            if (this.isString) {
                this.isFunction = false;
                this.depth = null;
                this.path = null;
                this.params = null;
            }
            else {
                this.isFunction = isExpFunction(this.pattern);
                this.depth = getScopeDepth(this.pattern);
                this.path = getExpressionPath(this.pattern);
                const funcMatch = this.pattern.match(regex.func);
                this.params = !this.isFunction ? null : getParamsFromString(funcMatch[2]);
            }
        }
        toString() {
            return '[object Expression]';
        }
        dispose() {
            this.pattern = null;
            this.node = null;
            this.attribute = null;
            this.path = null;
            this.params = null;
            this.value = null;
        }
        update() {
            let node = this.node;
            if (!node && this.attribute) {
                node = this.attribute.node;
            }
            if (!node || !node.scope) {
                return;
            }
            let newValue = this.getValue(node.scope);
            newValue = getWatcherValue(this, newValue);
            if (this.value !== newValue) {
                this.value = newValue;
                const target = this.node || this.attribute;
                if (target) {
                    target.invalidate = true;
                }
            }
        }
        getValue(scope, getFunction, getParams) {
            let node = this.node;
            if (!node && this.attribute) {
                node = this.attribute.node;
            }
            const context = {};
            if (node) {
                context[vars.element] = node.element;
                if (node.element) {
                    context[vars.parentElement] = node.element.parentNode;
                }
            }
            context[vars.attribute] = this.attribute;
            context[vars.scope] = scope;
            return getValue(scope, this.pattern, this.path, this.params, getFunction, getParams, undefined, context);
        }
    }
    const templates = new HashMap('st');
    class Template {
        constructor(element) {
            this.node = null;
            this.scope = null;
            this.watchers = new HashMap('stw');
            this.compile(element);
        }
        toString() {
            return '[object Template]';
        }
        compile(element) {
            if (element) {
                this.element = element;
            }
            if (this.node) {
                this.node.dispose();
            }
            this.node = compile(this, this.element);
            this.node.root = true;
            this.scope = this.node.scope;
        }
        update(data) {
            if (isDefined(data)) {
                updateScopeWithData(this.node.scope, data);
            }
            if (this.node) {
                this.node.update();
            }
        }
        render(data) {
            this.update(data);
            if (this.node) {
                this.node.render();
            }
        }
        invalidate() {
            if (this.node) {
                this.node.invalidateData();
            }
        }
        watch(target, watcher) {
            if ((!isString(target) && !isElement(target)) || !isFunction(watcher)) {
                return;
            }
            this.watchers.put(target, watcher);
        }
        unwatch(target) {
            this.watchers.remove(target);
        }
        clearWatchers() {
            this.watchers.dispose();
        }
        clearEvents() {
            this.node.clearEvents();
        }
        getNode(element) {
            return this.node.getNode(element);
        }
        dispose() {
            templates.remove(this.element);
            if (this.watchers) {
                this.watchers.dispose();
            }
            if (this.node) {
                this.node.dispose();
            }
            this.element = null;
            this.watchers = null;
            this.node = null;
        }
    }
    // Event handling functions (modernized)
    function addEvent(element, type, handler) {
        element.addEventListener(type, handler, false);
    }
    let addEventGuid = 1;
    addEvent.guid = addEventGuid;
    function removeEvent(element, type, handler) {
        element.removeEventListener(type, handler, false);
    }
    let maxDepth;
    const eventStore = [];
    function parseEvents(element, object, depth) {
        maxDepth = depth === undefined ? Number.MAX_VALUE : depth;
        parseNode(element, object, 0, true);
    }
    function parseNode(element, object, depth, isRoot) {
        if (!isElement(element)) {
            throw new Error('Error in soma.template.parseEvents, only a DOM Element can be parsed.');
        }
        if (isRoot) {
            parseAttributes(element, object);
        }
        if (maxDepth === 0) {
            return;
        }
        let child = element.firstChild;
        while (child) {
            if (child.nodeType === 1) {
                if (depth < maxDepth) {
                    parseNode(child, object, depth + 1, false);
                    parseAttributes(child, object);
                }
            }
            child = child.nextSibling;
        }
    }
    function parseAttributes(element, object) {
        const attrs = element.attributes;
        for (let j = 0, jj = attrs && attrs.length; j < jj; j++) {
            const attr = attrs[j];
            // Modern browsers only include specified attributes in element.attributes
            const name = attr.name;
            const value = attr.value;
            if (events[name]) {
                const handler = getHandlerFromPattern(object, value);
                if (handler && isFunction(handler)) {
                    addEvent(element, events[name], handler);
                    eventStore.push({ element: element, type: events[name], handler: handler });
                }
            }
        }
    }
    function getHandlerFromPattern(object, pattern) {
        const parts = pattern.match(regex.func);
        if (parts) {
            const func = parts[1];
            if (isFunction(object[func])) {
                return object[func];
            }
        }
        return undefined;
    }
    function clearEvents(element) {
        for (let i = eventStore.length - 1; i >= 0; i--) {
            const item = eventStore[i];
            if (element === item.element || contains(element, item.element)) {
                removeEvent(item.element, item.type, item.handler);
                eventStore.splice(i, 1);
            }
        }
    }
    // DOMContentLoaded modernized
    const ready = (function () {
        const callbacks = [];
        let isReady = false;
        function executeCallbacks() {
            isReady = true;
            while (callbacks.length) {
                const callback = callbacks.shift();
                if (callback)
                    callback();
            }
        }
        if (typeof document !== 'undefined') {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setTimeout(executeCallbacks, 1);
            }
            else {
                document.addEventListener('DOMContentLoaded', executeCallbacks, false);
            }
        }
        return function (callback) {
            if (isReady) {
                callback();
            }
            else {
                callbacks.push(callback);
            }
        };
    })();
    if (typeof document !== 'undefined' && settings.autocreate) {
        const parse = function (element) {
            let child = !element ? document.body.firstChild : element.firstChild;
            while (child) {
                if (child.nodeType === 1) {
                    parse(child);
                    const attrValue = child.getAttribute(attributes.template);
                    if (attrValue) {
                        try {
                            const getFunction = new Function('return ' + attrValue + ';');
                            const f = getFunction();
                            if (isFunction(f)) {
                                soma.template.bootstrap(attrValue, child, f);
                            }
                        }
                        catch (e) {
                            console.error('Error auto-creating template:', e);
                        }
                    }
                }
                child = child.nextSibling;
            }
        };
        ready(parse);
    }
    function bootstrapTemplate(attrValue, element, func) {
        const tpl = createTemplate(element);
        func(tpl, tpl.scope, tpl.element, tpl.node);
    }
    function createTemplate(source, target) {
        let element;
        if (isString(source)) {
            // string template
            if (!isElement(target)) {
                throw new Error(soma.template.errors.TEMPLATE_STRING_NO_ELEMENT);
            }
            target.innerHTML = source;
            element = target;
        }
        else if (isElement(source)) {
            if (isElement(target)) {
                // element template with target
                target.innerHTML = source.innerHTML;
                element = target;
            }
            else {
                // element template
                element = source;
            }
        }
        else {
            throw new Error(soma.template.errors.TEMPLATE_NO_PARAM);
        }
        // existing template
        if (getTemplate(element)) {
            getTemplate(element).dispose();
            templates.remove(element);
        }
        // create template
        const template = new Template(element);
        templates.put(element, template);
        return template;
    }
    function getTemplate(element) {
        return templates.get(element);
    }
    function renderAllTemplates() {
        const data = templates.getData();
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const template = templates.get(key);
                if (template) {
                    template.render();
                }
            }
        }
    }
    function appendHelpers(obj) {
        if (obj === null) {
            helpersObject = {};
            helpersScopeObject = {};
        }
        if (isDefined(obj) && isObject(obj)) {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    helpersObject[key] = helpersScopeObject[key] = obj[key];
                }
            }
        }
        return helpersObject;
    }
    // set regex
    tokens.start(tokenStart);
    tokens.end(tokenEnd);
    // plugins
    soma.plugins = soma.plugins || {};
    const TemplatePlugin = function (instance, injector) {
        instance.constructor.prototype.createTemplate = function (cl, domElement) {
            if (!cl || typeof cl !== 'function') {
                throw new Error('Error creating a template, the first parameter must be a function.');
            }
            if (domElement && isElement(domElement)) {
                const template = soma.template.create(domElement);
                for (const key in template) {
                    if (typeof template[key] === 'function') {
                        cl.prototype[key] = template[key].bind(template);
                    }
                }
                cl.prototype.render = template.render.bind(template);
                const childInjector = injector.createChild();
                childInjector.mapValue('template', template);
                childInjector.mapValue('scope', template.scope);
                childInjector.mapValue('element', template.element);
                return childInjector.createInstance(cl);
            }
            return null;
        };
        soma.template.bootstrap = function (attrValue, element, func) {
            instance.createTemplate(func, element);
        };
    };
    if (soma.plugins && soma.plugins.add) {
        soma.plugins.add(TemplatePlugin);
    }
    soma.template.Plugin = TemplatePlugin;
    // exports
    soma.template.create = createTemplate;
    soma.template.get = getTemplate;
    soma.template.renderAll = renderAllTemplates;
    soma.template.helpers = appendHelpers;
    soma.template.bootstrap = bootstrapTemplate;
    soma.template.addEvent = addEvent;
    soma.template.removeEvent = removeEvent;
    soma.template.parseEvents = parseEvents;
    soma.template.clearEvents = clearEvents;
    soma.template.ready = ready;

    class Model {
        constructor() {
            this.storeKey = 'todos-somajs';
        }
        get() {
            return JSON.parse(localStorage.getItem(this.storeKey) || '[]');
        }
        set(items) {
            localStorage.setItem(this.storeKey, JSON.stringify(items));
        }
    }

    const ENTER_KEY = 13;
    class TodoTemplate {
        constructor(scope, template, model, router) {
            let todos = scope.todos = model.get();
            router.on(/.*/, () => {
                render();
            });
            const render = () => {
                scope.active = getActiveItems(scope.todos);
                scope.completed = scope.todos.length - scope.active;
                scope.allCompleted = scope.todos.length > 0 && scope.active === 0;
                scope.clearCompletedVisible = scope.completed > 0;
                scope.itemLabel = scope.active === 1 ? 'item' : 'items';
                template.render();
                model.set(todos);
            };
            scope.filteredTodos = () => {
                const filter = router.getRoute()[0];
                if (filter === '') {
                    return todos;
                }
                return todos.filter((todo) => {
                    return filter === 'active' ? !todo.completed : todo.completed;
                });
            };
            scope.completedClass = (completed) => {
                return completed ? 'completed' : '';
            };
            scope.add = (event) => {
                const target = event.currentTarget;
                const value = target.value.trim();
                if (event.which === ENTER_KEY && value !== '') {
                    todos.push({
                        title: value,
                        completed: false
                    });
                    render();
                    target.value = '';
                }
            };
            scope.remove = (_event, todo) => {
                if (todo) {
                    todos.splice(todos.indexOf(todo), 1);
                    render();
                }
            };
            scope.toggle = (_event, todo) => {
                todo.completed = !todo.completed;
                render();
            };
            scope.edit = (_event, todo) => {
                todo.editing = 'editing';
                render();
            };
            scope.update = (event, todo) => {
                const target = event.currentTarget;
                const value = target.value.trim();
                if (event.which === ENTER_KEY) {
                    if (value) {
                        todo.title = value;
                    }
                    else {
                        todos.splice(todos.indexOf(todo), 1);
                    }
                    todo.editing = '';
                    render();
                }
            };
            scope.toggleAll = (event) => {
                const target = event.currentTarget;
                todos.forEach((todo) => {
                    todo.completed = target.checked;
                });
                render();
            };
            scope.clearCompleted = () => {
                todos = scope.todos = todos.filter((todo) => !todo.completed);
                render();
            };
            scope.clear = (event) => {
                const target = event.currentTarget;
                target.value = '';
            };
            function getActiveItems(_data) {
                return todos.filter((todo) => !todo.completed).length;
            }
            render();
        }
    }
    TodoTemplate.inject = ['scope', 'template', 'model', 'router'];

    class TodoApp extends Application {
        init() {
            this.injector.mapClass('model', Model, true);
            this.injector.mapValue('router', new Router().init());
            const templateEl = document.getElementById('todoapp');
            if (templateEl) {
                const template = undefined(templateEl);
                const childInjector = this.injector.createChild();
                childInjector.mapValue('template', template);
                childInjector.mapValue('scope', template.scope);
                childInjector.createInstance(TodoTemplate);
            }
        }
    }
    // Initialize the app
    new TodoApp();

})();
