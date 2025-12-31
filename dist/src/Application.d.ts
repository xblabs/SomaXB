import Injector from "./Injector";
import Emitter from './Emitter';
import Commands from './Commands';
import Mediators from './Mediators';
import Modules from './Modules';
declare class Application {
    protected _injector?: Injector;
    protected _emitter?: Emitter;
    protected _commands?: Commands;
    protected _mediators?: Mediators;
    protected _modules?: Modules;
    get emitter(): Emitter;
    get injector(): Injector;
    set commands(value: Commands);
    get commands(): Commands;
    get mediators(): Mediators;
    get modules(): Modules;
    constructor();
    protected setupEmitter(): void;
    protected setup(): void;
    protected init(): void;
    protected initDone(): void;
    dispose(): void;
}
export default Application;
//# sourceMappingURL=Application.d.ts.map