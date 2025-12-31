import Emitter from "./Emitter";
import Injector from "./Injector";
interface JQueryLike<T extends Element = HTMLElement> extends ArrayLike<T> {
    length: number;
    get(): T[];
}
type MediatorClassType<T> = new (...args: any[]) => T;
type TargetInput = Element | Element[] | NodeListOf<Element> | JQueryLike<Element> | null | undefined;
declare class Mediators {
    emitter?: Emitter;
    injector?: Injector;
    static inject: string[];
    constructor();
    /**
     *
     * @param MediatorClass
     * @param target
     * @param aggregateTarget - if set to true, and target is a list, either of Elements or a NodeList of elements, then only ONE mediator will be created with "target" being the aggregate list of elements / nodes
     *  default set to true in order to avoid unwanted object pollution / amount of concurrent mediator instances where one is in most cases sufficient
     */
    create<T>(MediatorClass: MediatorClassType<T>, target: TargetInput, aggregateTarget?: boolean): T | Array<T>;
    dispose(): void;
}
export default Mediators;
//# sourceMappingURL=Mediators.d.ts.map