# SomaXB

A modern TypeScript framework for building scalable, loosely-coupled applications with dependency injection, event-driven architecture, and the command pattern.

## Features

- **Dependency Injection** - Constructor and property injection with singleton support
- **Event System** - Signal-based event dispatching with type safety
- **Command Pattern** - Event-triggered command execution with automatic DI
- **Mediators** - DOM element lifecycle management
- **Modules** - Lazy-loaded application modules with lifecycle hooks
- **Templates** - Simple DOM templating engine

## Installation

```bash
npm install soma-xb
```

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

```typescript
// Add listener
const binding = app.emitter.addListener('data/loaded', (data) => {
  console.log('Data received:', data);
});

// Dispatch event
app.emitter.dispatch('data/loaded', { items: [1, 2, 3] });

// Remove listener
binding.detach();

// Or remove all listeners for an event
app.emitter.removeListener('data/loaded');
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

### Emitter

| Method | Description |
|--------|-------------|
| `addListener(id, handler, scope?)` | Add event listener |
| `removeListener(id, handler?)` | Remove listener(s) |
| `dispatch(id, data?)` | Dispatch event |
| `getSignal(id)` | Get underlying Signal |

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

1. **2010** - Soma AS3 framework created by Romuald Quantin for ActionScript 3
2. **2011** - First JavaScript prototype ported by XB Labs using SmoothTools for class-based OOP
3. **2011+** - [SomaJS](https://github.com/nicholasromeo/soma) developed by Romuald Quantin, adding mediators, modules, infuse (DI), and templates
4. **2024** - Complete TypeScript rewrite by XB Labs

**This TypeScript version includes:**
- Complete migration to TypeScript with strict typing
- Modern browser support (removed IE7/8 legacy code)
- Comprehensive test suite (260+ tests)
- ES module support
- Improved dependency injection with circular reference support

## License

MIT License

See [LICENSE](./LICENSE) for full terms.

**Original SomaJS:** Copyright (c) Romuald Quantin (soundstep.com)
**TypeScript rewrite:** Copyright (c) 2024 XB Labs
