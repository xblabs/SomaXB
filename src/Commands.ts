import {Signal, SignalBinding} from "signals";
import {Injector} from "./infuse";
import Emitter from "./Emitter";

interface CommandClass {
    new(...args: any[]): Command;
}

interface Command {
    execute?(...args: any[]): void;
}

interface CommandOptions {
    setInjector(injector: Injector): CommandOptions;
}

function interceptorHandler(
    injector: Injector,
    id: string,
    CommandClass: CommandClass,
    signal: Signal,
    binding: SignalBinding,
    ...args: any[]
): void {
    const childInjector = injector.createChild();
    childInjector.mapValue('id', id);
    childInjector.mapValue('signal', signal);
    childInjector.mapValue('binding', binding);
    const command = childInjector.createInstance(CommandClass);
    if (typeof command.execute === 'function') {
        command.execute.apply(command, args);
    }
    childInjector.dispose();
}

function addInterceptor(
    scope: Commands,
    id: string,
    CommandClass: CommandClass
): SignalBinding {
    const binding = scope.emitter.addListener(id, interceptorHandler, scope);
    binding.params = [scope.injector, id, CommandClass, scope.emitter.getSignal(id), binding];
    return binding;
}

function removeInterceptor(scope: Commands, id: string): void {
    const signal = scope.emitter.getSignal(id);
    if (signal) {
        signal.removeAll();
    }
}

function commandOptions(binding: SignalBinding): CommandOptions {
    return {
        setInjector: function(injector: Injector): CommandOptions {
            if (binding && injector) {
                binding.params[0] = injector;
            }
            return commandOptions(binding);
        }
    };
}

class Commands {
    list: { [id: string]: CommandClass };
    emitter: Emitter;
    injector: Injector;

    constructor(emitter?: Emitter, injector?: Injector) {
        this.list = {};
        this.emitter = emitter!;
        this.injector = injector!;
    }

    add(id: string, CommandClass: CommandClass): CommandOptions {
        if (this.list[id]) {
            throw new Error('[Commands] Error: a command with the id: "' + id + '" has already been registered');
        }
        this.list[id] = CommandClass;
        const binding = addInterceptor(this, id, CommandClass);
        return commandOptions(binding);
    }

    get(id: string): CommandClass | undefined {
        return this.list[id];
    }

    remove(id: string): void {
        if (this.list[id]) {
            delete this.list[id];
            removeInterceptor(this, id);
        }
    }

    dispose(): void {
        for (const id in this.list) {
            this.remove(id);
        }
        this.list = {};
    }
}

export default Commands;
