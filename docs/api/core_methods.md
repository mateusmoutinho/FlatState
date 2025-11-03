# Core Methods

This document covers the fundamental methods of FlatState for basic state management operations.

## Constructor

### `new FlatState(mainObject = {})`

Creates a new FlatState instance.

**Parameters:**
- `mainObject` (Object, optional): Initial state object. Defaults to empty object.

**Throws:**
- `Error`: If mainObject is not a non-null object.

**Example:**
```javascript
// Empty state
const state = new FlatState();

// With initial data
const state = new FlatState({
    user: { name: 'John', age: 25 },
    items: ['item1', 'item2']
});
```

## Core State Operations

### `get(path)`

Retrieves a value from the state using a path array.

**Parameters:**
- `path` (Array): Array representing the path to the desired value

**Returns:**
- `any`: The value at the specified path, or `undefined` if not found

**Throws:**
- `Error`: If path is not an array

**Features:**
- Supports negative array indices (Python-style)
- Returns `undefined` for non-existent paths
- Safe navigation through nested structures

**Examples:**
```javascript
const state = new FlatState({
    user: { name: 'John', preferences: { theme: 'dark' } },
    items: ['apple', 'banana', 'cherry']
});

// Basic access
state.get(['user', 'name']); // 'John'
state.get(['user', 'preferences', 'theme']); // 'dark'

// Array access
state.get(['items', 0]); // 'apple'
state.get(['items', -1]); // 'cherry' (last item)
state.get(['items', -2]); // 'banana' (second to last)

// Non-existent paths
state.get(['user', 'email']); // undefined
state.get(['nonexistent']); // undefined
```

### `set(path, value, props)`

Sets a value in the state at the specified path.

**Parameters:**
- `path` (Array): Array representing the path where to set the value
- `value` (any): The value to set
- `props` (Object, optional): Additional properties to pass to the setter callback

**Throws:**
- `Error`: If path is not a non-empty array
- `Error`: If negative array index is out of bounds

**Features:**
- Automatically creates intermediate objects/arrays as needed
- Supports negative array indices
- Triggers setter callback if configured
- Creates arrays when next key is numeric, objects otherwise

**Examples:**
```javascript
const state = new FlatState();

// Basic setting
state.set(['user', 'name'], 'John');
state.set(['user', 'age'], 25);

// Deep nesting (auto-creates structure)
state.set(['user', 'preferences', 'theme'], 'dark');

// Array creation and access
state.set(['items', 0], 'first item');
state.set(['items', 1], 'second item');

// Negative indices
state.set(['items', -1], 'last item'); // Replaces last item

// With additional props for callback
state.set(['user', 'email'], 'john@example.com', { 
    source: 'user_input' 
});
```

### `getState()`

Returns the complete state object.

**Returns:**
- `Object`: The entire state object

**Example:**
```javascript
const state = new FlatState({ user: { name: 'John' } });
state.set(['user', 'age'], 25);

const fullState = state.getState();
// { user: { name: 'John', age: 25 } }
```

## Callback Management

### `setSetterCallback(callback)`

Sets a callback function that will be called whenever the state is modified.

**Parameters:**
- `callback` (Function): Function to call on state changes

**Callback Parameters:**
- `props` (Object): Contains at minimum:
  - `path` (Array): The path that was modified
  - `value` (any): The new value
  - Additional properties passed to `set()` method

**Example:**
```javascript
const state = new FlatState();

state.setSetterCallback((props) => {
    console.log('State changed at path:', props.path);
    console.log('New value:', props.value);
    if (props.event) {
        console.log('Triggered by event:', props.event.type);
    }
});

state.set(['user', 'name'], 'John');
// Output: State changed at path: ['user', 'name']
//         New value: John
```

## SubState Management

### `subState(path)`

Creates a new FlatState instance that operates on a subset of the current state.

**Parameters:**
- `path` (Array): Path to the object that will become the root of the substate

**Returns:**
- `FlatState`: New FlatState instance operating on the specified subset

**Throws:**
- `Error`: If the target at path is not a non-null object

**Features:**
- Inherits the parent's setter callback
- Changes to substate affect the original state
- Useful for component-level state management

**Example:**
```javascript
const state = new FlatState({
    app: {
        user: { name: 'John', age: 25 },
        settings: { theme: 'dark', language: 'en' }
    }
});

// Create substate for user management
const userState = state.subState(['app', 'user']);

// Operations on substate affect original state
userState.set(['name'], 'Jane');
userState.set(['email'], 'jane@example.com');

console.log(state.get(['app', 'user']));
// { name: 'Jane', age: 25, email: 'jane@example.com' }
```

## Utility Methods

### `size(path)`

Returns the length of an array at the specified path.

**Parameters:**
- `path` (Array): Path to the array

**Returns:**
- `number`: Length of the array, or 0 if not an array

**Example:**
```javascript
const state = new FlatState({
    items: ['a', 'b', 'c'],
    user: { name: 'John' }
});

state.size(['items']); // 3
state.size(['user']); // 0 (not an array)
state.size(['nonexistent']); // 0
```