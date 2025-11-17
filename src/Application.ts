import {Injector} from "./infuse";
import Emitter from './Emitter';
import Commands from './Commands';
import Mediators from './Mediators';
import Modules from './Modules';

class Application
{
	#injector!: Injector;
	#emitter!: Emitter;
	#commands!: Commands;
	#mediators!: Mediators;
	#modules!: Modules;

	get emitter(): Emitter
	{
		return this.#emitter;
	}

	get injector(): Injector
	{
		return this.#injector;
	}

	set commands(value: Commands) {
		this.#commands = value;
	}

	get commands(): Commands
	{
		return this.#commands;
	}

	get mediators(): Mediators
	{
		return this.#mediators;
	}

	get modules(): Modules
	{
		return this.#modules;
	}


	constructor()
	{
		this.setup();
		this.init();
	}

	setup()
	{
		// create injector
		this.#injector = new Injector();

		this.#injector.throwOnMissing = false;
		this.#injector.mapValue( 'injector', this.#injector );
		// instance
		this.#injector.mapValue( 'instance', this );
		// emitter
		this.#injector.mapClass( 'emitter', Emitter, true );

		this.#emitter = this.#injector.getValue( 'emitter' ) as Emitter;

		// commands
		this.#injector.mapClass( 'commands', Commands, true );
		this.#commands = this.#injector.getValue( 'commands' );
		// mediators
		this.#injector.mapClass( 'mediators', Mediators, true );
		this.#mediators = this.#injector.getValue( 'mediators' );
		// modules
		this.#injector.mapClass( 'modules', Modules, true );
		this.#modules = this.#injector.getValue( 'modules' );


	}

	init()
	{
	}


	dispose()
	{
		if (this.#injector) {
			this.#injector.dispose();
		}
		if (this.#emitter) {
			this.#emitter.dispose();
		}
		if (this.#commands) {
			this.#commands.dispose();
		}
		if (this.#mediators) {
			this.#mediators.dispose();
		}
		if (this.#modules) {
			this.#modules.dispose();
		}
		(this.#injector as any) = undefined;
		(this.#emitter as any) = undefined;
		(this.#commands as any) = undefined;
		(this.#mediators as any) = undefined;
		(this.#modules as any) = undefined;
	}
}


export default Application;
