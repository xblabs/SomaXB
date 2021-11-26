import {Signal, SignalBinding} from "signals"
import {SignalPool,SignalEvent} from "./types"


export default class Emitter
{

    //private static _instance: Emitter;

    private signals: SignalPool;


    // static getInstance(): Emitter
    // {
    //     if( !Emitter._instance ) {
    //         Emitter._instance = new Emitter();
    //     }
    //     return Emitter._instance;
    // }


    constructor()
    {
        this.signals = {};
    }


    addListener( id:string, handler:any, scope?:any, priority?:number ): SignalBinding
    {
        if( !this.signals[id] ) {
            this.signals[id] = new Signal();
        }
        return this.signals[id].add( handler, scope, priority );
    }

    addListenerOnce( id:string, handler:any, scope?:any, priority?:number ):SignalBinding
    {
        if( !this.signals[id] ) {
            this.signals[id] = new Signal();
        }
        return this.signals[id].addOnce( handler, scope, priority );
    }

    removeListener( id:string, handler:any, scope?:any ): void
    {
        const signal = this.signals[id];
        if( signal ) {
            signal.remove( handler, scope );
        }
    }

    getSignal( id:string ): Signal
    {
        return this.signals[id];
    }


    haltSignal( id:string ): void
    {
         if( this.signals[id] ) {
            this.signals[id].halt();
        }
    }



    dispatch( id:string, data?: SignalEvent, useIdInParams:boolean = true  ): void
    {
        const signal = this.signals[id];
        if( signal ) {
            if( data ) {
                if( useIdInParams && Object.prototype.toString.call(data) === '[object Object]' && !data.hasOwnProperty('signalType')  ) {
                    data.signalType = id
                }
                signal.dispatch.apply( signal, [ data ] );
            } else {
                signal.dispatch();
            }
        }
    }


    dispose()
    {
        let sigs = this.signals;
        for( const id in sigs ) {
            if( !sigs.hasOwnProperty( id ) ) {
                continue;
            }
            sigs[id].removeAll();
            //sigs[id] = undefined;
            delete sigs[id];
        }
        this.signals = {};
    }

}

