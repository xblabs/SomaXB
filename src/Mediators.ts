import {Injector} from "./infuse";
import Emitter from "./Emitter";

interface MediatorClass<T = any> {
    new(...args: any[]): T;
}

class Mediators {
    emitter: Emitter;
    injector: Injector;

    constructor(emitter?: Emitter, injector?: Injector) {
        this.emitter = emitter!;
        this.injector = injector!;
    }

    create<T>(target: any | any[], MediatorClass: MediatorClass<T>): T | T[] {
        if (!target) {
            throw new Error('Error creating a mediator, the first parameter cannot be undefined or null.');
        }
        if (!MediatorClass) {
            throw new Error('[Mediators] Error creating a mediator, the second parameter must be a function.');
        }

        let targetlist: any[] = [];
        const mediatorList: T[] = [];

        if (Array.isArray(target) && target.length > 0) {
            targetlist = [].concat(target);
        } else {
            targetlist.push(target);
        }

        for (let i = 0, l = targetlist.length; i < l; i++) {
            const injector = this.injector.createChild();
            injector.mapValue('target', targetlist[i]);
            const mediator = injector.createInstance(MediatorClass) as T;
            if (targetlist.length === 1) {
                return mediator;
            }
            mediatorList.push(mediator);
        }
        return mediatorList;
    }

    dispose(): void {
        (this.emitter as any) = undefined;
        (this.injector as any) = undefined;
    }
}

export default Mediators;
