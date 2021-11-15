
// @ts-ignore
function interceptorHandler( injector, id, CommandClass, signal, binding )
{
	const args = Array.prototype.slice.call( arguments, 5 );
	const childInjector = injector.createChild();
	childInjector.mapValue( 'id', id );
	childInjector.mapValue( 'signal', signal );
	childInjector.mapValue( 'binding', binding );
	const command = childInjector.createInstance( CommandClass );
	if( typeof command.execute === 'function' ) {
		command.execute.apply( command, args );
	}
	childInjector.dispose();
}

// @ts-ignore
function addInterceptor( scope, id, CommandClass )
{
	const binding = scope.emitter.addListener( id, interceptorHandler, scope );
	binding.params = [scope.injector, id, CommandClass, scope.emitter.getSignal( id ), binding];
	return binding;
}

// @ts-ignore
function removeInterceptor( scope, id )
{
	const signal = scope.emitter.getSignal( id );
	if( signal ) {
		signal.removeAll();
	}
}

// @ts-ignore
function commandOptions( binding )
{
	return {
		setInjector: function( injector ) {
			if( binding && injector ) {
				binding.params[0] = injector;
			}
			return commandOptions( binding );
		}
	};
}

class Commands {

	list
	emitter
	injector

	constructor( emitter, injector )
	{
		this.list = {};
		this.emitter = emitter;
		this.injector = injector;
	}

	add( id, CommandClass )
	{
		if( this.list[id] ) {
			throw new Error( '[Commands] Error: a command with the id: "' + id + '" has already been registered' );
		}
		this.list[id] = CommandClass;
		const binding = addInterceptor( this, id, CommandClass );
		return commandOptions( binding );
	}

	get( id )
	{
		return this.list[id];
	}


	remove( id )
	{
		if( this.list[id] ) {
			this.list[id] = undefined;
			delete this.list[id];
			removeInterceptor( this, id );
		}
	}

	dispose()
	{
		for( const id in this.list ) {
			this.remove( id );
		}
		this.list = {};
		this.emitter = null;
		this.injector = undefined;
	}
}


// Commands.extend = function(obj) {
//     return utils.inherit(Commands, obj);
// };

export default Commands;
