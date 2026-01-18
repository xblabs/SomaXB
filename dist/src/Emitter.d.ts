import { Signal, SignalBinding } from "signals";
import { SignalEvent } from "./types";
export default class Emitter__ {
    private signals;
    constructor();
    addListener(id: string, handler: any, scope?: any, priority?: number): SignalBinding;
    addListenerOnce(id: string, handler: any, scope?: any, priority?: number): SignalBinding;
    removeListener(id: string, handler: any, scope?: any): void;
    getSignal(id: string): Signal;
    haltSignal(id: string): void;
    dispatch(id: string, data?: SignalEvent, useIdInParams?: boolean): void;
    dispose(): void;
}
//# sourceMappingURL=Emitter.d.ts.map