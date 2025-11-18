// TypeScript interfaces and types
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

interface RegexPatterns {
    sequence: RegExp | null;
    token: RegExp | null;
    expression: RegExp | null;
    escape: RegExp;
    trim: RegExp;
    repeat: RegExp;
    func: RegExp;
    params: RegExp;
    quote: RegExp;
    content: RegExp;
    depth: RegExp;
    string: RegExp;
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

interface ElementWithEvents extends Element {
    events?: { [type: string]: { [guid: number]: EventHandler } };
    $$handleEvent?: EventHandler;
}

// Initialize soma namespace
const soma: Soma = {} as Soma;
soma.template = {} as SomaTemplate;
soma.template.version = '0.3.0';

soma.template.errors = {
    TEMPLATE_STRING_NO_ELEMENT: 'Error in soma.template, a string template requirement a second parameter: an element target - soma.template.create(\'string\', element)',
    TEMPLATE_NO_PARAM: 'Error in soma.template, a template requires at least 1 parameter - soma.template.create(element)'
};

let tokenStart = '{{';
let tokenEnd = '}}';
let helpersObject: any = {};
let helpersScopeObject: any = {};

const settings: Settings = soma.template.settings = {} as Settings;
settings.autocreate = true;

const tokens: TokenSettings = settings.tokens = {
    start: function(value?: string): string {
        if (isDefined(value) && value !== '') {
            tokenStart = escapeRegExp(value!);
            setRegEX(value!, true);
        }
        return tokenStart;
    },
    end: function(value?: string): string {
        if (isDefined(value) && value !== '') {
            tokenEnd = escapeRegExp(value!);
            setRegEX(value!, false);
        }
        return tokenEnd;
    }
};

const attributes: AttributeSettings = settings.attributes = {
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

const vars: VarSettings = settings.vars = {
    index: '$index',
    key: '$key',
    element: '$element',
    parentElement: '$parentElement',
    attribute: '$attribute',
    scope: '$scope'
};

const events: EventSettings = settings.events = {};
settings.eventsPrefix = 'data-';
const eventsString = 'click dblclick mousedown mouseup mouseover mouseout mousemove mouseenter mouseleave keydown keyup focus blur change select selectstart scroll copy cut paste mousewheel keypress error contextmenu input textinput drag dragenter dragleave dragover dragend dragstart dragover drop load submit reset search resize beforepaste beforecut beforecopy';
const eventsStringTouch = ' touchstart touchend touchmove touchenter touchleave touchcancel gesturestart gesturechange gestureend';
const eventsArray = (eventsString + eventsStringTouch).split(' ');
for (let i = 0, l = eventsArray.length; i < l; i++) {
    events[settings.eventsPrefix + eventsArray[i]] = eventsArray[i];
}

const regex: RegexPatterns = {
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
function isArray(value: any): value is any[] {
    return Array.isArray(value);
}

function isObject(value: any): value is object {
    return typeof value === 'object' && value !== null;
}

function isString(value: any): value is string {
    return typeof value === 'string';
}

function isElement(value: any): value is Element {
    return value ? value.nodeType > 0 : false;
}

function isTextNode(el: any): el is Text {
    return el && el.nodeType && el.nodeType === 3;
}

function isFunction(value: any): value is Function {
    return value && typeof value === 'function';
}

function isDefined(value: any): boolean {
    return value !== null && value !== undefined;
}

function normalizeBoolean(value: any): boolean {
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

function isExpression(value: any): value is Expression {
    return value && isFunction(value.toString) && value.toString() === '[object Expression]';
}

function isExpFunction(value: any): boolean {
    if (!isString(value)) {
        return false;
    }
    return !!value.match(regex.func);
}

function childNodeIsTemplate(node: TemplateNode): boolean {
    return !!(node && node.parent && templates.get(node.element));
}

function escapeRegExp(str: string): string {
    return str.replace(regex.escape, '\\$&');
}

function setRegEX(nonEscapedValue: string, isStartToken: boolean): void {
    const unescapedCurrentStartToken = tokens.start().replace(/\\/g, '');
    let endSequence = '';
    const ts = isStartToken ? nonEscapedValue : unescapedCurrentStartToken;
    if (ts.length > 1) {
        endSequence = '|\\' + ts.substr(0, 1) + '(?!\\' + ts.substr(1, 1) + ')[^' + ts.substr(0, 1) + ']*';
    }
    regex.sequence = new RegExp(tokens.start() + '.+?' + tokens.end() + '|[^' + tokens.start() + ']+' + endSequence, 'g');
    regex.token = new RegExp(tokens.start() + '.*?' + tokens.end(), 'g');
    regex.expression = new RegExp(tokens.start() + '|' + tokens.end(), 'gm');
}

function trim(value: string): string {
    return value.replace(regex.trim, '');
}

function trimQuotes(value: string): string {
    if (regex.string.test(value)) {
        return value.substr(1, value.length - 2);
    }
    return value;
}

function trimArray(value: any[]): any[] {
    if (value[0] === '') {
        value.shift();
    }
    if (value[value.length - 1] === '') {
        value.pop();
    }
    return value;
}

function trimTokens(value: string): string {
    return value.replace(regex.expression!, '');
}

function trimScopeDepth(value: string): string {
    return value.replace(regex.depth, '');
}

function insertBefore(referenceNode: globalThis.Node, newNode: globalThis.Node): void {
    if (!referenceNode.parentNode) {
        return;
    }
    referenceNode.parentNode.insertBefore(newNode, referenceNode);
}

function insertAfter(referenceNode: globalThis.Node, newNode: globalThis.Node): void {
    if (!referenceNode.parentNode) {
        return;
    }
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function removeClass(elm: Element, className: string): void {
    elm.classList.remove(className);
}

// Modern contains function
function contains(a: globalThis.Node, b: globalThis.Node | null): boolean {
    if (!b) return false;
    const adown = a.nodeType === 9 ? (a as Document).documentElement : a;
    const bup = b && b.parentNode;
    return a === bup || !!(bup && bup.nodeType === 1 && (adown as Element).contains && (adown as Element).contains(bup));
}

class HashMap {
    private items: { [key: string]: any } = {};
    private count = 0;
    private id: string;

    constructor(id: string) {
        this.id = id;
    }

    private uuid(): string {
        return String(++this.count) + this.id;
    }

    private getKey(target: any): string | undefined {
        if (!target) {
            return;
        }
        if (typeof target !== 'object') {
            return target;
        }
        let result: string | undefined;
        try {
            result = target[this.id] ? target[this.id] : target[this.id] = this.uuid();
        } catch (err) {
            // Ignore errors (IE 7-8 text nodes)
        }
        return result;
    }

    remove(key: any): void {
        const k = this.getKey(key);
        if (k) {
            delete this.items[k];
        }
    }

    get(key: any): any {
        const k = this.getKey(key);
        return k ? this.items[k] : undefined;
    }

    put(key: any, value: any): void {
        const k = this.getKey(key);
        if (k) {
            this.items[k] = value;
        }
    }

    has(key: any): boolean {
        const k = this.getKey(key);
        return k ? typeof this.items[k] !== 'undefined' : false;
    }

    getData(): { [key: string]: any } {
        return this.items;
    }

    dispose(): void {
        for (const key in this.items) {
            if (this.items.hasOwnProperty(key)) {
                delete this.items[key];
            }
        }
    }
}

function getRepeaterData(repeaterValue: string, scope: ScopeData): any {
    const parts = repeaterValue.match(regex.repeat);
    if (!parts) {
        return;
    }
    const source = parts[2];
    const exp = new Expression(source);
    return exp.getValue(scope);
}

function updateScopeWithRepeaterData(repeaterValue: string, scope: ScopeData, data: any): void {
    const parts = repeaterValue.match(regex.repeat);
    if (!parts) {
        return;
    }
    const name = parts[1];
    scope[name] = data;
}

function getWatcherValue(exp: Expression, newValue: any): any {
    const node = exp.node || exp.attribute?.node;
    if (!node) return newValue;

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

function getScopeFromPattern(scope: ScopeData, pattern: string): ScopeData {
    let depth = getScopeDepth(pattern);
    let scopeTarget = scope;
    while (depth > 0) {
        scopeTarget = scopeTarget._parent ? scopeTarget._parent : scopeTarget;
        depth--;
    }
    return scopeTarget;
}

function getValueFromPattern(scope: ScopeData, pattern: string, context: any): any {
    const exp = new Expression(pattern);
    return getValue(scope, exp.pattern, exp.path, exp.params, undefined, undefined, undefined, context);
}

function getValue(scope: ScopeData, pattern: string, pathString: string | null, params: string[] | null, getFunction?: boolean, getParams?: boolean, paramsFound?: any[], context?: any): any {
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
    const paramsValues: any[] = [];
    if (!paramsFound && params) {
        for (let j = 0, jl = params.length; j < jl; j++) {
            paramsValues.push(getValueFromPattern(scope, params[j], context));
        }
    } else if (paramsFound) {
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
    let path: any = scopeTarget;
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
                } else {
                    return undefined;
                }
            }
        }
    }
    // return value
    if (!isFunction(path)) {
        return path;
    } else {
        if (getFunction) {
            return path;
        } else {
            return path.apply(null, paramsValues);
        }
    }
}

function getExpressionPath(value: string): string {
    const val = value.split('(')[0];
    return trimScopeDepth(val);
}

function getParamsFromString(value: string): string[] {
    return trimArray(value.split(regex.params));
}

function getScopeDepth(value: string): number {
    const val = value.split('(')[0];
    const matches = val.match(regex.depth);
    return !matches ? 0 : matches.length;
}

function addAttribute(node: Node, name: string, value: string): Attribute | undefined {
    let attr: Attribute | undefined;
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
    if (
        hasInterpolation(name + ':' + value) ||
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
        value.indexOf(settings.attributes.cloak) !== -1
    ) {
        attr = new Attribute(name, value, node);
        node.attributes.push(attr);
    }
    if (events[name]) {
        attr = new Attribute(name, value, node);
        node.attributes.push(attr);
    }
    return attr;
}

function getNodeFromElement(element: Element, scope: ScopeData): Node {
    const node = new TemplateNode(element, scope);
    node.previousSibling = element.previousSibling;
    node.nextSibling = element.nextSibling;
    const eventsArray: { name: string; value: string; attr: Attribute }[] = [];
    const attrs = element.attributes;
    for (let j = 0, jj = attrs && attrs.length; j < jj; j++) {
        const attr = attrs[j];
        if (attr.specified || attr.name === 'value') {
            const newAttr = addAttribute(node, attr.name, attr.value);
            if (events[attr.name] && newAttr) {
                if (events[attr.name] && !node.isRepeaterChild) {
                    eventsArray.push({ name: events[attr.name], value: attr.value, attr: newAttr });
                }
            }
        }
    }
    for (let a = 0, b = eventsArray.length; a < b; a++) {
        node.addEvent(eventsArray[a].name, eventsArray[a].value, eventsArray[a].attr);
    }
    return node;
}

function hasInterpolation(value: string): boolean {
    const matches = value.match(regex.token!);
    return matches !== null && matches.length > 0;
}

function hasContent(value: string): boolean {
    return regex.content.test(value);
}

function isElementValid(element: ChildNode): boolean {
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
    if (type === 3 && !hasContent((element as Text).nodeValue || '') && !hasInterpolation((element as Text).nodeValue || '')) {
        return false;
    }
    return true;
}

function compile(template: Template, element: ChildNode, parent?: Node, nodeTarget?: Node): Node | undefined {
    if (!isElementValid(element)) {
        return;
    }
    // get node
    let node: Node;
    if (!nodeTarget) {
        node = getNodeFromElement(element as Element, parent ? parent.scope : new Scope(helpersScopeObject)._createChild!());
    } else {
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
    let child = (element as Element).firstChild;
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

function updateScopeWithData(scope: ScopeData, data: any): void {
    clearScope(scope);
    for (const d in data) {
        if (data.hasOwnProperty(d)) {
            scope[d] = data[d];
        }
    }
}

function clearScope(scope: ScopeData): void {
    for (const key in scope) {
        if (scope.hasOwnProperty(key)) {
            if (key.substr(0, 1) !== '_') {
                scope[key] = null;
                delete scope[key];
            }
        }
    }
}

function updateNodeChildren(node: TemplateNode): void {
    if (node.repeater || !node.children || childNodeIsTemplate(node)) {
        return;
    }
    for (let i = 0, l = node.children.length; i < l; i++) {
        node.children[i].update();
    }
}

function renderNodeChildren(node: TemplateNode): void {
    if (!node.children || childNodeIsTemplate(node)) {
        return;
    }
    for (let i = 0, l = node.children.length; i < l; i++) {
        node.children[i].render();
    }
}

function renderNodeRepeater(node: TemplateNode): void {
    const data = getRepeaterData(node.repeater!, node.scope);
    let previousElement: Element | undefined;
    if (isArray(data)) {
        // process array
        for (let i = 0, l1 = data.length, l2 = node.childrenRepeater.length, l = l1 > l2 ? l1 : l2; i < l; i++) {
            if (i < l1) {
                previousElement = createRepeaterChild(node, i, data[i], vars.index, i, previousElement);
            } else {
                node.parent!.element.removeChild(node.childrenRepeater[i].element);
                node.childrenRepeater[i].dispose();
            }
        }
        if (node.childrenRepeater.length > data.length) {
            node.childrenRepeater.length = data.length;
        }
    } else {
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
            node.parent!.element.removeChild(node.childrenRepeater[count].element);
            node.childrenRepeater[count].dispose();
        }
        node.childrenRepeater.length = size + 1;
    }
    if (node.element.parentNode) {
        node.element.parentNode.removeChild(node.element);
    }
}

function compileClone(node: Node, newNode: Node): Node | undefined {
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
    let child = (node.element as Element).firstChild;
    let newChild = (newNode.element as Element).firstChild;
    let newChildNode: Node | undefined;
    // loop
    while (child && newChild) {
        const childNode = node.getNode(child);
        newChildNode = new TemplateNode(newChild as Element, newNode.scope);
        newNode.children.push(newChildNode);
        newChildNode.parent = newNode;
        newChildNode.template = newNode.template;
        newChildNode.isRepeaterChild = true;
        const compiledNode = compileClone(childNode!, newChildNode);
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

function cloneRepeaterNode(element: Element, node: Node): Node {
    const newNode = new TemplateNode(element, node.scope._createChild!());
    newNode.template = node.template;
    newNode.parent = node;
    newNode.isRepeaterChild = true;
    newNode.isRepeaterDescendant = true;
    compileClone(node, newNode);
    return newNode;
}

function appendRepeaterElement(previousElement: Element | undefined, node: Node, newElement: Element): void {
    if (!previousElement) {
        if (node.element.previousSibling) {
            insertAfter(node.element.previousSibling, newElement);
        } else if (node.element.nextSibling) {
            insertBefore(node.element.nextSibling, newElement);
        } else {
            node.parent!.element.appendChild(newElement);
        }
    } else {
        insertAfter(previousElement, newElement);
    }
}

function createRepeaterChild(node: Node, count: number, data: any, indexVar: string, indexVarValue: any, previousElement?: Element): Element {
    const existingChild = node.childrenRepeater[count];
    if (!existingChild) {
        const newElement = (node.element as Element).cloneNode(true) as Element;
        appendRepeaterElement(previousElement, node, newElement);
        const newNode = cloneRepeaterNode(newElement, node);
        node.childrenRepeater[count] = newNode;
        updateScopeWithRepeaterData(node.repeater!, newNode.scope, data);
        newNode.scope[indexVar] = indexVarValue;
        newNode.update();
        newNode.render();
        return newElement;
    } else {
        // existing node
        updateScopeWithRepeaterData(node.repeater!, existingChild.scope, data);
        existingChild.scope[indexVar] = indexVarValue;
        existingChild.update();
        existingChild.render();
        return existingChild.element as Element;
    }
}

class Scope {
    constructor(data?: any) {
        return this.createObject(data);
    }

    private createObject(data?: any): ScopeData {
        const self = this;
        const obj: ScopeData = data || {};
        obj._parent = null;
        obj._children = [];
        obj._createChild = function(): ScopeData {
            const child: ScopeData = self.createObject();
            child._parent = obj;
            obj._children!.push(child);
            return child;
        };
        return obj;
    }

    _createChild(): ScopeData {
        return this.createObject();
    }
}

class TemplateNode {
    element: Element | Text;
    scope: ScopeData;
    attributes: Attribute[] | null = null;
    value: string | null = null;
    interpolation: Interpolation | null = null;
    invalidate = false;
    skip = false;
    repeater: string | null = null;
    isRepeaterDescendant = false;
    isRepeaterChild = false;
    parent: TemplateNode | null = null;
    children: TemplateNode[] = [];
    childrenRepeater: TemplateNode[] = [];
    previousSibling: ChildNode | null = null;
    nextSibling: ChildNode | null = null;
    template: Template | null = null;
    eventHandlers: { [type: string]: EventHandler } = {};
    html = false;

    constructor(element: Element | Text, scope: ScopeData) {
        this.element = element;
        this.scope = scope;

        if (isTextNode(this.element)) {
            this.value = this.element.nodeValue;
            this.interpolation = new Interpolation(this.value || '', this, undefined);
        }
    }

    toString(): string {
        return '[object Node]';
    }

    dispose(): void {
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
        this.element = null as any;
        this.scope = null as any;
        this.attributes = null;
        this.value = null;
        this.interpolation = null;
        this.repeater = null;
        this.parent = null;
        this.children = null as any;
        this.childrenRepeater = null as any;
        this.previousSibling = null;
        this.nextSibling = null;
        this.template = null;
        this.eventHandlers = null as any;
    }

    getNode(element: ChildNode): TemplateNode | null {
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

    getAttribute(name: string): Attribute | undefined {
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

    update(): void {
        if (childNodeIsTemplate(this)) {
            return;
        }
        if (isDefined(this.interpolation)) {
            this.interpolation!.update();
        }
        if (isDefined(this.attributes)) {
            for (let i = 0, l = this.attributes!.length; i < l; i++) {
                this.attributes![i].update();
            }
        }
        updateNodeChildren(this);
    }

    invalidateData(): void {
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

    addEvent(type: string, pattern: string, attr: Attribute): void {
        if (this.repeater) {
            return;
        }
        if (this.eventHandlers[type]) {
            this.removeEvent(type);
        }
        const scope = this.scope;
        const node = this;
        const handler: EventHandler = function(event: Event) {
            const exp = new Expression(pattern, node, attr);
            const func = exp.getValue(scope, true);
            const params = exp.getValue(scope, false, true);
            params.unshift(event);
            if (func) {
                func.apply(null, params);
            }
        };
        this.eventHandlers[type] = handler;
        addEvent(this.element as Element, type, handler);
    }

    removeEvent(type: string): void {
        removeEvent(this.element as Element, type, this.eventHandlers[type]);
        this.eventHandlers[type] = null as any;
        delete this.eventHandlers[type];
    }

    clearEvents(): void {
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

    render(): void {
        if (childNodeIsTemplate(this)) {
            return;
        }
        if (this.invalidate) {
            this.invalidate = false;
            if (isTextNode(this.element)) {
                if (this.parent && this.parent.html) {
                    this.value = (this.parent.element as Element).innerHTML = this.interpolation!.render();
                } else {
                    this.value = (this.element as Text).nodeValue = this.interpolation!.render();
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
        } else {
            renderNodeChildren(this);
        }
    }
}

class Attribute {
    name: string;
    value: string;
    node: Node;
    interpolationName: Interpolation;
    interpolationValue: Interpolation;
    invalidate = false;
    previousName?: string;

    constructor(name: string, value: string, node: Node) {
        this.name = name;
        this.value = value;
        this.node = node;
        this.interpolationName = new Interpolation(this.name, null, this);
        this.interpolationValue = new Interpolation(this.value, null, this);
    }

    toString(): string {
        return '[object Attribute]';
    }

    dispose(): void {
        if (this.interpolationName) {
            this.interpolationName.dispose();
        }
        if (this.interpolationValue) {
            this.interpolationValue.dispose();
        }
        this.interpolationName = null as any;
        this.interpolationValue = null as any;
        this.node = null as any;
        this.name = null as any;
        this.value = null as any;
        this.previousName = undefined;
    }

    update(): void {
        if (this.node.repeater) {
            return;
        }
        this.interpolationName.update();
        this.interpolationValue.update();
    }

    render(): void {
        if (this.node.repeater) {
            return;
        }

        const element = this.node.element as Element;

        // normal attribute
        function renderAttribute(name: string, value: any, node: Node): void {
            const el = node.element as any;
            if (name === 'value' && el.value !== undefined) {
                el.value = value;
            } else if (name === 'class') {
                el.className = value;
            } else {
                el.setAttribute(name, value);
            }
        }

        // boolean attribute
        function renderBooleanAttribute(name: string, value: any, el: Element): void {
            el.setAttribute(name, value);
        }

        // special attribute
        function renderSpecialAttribute(value: any, attrName: string, el: Element): void {
            if (normalizeBoolean(value)) {
                el.setAttribute(attrName, attrName);
            } else {
                el.removeAttribute(attrName);
            }
        }

        // src attribute
        function renderSrc(value: string, el: Element): void {
            el.setAttribute('src', value);
        }

        // href attribute
        function renderHref(value: string, el: Element): void {
            el.setAttribute('href', value);
        }

        if (this.invalidate) {
            this.invalidate = false;
            this.previousName = this.name;
            this.name = isDefined(this.interpolationName.render()) ? this.interpolationName.render() : this.name;
            this.value = isDefined(this.interpolationValue.render()) ? this.interpolationValue.render() : this.value;
            if (this.name === attributes.src) {
                renderSrc(this.value, element);
            } else if (this.name === attributes.href) {
                renderHref(this.value, element);
            } else {
                element.removeAttribute(this.interpolationName.value);
                if (this.previousName) {
                    if (this.previousName === 'class') {
                        (element as HTMLElement).className = '';
                    } else {
                        element.removeAttribute(this.previousName);
                    }
                }
                renderAttribute(this.name, this.value, this.node);
            }
        }

        // class
        if (this.name === attributes.class) {
            let classConfig: { [key: string]: any };
            try {
                classConfig = JSON.parse(this.value);
            } catch (ex) {
                throw new Error('Error, the value of a data-class attribute must be a valid JSON: ' + this.value);
            }

            for (const configProperty in classConfig) {
                const propValue = classConfig[configProperty];
                const activateClass = propValue ? normalizeBoolean(propValue) : false;

                if (activateClass) {
                    element.classList.add(configProperty);
                } else {
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
            (element as HTMLElement).style.display = bool ? 'none' : '';
        }
        // show
        if (this.name === attributes.show) {
            const bool = normalizeBoolean(this.value);
            renderAttribute(this.name, bool, this.node);
            (element as HTMLElement).style.display = bool ? '' : 'none';
        }
        // checked
        if (this.name === attributes.checked) {
            renderSpecialAttribute(this.value, 'checked', element);
            renderAttribute(this.name, normalizeBoolean(this.value), this.node);
            (element as HTMLInputElement).checked = normalizeBoolean(this.value);
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
    value: string;
    node: TemplateNode | null;
    attribute: Attribute | null | undefined;
    sequence: (string | Expression)[] = [];
    expressions: Expression[] = [];

    constructor(value: string, node: TemplateNode | null, attribute?: Attribute | null) {
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
                } else {
                    this.sequence.push(parts[i]);
                }
            }
            trimArray(this.sequence);
        }
    }

    toString(): string {
        return '[object Interpolation]';
    }

    dispose(): void {
        if (this.expressions) {
            for (let i = 0, l = this.expressions.length; i < l; i++) {
                this.expressions[i].dispose();
            }
        }
        this.value = null as any;
        this.node = null;
        this.attribute = null;
        this.sequence = null as any;
        this.expressions = null as any;
    }

    update(): void {
        for (let i = 0, l = this.expressions.length; i < l; i++) {
            this.expressions[i].update();
        }
    }

    render(): string {
        let rendered = '';
        if (this.sequence) {
            for (let i = 0, l = this.sequence.length; i < l; i++) {
                let val: any = '';
                if (isExpression(this.sequence[i])) {
                    val = (this.sequence[i] as Expression).value;
                } else {
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
    pattern: string;
    isString: boolean;
    node: TemplateNode | null;
    attribute: Attribute | null | undefined;
    value: any;
    isFunction: boolean;
    depth: number | null;
    path: string | null;
    params: string[] | null;

    constructor(pattern: string, node?: TemplateNode | null, attribute?: Attribute | null) {
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
        } else {
            this.isFunction = isExpFunction(this.pattern);
            this.depth = getScopeDepth(this.pattern);
            this.path = getExpressionPath(this.pattern);
            const funcMatch = this.pattern.match(regex.func);
            this.params = !this.isFunction ? null : getParamsFromString(funcMatch![2]);
        }
    }

    toString(): string {
        return '[object Expression]';
    }

    dispose(): void {
        this.pattern = null as any;
        this.node = null;
        this.attribute = null;
        this.path = null;
        this.params = null;
        this.value = null;
    }

    update(): void {
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

    getValue(scope: ScopeData, getFunction?: boolean, getParams?: boolean): any {
        let node = this.node;
        if (!node && this.attribute) {
            node = this.attribute.node;
        }
        const context: any = {};
        if (node) {
            context[vars.element] = node.element;
            if (node.element) {
                context[vars.parentElement] = (node.element as Element).parentNode;
            }
        }
        context[vars.attribute] = this.attribute;
        context[vars.scope] = scope;
        return getValue(scope, this.pattern, this.path, this.params, getFunction, getParams, undefined, context);
    }
}

const templates = new HashMap('st');

class Template {
    watchers: HashMap;
    node: TemplateNode | null = null;
    scope: ScopeData | null = null;
    element!: Element;

    constructor(element: Element) {
        this.watchers = new HashMap('stw');
        this.compile(element);
    }

    toString(): string {
        return '[object Template]';
    }

    compile(element?: Element): void {
        if (element) {
            this.element = element;
        }
        if (this.node) {
            this.node.dispose();
        }
        this.node = compile(this, this.element)!;
        (this.node as any).root = true;
        this.scope = this.node.scope;
    }

    update(data?: any): void {
        if (isDefined(data)) {
            updateScopeWithData(this.node!.scope, data);
        }
        if (this.node) {
            this.node.update();
        }
    }

    render(data?: any): void {
        this.update(data);
        if (this.node) {
            this.node.render();
        }
    }

    invalidate(): void {
        if (this.node) {
            this.node.invalidateData();
        }
    }

    watch(target: string | Element, watcher: Function): void {
        if ((!isString(target) && !isElement(target)) || !isFunction(watcher)) {
            return;
        }
        this.watchers.put(target, watcher);
    }

    unwatch(target: string | Element): void {
        this.watchers.remove(target);
    }

    clearWatchers(): void {
        this.watchers.dispose();
    }

    clearEvents(): void {
        this.node!.clearEvents();
    }

    getNode(element: ChildNode): TemplateNode | null {
        return this.node!.getNode(element);
    }

    dispose(): void {
        templates.remove(this.element);
        if (this.watchers) {
            this.watchers.dispose();
        }
        if (this.node) {
            this.node.dispose();
        }
        this.element = null as any;
        this.watchers = null as any;
        this.node = null;
    }
}

// Event handling functions (modernized)
function addEvent(element: Element, type: string, handler: EventListener): void {
    element.addEventListener(type, handler, false);
}

let addEventGuid = 1;
(addEvent as any).guid = addEventGuid;

function removeEvent(element: Element, type: string, handler: EventListener): void {
    element.removeEventListener(type, handler, false);
}

let maxDepth: number;
const eventStore: { element: Element; type: string; handler: EventListener }[] = [];

function parseEvents(element: Element, object: any, depth?: number): void {
    maxDepth = depth === undefined ? Number.MAX_VALUE : depth;
    parseNode(element, object, 0, true);
}

function parseNode(element: Element, object: any, depth: number, isRoot: boolean): void {
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
                parseNode(child as Element, object, depth + 1, false);
                parseAttributes(child as Element, object);
            }
        }
        child = child.nextSibling;
    }
}

function parseAttributes(element: Element, object: any): void {
    const attrs = element.attributes;
    for (let j = 0, jj = attrs && attrs.length; j < jj; j++) {
        const attr = attrs[j];
        if (attr.specified) {
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
}

function getHandlerFromPattern(object: any, pattern: string): EventListener | undefined {
    const parts = pattern.match(regex.func);
    if (parts) {
        const func = parts[1];
        if (isFunction(object[func])) {
            return object[func];
        }
    }
    return undefined;
}

function clearEvents(element: Element): void {
    for (let i = eventStore.length - 1; i >= 0; i--) {
        const item = eventStore[i];
        if (element === item.element || contains(element, item.element)) {
            removeEvent(item.element, item.type, item.handler);
            eventStore.splice(i, 1);
        }
    }
}

// DOMContentLoaded modernized
const ready = (function() {
    const callbacks: (() => void)[] = [];
    let isReady = false;

    function executeCallbacks(): void {
        isReady = true;
        while (callbacks.length) {
            const callback = callbacks.shift();
            if (callback) callback();
        }
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(executeCallbacks, 1);
        } else {
            document.addEventListener('DOMContentLoaded', executeCallbacks, false);
        }
    }

    return function(callback: () => void): void {
        if (isReady) {
            callback();
        } else {
            callbacks.push(callback);
        }
    };
})();

if (typeof document !== 'undefined' && settings.autocreate) {
    const parse = function(element?: Element): void {
        let child = !element ? document.body.firstChild : element.firstChild;
        while (child) {
            if (child.nodeType === 1) {
                parse(child as Element);
                const attrValue = (child as Element).getAttribute(attributes.template);
                if (attrValue) {
                    try {
                        const getFunction = new Function('return ' + attrValue + ';');
                        const f = getFunction();
                        if (isFunction(f)) {
                            soma.template.bootstrap(attrValue, child as Element, f);
                        }
                    } catch (e) {
                        console.error('Error auto-creating template:', e);
                    }
                }
            }
            child = child.nextSibling;
        }
    };
    ready(parse);
}

function bootstrapTemplate(attrValue: string, element: Element, func: Function): void {
    const tpl = createTemplate(element);
    func(tpl, tpl.scope, tpl.element, tpl.node);
}

function createTemplate(source: string | Element, target?: Element): Template {
    let element: Element;
    if (isString(source)) {
        // string template
        if (!isElement(target)) {
            throw new Error(soma.template.errors.TEMPLATE_STRING_NO_ELEMENT);
        }
        target!.innerHTML = source;
        element = target!;
    } else if (isElement(source)) {
        if (isElement(target)) {
            // element template with target
            target!.innerHTML = (source as Element).innerHTML;
            element = target!;
        } else {
            // element template
            element = source as Element;
        }
    } else {
        throw new Error(soma.template.errors.TEMPLATE_NO_PARAM);
    }
    // existing template
    if (getTemplate(element)) {
        getTemplate(element)!.dispose();
        templates.remove(element);
    }
    // create template
    const template = new Template(element);
    templates.put(element, template);
    return template;
}

function getTemplate(element: Element): Template | undefined {
    return templates.get(element);
}

function renderAllTemplates(): void {
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

function appendHelpers(obj: any): any {
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

const TemplatePlugin = function(instance: any, injector: any): void {
    instance.constructor.prototype.createTemplate = function(cl: Function, domElement?: Element): any {
        if (!cl || typeof cl !== 'function') {
            throw new Error('Error creating a template, the first parameter must be a function.');
        }
        if (domElement && isElement(domElement)) {
            const template = soma.template.create(domElement);
            for (const key in template) {
                if (typeof (template as any)[key] === 'function') {
                    (cl.prototype as any)[key] = (template as any)[key].bind(template);
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
    soma.template.bootstrap = function(attrValue: string, element: Element, func: Function): void {
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

export default soma;
