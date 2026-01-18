import Emitter from "./Emitter";
import Injector from "./Injector";


interface JQueryLike<T extends Element = HTMLElement> extends ArrayLike<T> {
    length: number;
    get(): T[];
}

const isJQueryLike = (value: unknown): value is JQueryLike<Element> => {
    return !!value
        && typeof (value as any).get === 'function'
        && typeof (value as any).length === 'number';
};

type MediatorClassType<T> = new (...args: any[]) => T;


type TargetInput =
    | Element
    | Element[]
    | NodeListOf<Element>
    | JQueryLike<Element>
    | null
    | undefined;

class Mediators
{
    emitter?: Emitter = undefined
    injector?: Injector = undefined

    static inject = ["emitter", "injector"]

    constructor()
    {

    }


    // setInjector( injector: Injector ): void
    // {
    //     this.injector = injector
    // }
    //
    // setEmitter( emitter: Emitter ): void
    // {
    //     this.emitter = emitter
    // }


    /**
     *
     * @param MediatorClass
     * @param target
     * @param aggregateTarget - if set to true, and target is a list, either of Elements or a NodeList of elements, then only ONE mediator will be created with "target" being the aggregate list of elements / nodes
     *  default set to true in order to avoid unwanted object pollution / amount of concurrent mediator instances where one is in most cases sufficient
     */
    create<T>( MediatorClass: MediatorClassType<T>, target:TargetInput, aggregateTarget:boolean = true  ):T|Array<T> {

        if( !this.injector ) {
            throw new Error( 'injector not present or has been disposed' )
        }
        // Normalise jQuery-like input to an array of Elements
        if (isJQueryLike(target)) {
            if (!target.length) {
                return [];
            }
            target = target.get();
        }
        let targetList:(Element|Element[]|NodeListOf<Element>)[] = []
        const mediatorList = [];
        if( Array.isArray( target ) && target.length > 0 ) {
            if( aggregateTarget ) {
                targetList = [target]
            } else {
                targetList = [...target]
            }
        } else if( target instanceof HTMLElement) {
            targetList = [target]
        }else if( target instanceof NodeList ) {
            if( aggregateTarget ) {
                targetList = [target]
            } else {
                target.forEach(node => {
                    targetList.push(node)
                })
            }
        }
        for( let i = 0, l = targetList.length; i < l; i++ ) {
            const childInjector = this.injector.createChild();
            childInjector.mapValue( 'injector', childInjector );
            childInjector.mapValue( 'target', targetList[i] );
            const mediator = childInjector.createInstance( MediatorClass );

            //call init() method if present -- NOTE already covered in infuse.injector postConstruct()
            // if( typeof MediatorClass.prototype.postConstruct === 'function' ) {
            //     mediator.postConstruct.call( mediator )
            // }

            if( targetList.length === 1 ) {
                return mediator;
            }
            mediatorList.push( mediator );
        }
        return mediatorList;
    }

    dispose() {
        delete this.emitter
        delete this.injector
    }
}




export default Mediators;
