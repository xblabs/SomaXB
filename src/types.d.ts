import {Signal} from "signals";

declare type SignalEvent = {
    [name: string]: any
}

declare type SignalPool = { [name:string] : Signal };


declare interface MappingVO
{
  prop:string;
  value:any;
  cl:Function;
  singleton:any;
}


declare namespace infuse
{
    export class  Injector
    {
      createChild():Injector
      getMappingVo( prop:string ):MappingVO
      mapValue( prop:string, val:any ):Injector
      mapClass( prop:string, clazz:Function, singleton?:boolean ):Injector
      removeMapping( prop:string ):Injector
      hasMapping( prop:string ):boolean
      hasInheritedMapping( prop:string ):boolean
      getMapping( value:any ):string
      getValue( prop:string ):any
      getClass( prop:string ):Function
      instantiate( TargetClass:Function ):any
      inject( target:any, isParent:boolean ):Injector
      getInjectedValue( vo:MappingVO, name:string ):any
      createInstance( ...rest:any[] ):any
      getValueFromClass( clazz:Function ):any
      dispose():void
}
}


