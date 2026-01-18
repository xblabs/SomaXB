# SomaXB

A modern TypeScript framework for building scalable, loosely-coupled applications with dependency injection, event-driven architecture, and the command pattern.

## Features

- **Dependency Injection** - Constructor and property injection with singleton support
- **Event System** - Signal-based event dispatching with type safety
- **Command Pattern** - Event-triggered command execution with automatic DI
- **Mediators** - DOM element lifecycle management
- **Modules** - Lazy-loaded application modules with lifecycle hooks
- **Templates** - Simple DOM templating engine

## Quick Start

### Basic Application

```typescript
import { Application } from 'soma-xb';

class MyApp extends Application {
  protected init() {
    // Map services
    this.injector.mapClass('userService', UserService, true); // singleton
    this.injector.mapValue('apiUrl', 'https://api.example.com');

    // Register commands
    this.commands.add('user/login', LoginCommand);
    this.commands.add('user/logout', LogoutCommand);
  }
}

const app = new MyApp();

// Dispatch events to trigger commands
app.emitter.dispatch('user/login', { username: 'john', password: 'secret' });
```

### Dependency Injection

```typescript
// Constructor injection using static inject property
class UserService {
  static inject = ['apiUrl', 'httpClient'];

  constructor(private apiUrl: string, private http: HttpClient) {}

  getUser(id: string) {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }
}

// Property injection
class ProfileController {
  userService?: UserService;  // Injected automatically if mapped

  loadProfile(userId: string) {
    return this.userService?.getUser(userId);
  }
}

// Register and retrieve
injector.mapClass('userService', UserService, true);
injector.mapClass('profileController', ProfileController);

const controller = injector.getValue('profileController');
```

### Commands

Commands are instantiated and executed when their corresponding event is dispatched:

```typescript
class LoginCommand {
  static inject = ['userService'];

  // Automatically injected
  userService?: UserService;
  id?: string;      // Event ID
  signal?: Signal;  // The signal that triggered this command

  execute(credentials: { username: string; password: string }) {
    this.userService?.login(credentials.username, credentials.password);
  }
}

// Register command
app.commands.add('user/login', LoginCommand);

// Trigger via event
app.emitter.dispatch('user/login', { username: 'john', password: 'secret' });
```

### Mediators

Mediators manage DOM elements with automatic lifecycle:

```typescript
class ButtonMediator {
  static inject = ['target', 'emitter'];

  constructor(private target: HTMLElement, private emitter: Emitter) {
    this.target.addEventListener('click', this.handleClick);
  }

  handleClick = () => {
    this.emitter.dispatch('button/clicked', { id: this.target.id });
  };

  dispose() {
    this.target.removeEventListener('click', this.handleClick);
  }
}

// Create mediator for element(s)
const button = document.querySelector('#myButton');
app.mediators.create(ButtonMediator, button);

// Or for multiple elements (aggregateTarget=false creates one mediator per element)
const buttons = document.querySelectorAll('.action-btn');
app.mediators.create(ButtonMediator, buttons, false);
```

### Modules

Modules are lazy-loaded application components:

```typescript
function AuthModule(emitter: Emitter, injector: Injector) {
  return {
    init() {
      injector.mapClass('authService', AuthService, true);
      console.log('Auth module initialized');
    },

    dispose() {
      console.log('Auth module disposed');
    }
  };
}
AuthModule.id = 'auth';

// Load module
const authModule = app.modules.create(AuthModule);

// Check if loaded
if (app.modules.has('auth')) {
  const module = app.modules.get('auth');
}

// Unload
app.modules.remove('auth');
```

### Event System

#### Basic Signal Usage

```typescript
import { Signal } from 'soma-xb';

// Create a typed signal
const onUserLogin = new Signal<{ userId: string; timestamp: Date }>();

// Add a listener
onUserLogin.add((data) => {
    console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

// Dispatch
onUserLogin.dispatch({ userId: 'abc123', timestamp: new Date() });
```

#### Emitter (String-keyed Events)

```typescript
import { Emitter } from 'soma-xb';

// Untyped (flexible)
const emitter = new Emitter();

emitter.addListener('user:login', (data) => {
    console.log('Login:', data.username);
});

emitter.dispatch('user:login', { username: 'john' });
```

#### Type-Safe Emitter with Event Map

```typescript
import { Emitter } from 'soma-xb';

// Define your event types
interface AppEvents {
    'todo:add': { item: { id: string; text: string } };
    'todo:remove': { id: string };
    'app:ready': void;
}

const emitter = new Emitter<AppEvents>();

// Fully typed - autocomplete works, wrong payloads error
emitter.addListener('todo:add', (data) => {
    console.log(data.item.text);  // data is typed as { item: { id, text } }
});

emitter.dispatch('todo:add', { item: { id: '1', text: 'Buy milk' } });
```

#### Priority & One-Time Listeners

```typescript
const emitter = new Emitter();

// Higher priority executes first
emitter.addListener('event', () => console.log('Second'), undefined, 0);
emitter.addListener('event', () => console.log('First'), undefined, 10);

// One-time listener (auto-removes after first dispatch)
emitter.addListenerOnce('init', () => console.log('Runs once'));

emitter.dispatch('event');  // "First", "Second"
emitter.dispatch('init');   // "Runs once"
emitter.dispatch('init');   // (nothing - listener removed)
```

#### Binding Control

```typescript
const emitter = new Emitter();

const binding = emitter.addListener('event', (data) => {
    console.log(data);
});

// Temporarily disable
binding.active = false;
emitter.dispatch('event', { msg: 'ignored' });  // won't fire

// Re-enable
binding.active = true;
emitter.dispatch('event', { msg: 'works' });    // fires

// Remove permanently
binding.detach();
```

#### Halt Propagation

```typescript
const emitter = new Emitter();

emitter.addListener('event', () => {
    console.log('First handler');
    emitter.haltSignal('event');  // Stop propagation
}, undefined, 10);

emitter.addListener('event', () => {
    console.log('Never reached');
}, undefined, 0);

emitter.dispatch('event');  // Only "First handler"
```

#### Context/Scope Binding

```typescript
class MyService {
    name = 'MyService';

    handleEvent(data: any) {
        console.log(`${this.name} received:`, data);
    }
}

const service = new MyService();
const emitter = new Emitter();

// Pass scope as third parameter
emitter.addListener('event', service.handleEvent, service);

emitter.dispatch('event', { value: 42 });
// "MyService received: { value: 42 }"
```

#### Direct Signal Access

```typescript
const emitter = new Emitter();

emitter.addListener('my-event', () => {});

const signal = emitter.getSignal('my-event');
console.log(signal?.getNumListeners());  // 1
signal?.removeAll();  // Clear all listeners
```

## API Reference

### Application

The main application class that bootstraps all subsystems.

| Property | Type | Description |
|----------|------|-------------|
| `injector` | `Injector` | Dependency injection container |
| `emitter` | `Emitter` | Event dispatcher |
| `commands` | `Commands` | Command registry |
| `mediators` | `Mediators` | Mediator factory |
| `modules` | `Modules` | Module registry |

### Injector

| Method | Description |
|--------|-------------|
| `mapValue(name, value)` | Map a value/instance |
| `mapClass(name, Class, singleton?)` | Map a class (optionally as singleton) |
| `getValue(name)` | Get a mapped value/instance |
| `hasMapping(name)` | Check if mapping exists |
| `createInstance(Class, ...args)` | Create instance with injection |
| `createChild()` | Create child injector |

### Signal

| Method | Description |
|--------|-------------|
| `add(handler, context?, priority?)` | Add listener |
| `addOnce(handler, context?, priority?)` | Add one-time listener |
| `remove(handler, context?)` | Remove specific listener |
| `removeAll()` | Remove all listeners |
| `dispatch(data)` | Dispatch to all listeners |
| `halt()` | Stop propagation during dispatch |
| `has(handler, context?)` | Check if listener exists |
| `getNumListeners()` | Get listener count |

### Emitter

| Method | Description |
|--------|-------------|
| `addListener(id, handler, scope?, priority?)` | Add event listener |
| `addListenerOnce(id, handler, scope?, priority?)` | Add one-time listener |
| `removeListener(id, handler, scope?)` | Remove listener |
| `dispatch(id, data?)` | Dispatch event |
| `getSignal(id)` | Get underlying Signal |
| `haltSignal(id)` | Stop signal propagation |
| `hasListeners(id)` | Check if event has listeners |

### Binding

| Property/Method | Description |
|-----------------|-------------|
| `active` | Enable/disable the binding |
| `once` | Whether binding fires only once |
| `priority` | Listener priority |
| `detach()` | Remove from signal |
| `execute(data?)` | Manually execute handler |

### Commands

| Method | Description |
|--------|-------------|
| `add(id, CommandClass)` | Register command for event |
| `get(id)` | Get registered command class |
| `remove(id)` | Unregister command |

### Mediators

| Method | Description |
|--------|-------------|
| `create(MediatorClass, target, aggregateTarget?)` | Create mediator(s) for DOM element(s) |

### Modules

| Method | Description |
|--------|-------------|
| `create(module, args?, register?, useChildInjector?)` | Create/load module |
| `has(id)` | Check if module is loaded |
| `get(id)` | Get module instance |
| `remove(id)` | Unload and dispose module |

## History & Attribution

SomaXB is a complete TypeScript rewrite with a long lineage:

1. **2010** - Soma AS3 framework created by [Romuald Quantin](https://github.com/soundstep/soma/commits?author=soundstep) for ActionScript 3
2. **2011** - First JavaScript prototype ported by XB Labs using MooTools for class-based OOP
3. **2011+** - [SomaJS](https://github.com/somajs/somajs) developed by Romuald Quantin, adding mediators, modules, infuse (DI), and templates
4. **2024** - Complete TypeScript rewrite by XB Labs

**This TypeScript version includes:**
- Complete migration to TypeScript with strict typing
- Modern browser support (removed IE7/8 legacy code)
- Comprehensive test suite (261 tests)
- ES module support
- Improved dependency injection with circular reference support

## License

MIT License

See [LICENSE](./LICENSE) for full terms.

**Original SomaJS:** Copyright (c) Romuald Quantin (soundstep.com)
**TypeScript rewrite:** Copyright (c) 2024 XB Labs
