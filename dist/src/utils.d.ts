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
declare const utils: Utils;
export default utils;
//# sourceMappingURL=utils.d.ts.map