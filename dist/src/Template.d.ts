interface SomaTemplateErrors {
    TEMPLATE_STRING_NO_ELEMENT: string;
    TEMPLATE_NO_PARAM: string;
}
interface TokenSettings {
    start(value?: string): string;
    end(value?: string): string;
}
interface AttributeSettings {
    skip: string;
    repeat: string;
    src: string;
    href: string;
    show: string;
    hide: string;
    cloak: string;
    checked: string;
    disabled: string;
    multiple: string;
    readonly: string;
    selected: string;
    template: string;
    html: string;
    class: string;
}
interface VarSettings {
    index: string;
    key: string;
    element: string;
    parentElement: string;
    attribute: string;
    scope: string;
}
interface EventSettings {
    [key: string]: string;
}
interface Settings {
    autocreate: boolean;
    tokens: TokenSettings;
    attributes: AttributeSettings;
    vars: VarSettings;
    events: EventSettings;
    eventsPrefix: string;
}
interface SomaTemplate {
    version: string;
    errors: SomaTemplateErrors;
    settings: Settings;
    create(source: string | Element, target?: Element): Template;
    get(element: Element): Template | undefined;
    renderAll(): void;
    helpers(obj: any): any;
    bootstrap(attrValue: string, element: Element, func: Function): void;
    addEvent(element: Element, type: string, handler: EventListener): void;
    removeEvent(element: Element, type: string, handler: EventListener): void;
    parseEvents(element: Element, object: any, depth?: number): void;
    clearEvents(element: Element): void;
    ready(callback: () => void): void;
    Plugin: any;
}
interface Soma {
    template: SomaTemplate;
    plugins?: {
        add?: (plugin: any) => void;
    };
}
interface ScopeData {
    [key: string]: any;
    _parent?: ScopeData | null;
    _children?: ScopeData[];
    _createChild?: () => ScopeData;
}
interface EventHandler {
    (event: Event): void;
    $$guid?: number;
}
declare const soma: Soma;
declare class HashMap {
    private items;
    private count;
    private id;
    constructor(id: string);
    private uuid;
    private getKey;
    remove(key: any): void;
    get(key: any): any;
    put(key: any, value: any): void;
    has(key: any): boolean;
    getData(): {
        [key: string]: any;
    };
    dispose(): void;
}
declare class TemplateNode {
    element: any;
    scope: ScopeData;
    attributes: Attribute[] | null;
    value: string | null;
    interpolation: Interpolation | null;
    invalidate: boolean;
    skip: boolean;
    repeater: string | null;
    isRepeaterDescendant: boolean;
    isRepeaterChild: boolean;
    parent: TemplateNode | null;
    children: TemplateNode[];
    childrenRepeater: TemplateNode[];
    previousSibling: ChildNode | null;
    nextSibling: ChildNode | null;
    template: Template | null;
    eventHandlers: {
        [type: string]: EventHandler;
    };
    html: boolean;
    constructor(element: any, scope: ScopeData);
    toString(): string;
    dispose(): void;
    getNode(element: ChildNode): TemplateNode | null;
    getAttribute(name: string): Attribute | undefined;
    update(): void;
    invalidateData(): void;
    addEvent(type: string, pattern: string, attr: Attribute): void;
    removeEvent(type: string): void;
    clearEvents(): void;
    render(): void;
}
declare class Attribute {
    name: string;
    value: string;
    node: TemplateNode;
    interpolationName: Interpolation;
    interpolationValue: Interpolation;
    invalidate: boolean;
    previousName?: string;
    constructor(name: string, value: string, node: TemplateNode);
    toString(): string;
    dispose(): void;
    update(): void;
    render(): void;
}
declare class Interpolation {
    value: string;
    node: TemplateNode | null;
    attribute: Attribute | null | undefined;
    sequence: (string | Expression)[];
    expressions: Expression[];
    constructor(value: string, node: TemplateNode | null, attribute?: Attribute | null);
    toString(): string;
    dispose(): void;
    update(): void;
    render(): string;
}
declare class Expression {
    pattern: string;
    isString: boolean;
    node: TemplateNode | null;
    attribute: Attribute | null | undefined;
    value: any;
    isFunction: boolean;
    depth: number | null;
    path: string | null;
    params: string[] | null;
    constructor(pattern: string, node?: TemplateNode | null, attribute?: Attribute | null);
    toString(): string;
    dispose(): void;
    update(): void;
    getValue(scope: ScopeData, getFunction?: boolean, getParams?: boolean): any;
}
declare class Template {
    watchers: HashMap;
    node: TemplateNode | null;
    scope: ScopeData | null;
    element: Element;
    constructor(element: Element);
    toString(): string;
    compile(element?: Element): void;
    update(data?: any): void;
    render(data?: any): void;
    invalidate(): void;
    watch(target: string | Element, watcher: Function): void;
    unwatch(target: string | Element): void;
    clearWatchers(): void;
    clearEvents(): void;
    getNode(element: ChildNode): TemplateNode | null;
    dispose(): void;
}
export default soma;
//# sourceMappingURL=Template.d.ts.map