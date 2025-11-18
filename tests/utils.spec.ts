// @ts-ignore
import utils from '../src/utils';

describe('Utils Tests', () => {
    describe('is.object', () => {
        it('should return true for plain objects', () => {
            expect(utils.is.object({})).toBe(true);
            expect(utils.is.object({ key: 'value' })).toBe(true);
            expect(utils.is.object(new Object())).toBe(true);
        });

        it('should return true for arrays', () => {
            expect(utils.is.object([])).toBe(true);
            expect(utils.is.object([1, 2, 3])).toBe(true);
        });

        it('should return true for dates', () => {
            expect(utils.is.object(new Date())).toBe(true);
        });

        it('should return true for RegExp', () => {
            expect(utils.is.object(/test/)).toBe(true);
        });

        it('should return false for null', () => {
            expect(utils.is.object(null)).toBe(false);
        });

        it('should return false for primitives', () => {
            expect(utils.is.object('string')).toBe(false);
            expect(utils.is.object(42)).toBe(false);
            expect(utils.is.object(true)).toBe(false);
            expect(utils.is.object(undefined)).toBe(false);
        });

        it('should return false for functions', () => {
            expect(utils.is.object(() => {})).toBe(false);
            expect(utils.is.object(function() {})).toBe(false);
        });
    });

    describe('is.array', () => {
        it('should return true for arrays', () => {
            expect(utils.is.array([])).toBe(true);
            expect(utils.is.array([1, 2, 3])).toBe(true);
            expect(utils.is.array(new Array())).toBe(true);
            expect(utils.is.array(Array(5))).toBe(true);
        });

        it('should return false for non-arrays', () => {
            expect(utils.is.array({})).toBe(false);
            expect(utils.is.array('string')).toBe(false);
            expect(utils.is.array(42)).toBe(false);
            expect(utils.is.array(null)).toBe(false);
            expect(utils.is.array(undefined)).toBe(false);
        });

        it('should return false for array-like objects', () => {
            const arrayLike = { 0: 'a', 1: 'b', length: 2 };
            expect(utils.is.array(arrayLike)).toBe(false);
        });
    });

    describe('is.func', () => {
        it('should return true for functions', () => {
            expect(utils.is.func(function() {})).toBe(true);
            expect(utils.is.func(() => {})).toBe(true);
            expect(utils.is.func(function named() {})).toBe(true);
        });

        it('should return true for classes', () => {
            class TestClass {}
            expect(utils.is.func(TestClass)).toBe(true);
        });

        it('should return true for built-in functions', () => {
            expect(utils.is.func(Date)).toBe(true);
            expect(utils.is.func(Array)).toBe(true);
            expect(utils.is.func(Object)).toBe(true);
        });

        it('should return false for non-functions', () => {
            expect(utils.is.func({})).toBe(false);
            expect(utils.is.func([])).toBe(false);
            expect(utils.is.func('string')).toBe(false);
            expect(utils.is.func(42)).toBe(false);
            expect(utils.is.func(null)).toBe(false);
            expect(utils.is.func(undefined)).toBe(false);
        });
    });

    describe('applyProperties', () => {
        it('should copy all properties from extension to target', () => {
            const target: any = {};
            const extension = { a: 1, b: 2, c: 3 };

            utils.applyProperties(target, extension);

            expect(target.a).toBe(1);
            expect(target.b).toBe(2);
            expect(target.c).toBe(3);
        });

        it('should not override existing properties', () => {
            const target: any = { a: 'original' };
            const extension = { a: 'new', b: 2 };

            utils.applyProperties(target, extension);

            expect(target.a).toBe('original');
            expect(target.b).toBe(2);
        });

        it('should override null properties', () => {
            const target: any = { a: null };
            const extension = { a: 'new' };

            utils.applyProperties(target, extension);

            expect(target.a).toBe('new');
        });

        it('should override undefined properties', () => {
            const target: any = { a: undefined };
            const extension = { a: 'new' };

            utils.applyProperties(target, extension);

            expect(target.a).toBe('new');
        });

        it('should copy only specified properties when list is provided', () => {
            const target: any = {};
            const extension = { a: 1, b: 2, c: 3 };

            utils.applyProperties(target, extension, false, ['a', 'c']);

            expect(target.a).toBe(1);
            expect(target.b).toBeUndefined();
            expect(target.c).toBe(3);
        });

        it('should bind functions to extension when bindToExtension is true', () => {
            const target: any = {};
            const extension = {
                name: 'extension',
                getName(this: any) {
                    return this.name;
                }
            };

            utils.applyProperties(target, extension, true);

            expect(target.getName()).toBe('extension');
        });

        it('should not bind functions when bindToExtension is false', () => {
            const target: any = { name: 'target' };
            const extension = {
                name: 'extension',
                getName(this: any) {
                    return this.name;
                }
            };

            utils.applyProperties(target, extension, false);

            expect(target.getName()).toBe('target');
        });

        it('should bind only specified functions when list and bindToExtension are used', () => {
            const target: any = {};
            const extension = {
                value: 'extension',
                getValue(this: any) { return this.value; },
                other(this: any) { return this.value; }
            };

            utils.applyProperties(target, extension, true, ['getValue']);

            expect(target.getValue).toBeDefined();
            expect(target.other).toBeUndefined();
        });

        it('should handle empty extension object', () => {
            const target: any = { existing: 'value' };
            utils.applyProperties(target, {});

            expect(target.existing).toBe('value');
        });

        it('should handle empty list', () => {
            const target: any = {};
            const extension = { a: 1, b: 2 };

            utils.applyProperties(target, extension, false, []);

            expect(target.a).toBeUndefined();
            expect(target.b).toBeUndefined();
        });
    });

    describe('augment', () => {
        it('should copy prototype methods from extension to target', () => {
            function Target() {}
            function Extension(this: any) {}
            Extension.prototype.method = function() { return 'extension'; };

            utils.augment(Target, Extension);

            expect((Target.prototype as any).method()).toBe('extension');
        });

        it('should not override existing prototype methods', () => {
            function Target() {}
            Target.prototype.method = function() { return 'target'; };

            function Extension(this: any) {}
            Extension.prototype.method = function() { return 'extension'; };

            utils.augment(Target, Extension);

            expect((Target.prototype as any).method()).toBe('target');
        });

        it('should copy only specified methods when list is provided', () => {
            function Target() {}
            function Extension(this: any) {}
            Extension.prototype.method1 = function() { return 'method1'; };
            Extension.prototype.method2 = function() { return 'method2'; };
            Extension.prototype.method3 = function() { return 'method3'; };

            utils.augment(Target, Extension, ['method1', 'method3']);

            expect((Target.prototype as any).method1).toBeDefined();
            expect((Target.prototype as any).method2).toBeUndefined();
            expect((Target.prototype as any).method3).toBeDefined();
        });

        it('should handle missing prototype on extension', () => {
            function Target() {}
            const extension: any = {};

            expect(() => {
                utils.augment(Target, extension);
            }).not.toThrow();
        });

        it('should handle missing prototype on target', () => {
            const target: any = {};
            function Extension(this: any) {}

            expect(() => {
                utils.augment(target, Extension);
            }).not.toThrow();
        });
    });

    describe('inherit', () => {
        it('should create child constructor that inherits from parent', () => {
            function Parent(this: any) {
                this.parentProp = 'parent';
            }
            Parent.prototype.parentMethod = function() { return 'parent'; };

            const Child = utils.inherit(Parent);
            const instance = new (Child as any)();

            expect(instance.parentProp).toBe('parent');
            expect(instance.parentMethod()).toBe('parent');
        });

        it('should use provided constructor when obj has constructor property', () => {
            let constructorCalled = false;

            function Parent(this: any) {
                this.parentProp = 'parent';
            }

            const Child = utils.inherit(Parent, {
                constructor: function(this: any) {
                    constructorCalled = true;
                    Parent.call(this);
                    this.childProp = 'child';
                }
            });

            const instance = new (Child as any)();

            expect(constructorCalled).toBe(true);
            expect(instance.parentProp).toBe('parent');
            expect(instance.childProp).toBe('child');
        });

        it('should add obj properties to child prototype', () => {
            function Parent() {}

            const Child = utils.inherit(Parent, {
                childMethod: function() { return 'child'; },
                childProp: 'value'
            });

            const instance = new (Child as any)();

            expect((instance as any).childMethod()).toBe('child');
            expect((instance as any).childProp).toBe('value');
        });

        it('should set constructor property correctly', () => {
            function Parent() {}
            const Child = utils.inherit(Parent);

            expect(Child.prototype.constructor).toBe(Child);
        });

        it('should set parent reference', () => {
            function Parent() {}
            Parent.prototype.parentMethod = function() {};

            const Child = utils.inherit(Parent);

            expect((Child as any).parent).toBe(Parent.prototype);
        });

        it('should add extend method for further inheritance', () => {
            function Parent() {}
            const Child = utils.inherit(Parent);

            expect((Child as any).extend).toBeDefined();
            expect(typeof (Child as any).extend).toBe('function');
        });

        it('should support multi-level inheritance', () => {
            function GrandParent(this: any) {
                this.grandParentProp = 'grandparent';
            }

            const Parent = utils.inherit(GrandParent, {
                parentMethod: function() { return 'parent'; }
            });

            const Child = utils.inherit(Parent, {
                childMethod: function() { return 'child'; }
            });

            const instance = new (Child as any)();

            expect(instance.grandParentProp).toBe('grandparent');
            expect((instance as any).parentMethod()).toBe('parent');
            expect((instance as any).childMethod()).toBe('child');
        });

        it('should use extend shortcut for chaining', () => {
            function Parent() {}
            Parent.prototype.parentMethod = function() { return 'parent'; };

            const Child = utils.inherit(Parent);
            const GrandChild = (Child as any).extend({
                grandChildMethod: function() { return 'grandchild'; }
            });

            const instance = new GrandChild();

            expect((instance as any).parentMethod()).toBe('parent');
            expect((instance as any).grandChildMethod()).toBe('grandchild');
        });

        it('should maintain instanceof chain', () => {
            function Parent() {}
            const Child = utils.inherit(Parent);

            const instance = new (Child as any)();

            expect(instance instanceof (Child as any)).toBe(true);
            expect(instance instanceof Parent).toBe(true);
        });

        it('should handle parent with arguments', () => {
            function Parent(this: any, value: any) {
                this.value = value;
            }

            const Child = utils.inherit(Parent);
            const instance = new (Child as any)('test');

            expect(instance.value).toBe('test');
        });
    });

    describe('extend', () => {
        it('should create a new class with obj properties', () => {
            const MyClass = utils.extend({
                method: function() { return 'value'; },
                prop: 'property'
            });

            const instance = new (MyClass as any)();

            expect((instance as any).method()).toBe('value');
            expect((instance as any).prop).toBe('property');
        });

        it('should create class with constructor', () => {
            let constructorCalled = false;

            const MyClass = utils.extend({
                constructor: function(this: any, value: any) {
                    constructorCalled = true;
                    this.value = value;
                }
            });

            const instance = new (MyClass as any)('test');

            expect(constructorCalled).toBe(true);
            expect(instance.value).toBe('test');
        });

        it('should support extend method on created class', () => {
            const Parent = utils.extend({
                parentMethod: function() { return 'parent'; }
            });

            const Child = (Parent as any).extend({
                childMethod: function() { return 'child'; }
            });

            const instance = new Child();

            expect((instance as any).parentMethod()).toBe('parent');
            expect((instance as any).childMethod()).toBe('child');
        });

        it('should handle no obj parameter', () => {
            const MyClass = utils.extend();
            const instance = new (MyClass as any)();

            expect(instance).toBeDefined();
        });

        it('should handle empty obj', () => {
            const MyClass = utils.extend({});
            const instance = new (MyClass as any)();

            expect(instance).toBeDefined();
        });
    });

    describe('Integration Tests', () => {
        it('should support complex inheritance chains', () => {
            function Animal(this: any, name: any) {
                this.name = name;
            }
            Animal.prototype.speak = function() {
                return 'Animal speaks';
            };

            const Dog = utils.inherit(Animal, {
                constructor: function(this: any, name: any, breed: any) {
                    Animal.call(this, name);
                    this.breed = breed;
                },
                bark: function() {
                    return 'Woof!';
                }
            });

            const Puppy = (Dog as any).extend({
                constructor: function(this: any, name: any, breed: any, age: any) {
                    (Dog as any).call(this, name, breed);
                    this.age = age;
                },
                play: function() {
                    return 'Playing!';
                }
            });

            const puppy = new Puppy('Max', 'Golden Retriever', 6);

            expect(puppy.name).toBe('Max');
            expect(puppy.breed).toBe('Golden Retriever');
            expect(puppy.age).toBe(6);
            expect(puppy.speak()).toBe('Animal speaks');
            expect(puppy.bark()).toBe('Woof!');
            expect(puppy.play()).toBe('Playing!');
        });

        it('should support mixin pattern with applyProperties', () => {
            const EventMixin = {
                on: function() { return 'on'; },
                off: function() { return 'off'; },
                trigger: function() { return 'trigger'; }
            };

            function MyClass() {}

            utils.applyProperties(MyClass.prototype, EventMixin);

            const instance = new (MyClass as any)();

            expect((instance as any).on()).toBe('on');
            expect((instance as any).off()).toBe('off');
            expect((instance as any).trigger()).toBe('trigger');
        });

        it('should support trait composition with augment', () => {
            function Target() {}

            function Trait1(this: any) {}
            Trait1.prototype.method1 = function() { return 'method1'; };

            function Trait2(this: any) {}
            Trait2.prototype.method2 = function() { return 'method2'; };

            utils.augment(Target, Trait1);
            utils.augment(Target, Trait2);

            const instance = new (Target as any)();

            expect((instance as any).method1()).toBe('method1');
            expect((instance as any).method2()).toBe('method2');
        });
    });
});
