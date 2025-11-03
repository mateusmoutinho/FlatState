<div align="center">

# FlatState
![JavaScript Logo](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
[![GitHub Release](https://img.shields.io/github/release/mateusmoutinho/FlatState.svg?style=for-the-badge)](https://github.com/mateusmoutinho/FlatState/releases)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://github.com/mateusmoutinho/FlatState/blob/main/LICENSE)
![Status](https://img.shields.io/badge/Status-Stable-brightgreen?style=for-the-badge)
![Platforms](https://img.shields.io/badge/Platforms-Browser%20|%20Node.js-lightgrey?style=for-the-badge)

</div>

---

### Overview

FlatState is a lightweight JavaScript library that provides a flattened approach to state management. It allows you to work with deeply nested objects and arrays using simple path-based operations, making complex state manipulation intuitive and predictable.

**Key Benefits:**
1. **Simple Path-Based Access** - Access nested data with array paths
2. **Reactive Updates** - Built-in callback system for state changes  
3. **Framework Agnostic** - Works with React, Vue, vanilla JS, and more
4. **Zero Dependencies** - Lightweight and self-contained
5. **Array Manipulation** - Rich set of array operations with negative indexing
6. **Event Handlers** - Pre-built handlers for common UI interactions

### Key Features

- **Path-Based State Management** - Navigate complex objects with simple array paths
- **Reactive Callbacks** - Automatic notifications on state changes
- **Negative Array Indexing** - Python-style negative indices for arrays
- **Event Handler Generators** - Pre-built handlers for forms, inputs, and UI elements
- **SubState Support** - Create isolated state instances for components
- **Type-Safe Operations** - Built-in validation and error handling
- **Framework Integration** - Seamless integration with popular frameworks

### Installation

#### CDN (Browser)
```html
<script src="https://github.com/mateusmoutinho/FlatState/releases/download/0.1.0/flatstate.js"></script>
```

#### Server Side Usage
```bash
curl -L https://github.com/mateusmoutinho/FlatState/releases/download/0.1.0/flatstate.js -o flatstate.js
```

```javascript
let FlatState = require("./flatstate.js")

// or
import FlatState from 'flatstate';
```

### Quick Start

```javascript
// Create a new state instance
const state = new FlatState({
    user: {
        name: '',
        age: 0,
        preferences: {
            theme: 'dark'
        }
    },
    items: []
});

// Set up reactive callback
state.setSetterCallback((props) => {
    console.log('State changed:', props.path, props.value);
});

// Basic operations
state.set(['user', 'name'], 'John Doe');
state.set(['user', 'age'], 25);
state.append(['items'], { id: 1, title: 'First Item' });

// Get values
const userName = state.get(['user', 'name']); // 'John Doe'
const lastItem = state.get(['items', -1]); // { id: 1, title: 'First Item' }

// Create event handlers for forms
const nameHandler = state.createEventTargetPathHandler(['user', 'name']);
const ageHandler = state.createNumberEventHandler(['user', 'age']);
```

### Framework Integration

Want to learn how to integrate FlatState with React, Vue, or other frameworks? Check out our comprehensive integration guides in the documentation below.

---

## Documentation

### API Reference
| **Document**                                                    | **Description**                                         |
|-----------------------------------------------------------------|---------------------------------------------------------|
| [Core Methods](docs/api/core_methods.md)              | Basic state operations (get, set, getState)                       |
| [Array Operations](docs/api/array_operations.md)                           | Array manipulation methods (append, destroy, insert, pop)                               |
| [Event Handlers](docs/api/event_handlers.md)                   | Pre-built event handlers for UI integration                     |
| [SubState Management](docs/api/substate_management.md)      | Working with isolated state instances                          |

### Examples and Guides
| **Document**                                                    | **Description**                                         |
|-----------------------------------------------------------------|---------------------------------------------------------|
| [Basic Usage](docs/examples/basic_usage.md)              | Getting started with FlatState                       |
| [React Integration](docs/examples/react_integration.md)                           | Using FlatState with React components                               |
| [Form Handling](docs/examples/form_handling.md)                   | Managing forms and user input                     |
| [Array Manipulation](docs/examples/array_manipulation.md)      | Working with lists and collections                          |

### Advanced Topics
| **Document**                                                    | **Description**                                         |
|-----------------------------------------------------------------|---------------------------------------------------------|
| [Performance Optimization](docs/advanced/performance.md)              | Best practices for large applications                       |
| [Custom Event Handlers](docs/advanced/custom_handlers.md)                           | Creating your own event handler patterns                               |
| [State Architecture](docs/advanced/state_architecture.md)                   | Organizing complex application state                     |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

--- 
