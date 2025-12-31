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
declare class Modules {
    injector: Injector;
    list: {
        [id: string]: ModuleInstance;
    };
    static inject: string[];
    constructor(injector: Injector);
    create(module: ModuleClass | ModuleInput, args?: any[], register?: boolean, useChildInjector?: boolean): ModuleInstance;
    has(id: string): boolean;
    get(id: string): ModuleInstance;
    remove(id: string): void;
    dispose(): void;
}
export default Modules;
//# sourceMappingURL=Modules.d.ts.map