import { Signal, SignalBinding } from 'signals';
interface Injector {
    createChild(): Injector;
    mapValue(prop: string, val: any): Injector;
    createInstance(CommandClass: any, ...args: any[]): any;
    dispose(): void;
}
interface Emitter {
    addListener(id: string, handler: Function, scope: any): SignalBinding;
    getSignal(id: string): Signal | undefined;
}
interface CommandClass {
    new (...args: any[]): Command;
}
interface Command {
    execute?(...args: any[]): void;
}
interface CommandOptions {
    setInjector(injector: Injector): CommandOptions;
}
declare class Commands {
    list: {
        [id: string]: CommandClass;
    };
    emitter: Emitter;
    injector: Injector;
    static inject: string[];
    constructor(emitter: Emitter, injector: Injector);
    add(id: string, CommandClass: CommandClass): CommandOptions;
    get(id: string): CommandClass | undefined;
    remove(id: string): void;
    dispose(): void;
}
export default Commands;
//# sourceMappingURL=Commands.d.ts.map