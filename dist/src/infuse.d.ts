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
declare const infuse: InfuseNamespace;
declare class MappingVO {
    prop: string;
    value: any;
    cl: Function | null;
    singleton: boolean;
    singletonPostConstructed: boolean;
    constructor(prop: string, value: any, cl: Function | null, singleton: boolean);
}
export declare class Injector {
    mappings: {
        [key: string]: MappingVO;
    };
    parent: Injector | null;
    strictMode: boolean;
    strictModeConstructorInjection: boolean;
    throwOnMissing: boolean;
    constructor();
    createChild(): Injector;
    getMappingVo(prop: string): MappingVO | null;
    mapValue(prop: string, val: any): Injector;
    mapClass(prop: string, cl: Function, singleton?: boolean): Injector;
    removeMapping(prop: string): Injector;
    hasMapping(prop: string): boolean;
    hasInheritedMapping(prop: string): boolean;
    getMapping(value: any): string | undefined;
    getValue(prop: string, ...args: any[]): any;
    getClass(prop: string): Function | undefined;
    instantiate(TargetClass: any, ...args: any[]): any;
    inject(target: any, isParent?: boolean): Injector;
    getInjectedValue(vo: MappingVO, name: string): any;
    createInstance(TargetClass: any, ...args: any[]): any;
    getValueFromClass(cl: Function, ...args: any[]): any;
    dispose(): void;
}
export { infuse };
//# sourceMappingURL=infuse.d.ts.map