//import {Injector} from "./infuse";
import Injector from "./Injector"
import Emitter from './Emitter';
import Commands from './Commands';
import Mediators from './Mediators';
import Modules from './Modules';
//import utils from './utils';


class Application
{
	protected _injector?:Injector

	protected _emitter?:Emitter

	protected _commands?:Commands

	protected _mediators?:Mediators

	protected _modules?:Modules

	get emitter(): Emitter
	{
		return this._emitter || new Emitter()
	}

	get injector(): Injector
	{
		return this._injector || new Injector()
	}

	set commands(value:Commands) {
		this._commands = value;
	}
	get commands(): Commands
	{
		return this._commands || new Commands()
	}

	get mediators(): Mediators
	{
		return this._mediators || new Mediators()
	}

	get modules(): Modules
	{
		return this._modules || new Modules()
	}


	constructor()
	{
		this.setup()
		this.init()
		this.initDone()
	}

	protected setupEmitter()
	{
		if( this._injector ) {
			this._injector.mapClass( 'emitter', Emitter, true )
			this._emitter = this._injector.getValue( 'emitter' ) as Emitter
		}
	}


	protected setup()
	{
		// create injector
		this._injector = new Injector();

		this._injector.throwOnMissing = false;
		this._injector.mapValue( 'injector', this._injector );
		// instance
		this._injector.mapValue( 'instance', this );

		this.setupEmitter()

		// commands
		this._injector.mapClass( 'commands', Commands, true );
		this._commands = this._injector.getValue( 'commands' );
		// mediators
		this._injector.mapClass( 'mediators', Mediators, true );
		this._mediators = this._injector.getValue( 'mediators' );
		// modules
		this._injector.mapClass( 'modules', Modules, true );
		this._modules = this._injector.getValue( 'modules' );

	}

	protected init()
	{

	}

	protected initDone() {

	}


	dispose()
	{
		if( this._injector ) {
			this._injector.dispose();
		}
		if( this.emitter ) {
			this.emitter.dispose();
		}
		if( this._commands ) {
			this._commands.dispose();
		}
		if( this._mediators ) {
			this._mediators.dispose();
		}
		if( this._modules ) {
			this._modules.dispose();
		}
		this._injector = undefined;
		this._emitter = undefined
		this._commands = undefined
		this._mediators = undefined
		this._modules = undefined

	}


}


export default Application;
