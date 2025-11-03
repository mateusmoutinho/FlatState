# Basic Usage

This guide covers the fundamental usage patterns of FlatState for beginners.

## Getting Started

### Installation and Setup

```javascript
// Browser (CDN)
// Include this in your HTML head:
// <script src="https://github.com/mateusmoutinho/FlatState/releases/download/0.1.0/flatstate.js"></script>

// Node.js
const FlatState = require('./flatstate.js');

// Create your first state instance
const state = new FlatState({
    user: {
        name: '',
        age: 0,
        email: ''
    },
    settings: {
        theme: 'light',
        notifications: true
    }
});
```

### Basic State Operations

```javascript
// Getting values
const userName = state.get(['user', 'name']);
const userAge = state.get(['user', 'age']);
const theme = state.get(['settings', 'theme']);

console.log(userName); // ''
console.log(userAge);  // 0
console.log(theme);    // 'light'

// Setting values
state.set(['user', 'name'], 'John Doe');
state.set(['user', 'age'], 25);
state.set(['user', 'email'], 'john@example.com');

// Getting the complete state
const fullState = state.getState();
console.log(fullState);
/*
{
    user: {
        name: 'John Doe',
        age: 25,
        email: 'john@example.com'
    },
    settings: {
        theme: 'light',
        notifications: true
    }
}
*/
```

## Working with Arrays

### Basic Array Operations

```javascript
const state = new FlatState({
    items: [],
    categories: ['electronics', 'books', 'clothing']
});

// Adding items to arrays
state.append(['items'], 'First item');
state.append(['items'], 'Second item');
state.append(['items'], 'Third item');

console.log(state.get(['items'])); 
// ['First item', 'Second item', 'Third item']

// Accessing array elements
const firstItem = state.get(['items', 0]);    // 'First item'
const lastItem = state.get(['items', -1]);    // 'Third item' (negative indexing)
const secondLast = state.get(['items', -2]);  // 'Second item'

// Array size
const itemCount = state.size(['items']); // 3

// Inserting at specific positions
state.insert(['items'], 1, 'Inserted item');
console.log(state.get(['items'])); 
// ['First item', 'Inserted item', 'Second item', 'Third item']

// Removing items
state.destroy(['items'], 0); // Remove first item
console.log(state.get(['items'])); 
// ['Inserted item', 'Second item', 'Third item']

// Pop last item
const poppedItem = state.pop(['items']); // 'Third item'
console.log(state.get(['items'])); 
// ['Inserted item', 'Second item']
```

### Working with Object Arrays

```javascript
const state = new FlatState({
    users: [],
    todos: []
});

// Adding user objects
state.append(['users'], {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    active: true
});

state.append(['users'], {
    id: 2,
    name: 'Bob',
    email: 'bob@example.com',
    active: false
});

// Accessing nested properties in arrays
const firstUserName = state.get(['users', 0, 'name']); // 'Alice'
const secondUserEmail = state.get(['users', 1, 'email']); // 'bob@example.com'

// Modifying nested properties
state.set(['users', 0, 'active'], false);
state.set(['users', 1, 'active'], true);

// Adding todo items
const addTodo = (text) => {
    state.append(['todos'], {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    });
};

addTodo('Learn FlatState');
addTodo('Build an app');
addTodo('Deploy to production');

console.log(state.get(['todos']));
/*
[
    {
        id: 1634567890123,
        text: 'Learn FlatState',
        completed: false,
        createdAt: '2023-10-18T10:30:00.123Z'
    },
    // ... more todos
]
*/
```

## Reactive State Updates

### Setting Up Callbacks

```javascript
const state = new FlatState({
    counter: 0,
    user: { name: '' }
});

// Set up a callback to respond to state changes
state.setSetterCallback((props) => {
    console.log(`State changed at path: ${props.path.join('.')}`);
    console.log(`New value:`, props.value);
    
    // Update UI based on changes
    updateUI();
});

// Now any state change will trigger the callback
state.set(['counter'], 1);
// Output: State changed at path: counter
//         New value: 1

state.set(['user', 'name'], 'Alice');
// Output: State changed at path: user.name
//         New value: Alice

function updateUI() {
    // Update your UI here
    document.getElementById('counter').textContent = state.get(['counter']);
    document.getElementById('userName').textContent = state.get(['user', 'name']);
}
```

## Creating Dynamic Structures

### Building Nested Objects on the Fly

```javascript
const state = new FlatState({});

// FlatState automatically creates intermediate objects
state.set(['app', 'user', 'profile', 'personal', 'name'], 'John');
state.set(['app', 'user', 'profile', 'personal', 'age'], 30);
state.set(['app', 'user', 'profile', 'contact', 'email'], 'john@example.com');
state.set(['app', 'user', 'profile', 'contact', 'phone'], '+1234567890');

console.log(state.getState());
/*
{
    app: {
        user: {
            profile: {
                personal: {
                    name: 'John',
                    age: 30
                },
                contact: {
                    email: 'john@example.com',
                    phone: '+1234567890'
                }
            }
        }
    }
}
*/

// Creating arrays dynamically
state.set(['app', 'user', 'hobbies', 0], 'reading');
state.set(['app', 'user', 'hobbies', 1], 'cycling');
state.set(['app', 'user', 'hobbies', 2], 'cooking');

// Or use append for arrays
state.append(['app', 'user', 'skills'], 'JavaScript');
state.append(['app', 'user', 'skills'], 'Python');
state.append(['app', 'user', 'skills'], 'React');
```

## Simple Event Handling

### Basic Form Integration

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://github.com/mateusmoutinho/FlatState/releases/download/0.1.0/flatstate.js"></script>
</head>
<body>
    <form id="userForm">
        <input type="text" id="name" placeholder="Name">
        <input type="email" id="email" placeholder="Email">
        <input type="number" id="age" placeholder="Age">
        <input type="checkbox" id="newsletter"> Subscribe to newsletter
        <button type="button" onclick="saveUser()">Save</button>
        <button type="button" onclick="displayUser()">Display</button>
    </form>
    
    <div id="output"></div>

    <script>
        const state = new FlatState({
            user: {
                name: '',
                email: '',
                age: 0,
                newsletter: false
            }
        });

        // Simple event handlers
        function saveUser() {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const age = parseInt(document.getElementById('age').value) || 0;
            const newsletter = document.getElementById('newsletter').checked;

            state.set(['user', 'name'], name);
            state.set(['user', 'email'], email);
            state.set(['user', 'age'], age);
            state.set(['user', 'newsletter'], newsletter);
            
            alert('User saved!');
        }

        function displayUser() {
            const user = state.get(['user']);
            document.getElementById('output').innerHTML = `
                <h3>User Information:</h3>
                <p>Name: ${user.name}</p>
                <p>Email: ${user.email}</p>
                <p>Age: ${user.age}</p>
                <p>Newsletter: ${user.newsletter ? 'Yes' : 'No'}</p>
            `;
        }
    </script>
</body>
</html>
```

### Using FlatState Event Handlers

```html
<script>
    const state = new FlatState({
        user: { name: '', email: '', age: 0, newsletter: false }
    });

    // Create event handlers
    const nameHandler = state.createEventTargetPathHandler(['user', 'name']);
    const emailHandler = state.createEventTargetPathHandler(['user', 'email']);
    const ageHandler = state.createIntegerEventHandler(['user', 'age']);
    const newsletterHandler = state.createCheckboxEventHandler(['user', 'newsletter']);

    // Set up reactive updates
    state.setSetterCallback(() => {
        updateDisplay();
    });

    function updateDisplay() {
        const user = state.get(['user']);
        document.getElementById('output').innerHTML = `
            <h3>Current State:</h3>
            <p>Name: ${user.name}</p>
            <p>Email: ${user.email}</p>
            <p>Age: ${user.age}</p>
            <p>Newsletter: ${user.newsletter ? 'Yes' : 'No'}</p>
        `;
    }
</script>

<!-- Updated HTML with event handlers -->
<form>
    <input type="text" onblur="nameHandler(event)" placeholder="Name">
    <input type="email" onblur="emailHandler(event)" placeholder="Email">
    <input type="number" onblur="ageHandler(event)" placeholder="Age">
    <input type="checkbox" onchange="newsletterHandler(event)"> Subscribe
</form>
```

## Common Patterns

### Counter Example

```javascript
const state = new FlatState({
    counter: 0
});

// Create increment/decrement handlers
const increment = state.createIncrementHandler(['counter']);
const decrement = state.createDecrementHandler(['counter']);
const reset = state.createResetHandler(['counter'], 0);

// Set up reactive display
state.setSetterCallback(() => {
    document.getElementById('counter').textContent = state.get(['counter']);
});

// HTML:
// <button onclick="decrement()">-</button>
// <span id="counter">0</span>
// <button onclick="increment()">+</button>
// <button onclick="reset()">Reset</button>
```

### Todo List Example

```javascript
const state = new FlatState({
    todos: [],
    newTodoText: ''
});

// Add new todo
function addTodo() {
    const text = state.get(['newTodoText']);
    if (text.trim()) {
        state.append(['todos'], {
            id: Date.now(),
            text: text.trim(),
            completed: false
        });
        state.set(['newTodoText'], ''); // Clear input
    }
}

// Toggle todo completion
function toggleTodo(index) {
    const completed = state.get(['todos', index, 'completed']);
    state.set(['todos', index, 'completed'], !completed);
}

// Remove todo
function removeTodo(index) {
    state.destroy(['todos'], index);
}

// Create handlers
const inputHandler = state.createEventTargetPathHandler(['newTodoText']);
const addTodoHandler = state.createArrayPushHandler(['todos'], null);

// Reactive display
state.setSetterCallback(() => {
    displayTodos();
});

function displayTodos() {
    const todos = state.get(['todos']) || [];
    const todoList = document.getElementById('todoList');
    
    todoList.innerHTML = todos.map((todo, index) => `
        <div class="${todo.completed ? 'completed' : ''}">
            <input type="checkbox" 
                   ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo(${index})">
            <span>${todo.text}</span>
            <button onclick="removeTodo(${index})">Delete</button>
        </div>
    `).join('');
    
    document.getElementById('newTodoInput').value = state.get(['newTodoText']);
}
```

### Settings Panel Example

```javascript
const state = new FlatState({
    settings: {
        theme: 'light',
        fontSize: 14,
        autoSave: true,
        language: 'en',
        notifications: {
            email: true,
            push: false,
            sms: false
        }
    }
});

// Create handlers for all settings
const themeHandler = state.createSelectEventHandler(['settings', 'theme']);
const fontSizeIncrement = state.createIncrementHandler(['settings', 'fontSize']);
const fontSizeDecrement = state.createDecrementHandler(['settings', 'fontSize']);
const autoSaveHandler = state.createCheckboxEventHandler(['settings', 'autoSave']);
const languageHandler = state.createSelectEventHandler(['settings', 'language']);

// Notification handlers
const emailNotificationHandler = state.createCheckboxEventHandler(['settings', 'notifications', 'email']);
const pushNotificationHandler = state.createCheckboxEventHandler(['settings', 'notifications', 'push']);
const smsNotificationHandler = state.createCheckboxEventHandler(['settings', 'notifications', 'sms']);

// Save settings to localStorage
state.setSetterCallback(() => {
    localStorage.setItem('appSettings', JSON.stringify(state.get(['settings'])));
    applySettings();
});

function applySettings() {
    const settings = state.get(['settings']);
    
    // Apply theme
    document.body.className = `theme-${settings.theme}`;
    
    // Apply font size
    document.body.style.fontSize = `${settings.fontSize}px`;
    
    // Update UI to reflect current settings
    updateSettingsDisplay();
}

function loadSettings() {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        state.set(['settings'], settings);
    }
}

// Load settings on app start
loadSettings();
```

## Error Handling

### Safe State Access

```javascript
const state = new FlatState({});

// Safe way to access potentially undefined paths
function safeGet(path, defaultValue = null) {
    const value = state.get(path);
    return value !== undefined ? value : defaultValue;
}

// Usage
const userName = safeGet(['user', 'name'], 'Anonymous');
const userAge = safeGet(['user', 'age'], 0);
const userPosts = safeGet(['user', 'posts'], []);

// Conditional setting
function safeSet(path, value) {
    try {
        state.set(path, value);
        return true;
    } catch (error) {
        console.error('Failed to set state:', error);
        return false;
    }
}

// Initialize nested structures safely
function ensurePath(path, defaultValue = {}) {
    if (state.get(path) === undefined) {
        state.set(path, defaultValue);
    }
}

// Usage
ensurePath(['user'], {});
ensurePath(['user', 'posts'], []);
ensurePath(['settings'], { theme: 'light' });
```

This covers the basic usage patterns of FlatState. For more advanced features, check out the other documentation files in the examples and API reference sections.