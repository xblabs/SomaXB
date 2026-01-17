interface Utils {
    is: {
        object: (value: any) => boolean;
        array: (value: any) => boolean;
        func: (value: any) => boolean;
    };
    applyProperties: (target: any, extension: any, bindToExtension?: boolean, list?: string[]) => void;
    augment: (target: any, extension: any, list?: string[]) => void;
    inherit: (parent: any, obj?: any) => any;
    extend: (obj?: any) => any;
}

const utils: Utils = {} as Utils;

utils.is = {
    object: (value: any): boolean => typeof value === 'object' && value !== null,
    array: Array.isArray || ((value: any): boolean => Object.prototype.toString.call(value) === '[object Array]'),
    func: (value: any): boolean => typeof value === 'function'
};

utils.applyProperties = (target: any, extension: any, bindToExtension?: boolean, list?: string[]): void => {
    if (Object.prototype.toString.apply(list) === '[object Array]') {
        for (let i = 0, l = list!.length; i < l; i++) {
            if (target[list![i]] === undefined || target[list![i]] === null) {
                if (bindToExtension && typeof extension[list![i]] === 'function') {
                    target[list![i]] = extension[list![i]].bind(extension);
                }
                else {
                    target[list![i]] = extension[list![i]];
                }
            }
        }
    }
    else {
        for (const prop in extension) {
            if (target[prop] === undefined || target[prop] === null) {
                if (bindToExtension && typeof extension[prop] === 'function') {
                    target[prop] = extension[prop].bind(extension);
                }
                else {
                    target[prop] = extension[prop];
                }
            }
        }
    }
};

utils.augment = (target: any, extension: any, list?: string[]): void => {
    if (!extension.prototype || !target.prototype) {
        return;
    }
    if (Object.prototype.toString.apply(list) === '[object Array]') {
        for (let i = 0, l = list!.length; i < l; i++) {
            if (!target.prototype[list![i]]) {
                target.prototype[list![i]] = extension.prototype[list![i]];
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

utils.inherit = (parent: any, obj?: any): any => {
    let Parent: any;
    if (obj && obj.hasOwnProperty('constructor')) {
        // use constructor if defined
        Parent = obj.constructor;
    } else {
        // call the super constructor
        Parent = function (this: any) {
            return parent.apply(this, arguments);
        };
    }
    // set the prototype chain to inherit from the parent without calling parent's constructor
    const Chain = function(){};
    Chain.prototype = parent.prototype;
    Parent.prototype = new (Chain as any)();
    // add obj properties
    if (obj) {
        utils.applyProperties(Parent.prototype, obj);
    }
    // point constructor to the Parent
    Parent.prototype.constructor = Parent;
    // set super class reference
    Parent.parent = parent.prototype;
    // add extend shortcut
    Parent.extend = function (obj: any) {
        return utils.inherit(Parent, obj);
    };
    return Parent;
};

utils.extend = (obj?: any): any => utils.inherit(function() {}, obj);

export default utils;
