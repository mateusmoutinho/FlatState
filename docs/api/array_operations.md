# Array Operations

This document covers FlatState's powerful array manipulation methods.

## Array Modification Methods

### `append(path, value, props)`

Adds an element to the end of an array at the specified path.

**Parameters:**
- `path` (Array): Path to the target array
- `value` (any): Value to append
- `props` (Object, optional): Additional properties for the setter callback

**Throws:**
- `Error`: If path is not a non-empty array
- `Error`: If target at path exists but is not an array

**Features:**
- Creates array at path if it doesn't exist
- Automatically handles array initialization

**Examples:**
```javascript
const state = new FlatState();

// Append to non-existent array (creates it)
state.append(['items'], 'first item');
state.append(['items'], 'second item');

console.log(state.get(['items'])); // ['first item', 'second item']

// Append objects
state.append(['users'], { id: 1, name: 'John' });
state.append(['users'], { id: 2, name: 'Jane' });

// With additional props
state.append(['logs'], 'New log entry', { timestamp: Date.now() });
```

### `destroy(path, index)`

Removes an element from an array at the specified index.

**Parameters:**
- `path` (Array): Path to the target array
- `index` (number): Index of element to remove (supports negative indices)

**Throws:**
- `Error`: If path is not a non-empty array
- `Error`: If target at path doesn't exist or is not an array
- `Error`: If index is out of bounds

**Features:**
- Supports negative indices (Python-style)
- Automatically adjusts array after removal

**Examples:**
```javascript
const state = new FlatState({
    items: ['apple', 'banana', 'cherry', 'date']
});

// Remove by positive index
state.destroy(['items'], 1); // Removes 'banana'
console.log(state.get(['items'])); // ['apple', 'cherry', 'date']

// Remove by negative index
state.destroy(['items'], -1); // Removes 'date' (last item)
console.log(state.get(['items'])); // ['apple', 'cherry']

// Remove first item
state.destroy(['items'], 0); // Removes 'apple'
console.log(state.get(['items'])); // ['cherry']
```

### `insert(path, index, value)`

Inserts an element at a specific index in an array.

**Parameters:**
- `path` (Array): Path to the target array
- `index` (number): Index where to insert (supports negative indices)
- `value` (any): Value to insert

**Throws:**
- `Error`: If target at path is not an array

**Features:**
- Supports negative indices
- Automatically clamps index to valid range
- Shifts existing elements to make room

**Examples:**
```javascript
const state = new FlatState({
    items: ['apple', 'banana', 'cherry']
});

// Insert at beginning
state.insert(['items'], 0, 'apricot');
console.log(state.get(['items'])); // ['apricot', 'apple', 'banana', 'cherry']

// Insert in middle
state.insert(['items'], 2, 'blueberry');
console.log(state.get(['items'])); // ['apricot', 'apple', 'blueberry', 'banana', 'cherry']

// Insert at end using negative index
state.insert(['items'], -0, 'elderberry'); // Same as length
console.log(state.get(['items'])); // ['apricot', 'apple', 'blueberry', 'banana', 'cherry', 'elderberry']

// Insert before last element
state.insert(['items'], -1, 'fig');
console.log(state.get(['items'])); // ['apricot', 'apple', 'blueberry', 'banana', 'cherry', 'fig', 'elderberry']
```

### `pop(path)`

Removes and returns the last element from an array.

**Parameters:**
- `path` (Array): Path to the target array

**Returns:**
- `any`: The removed element, or `undefined` if array is empty or doesn't exist

**Examples:**
```javascript
const state = new FlatState({
    items: ['apple', 'banana', 'cherry']
});

const lastItem = state.pop(['items']); // 'cherry'
console.log(lastItem); // 'cherry'
console.log(state.get(['items'])); // ['apple', 'banana']

// Pop from empty array
state.set(['empty'], []);
const nothing = state.pop(['empty']); // undefined

// Pop from non-existent array
const alsoNothing = state.pop(['nonexistent']); // undefined
```

## Array Handler Generators

These methods create reusable functions for common array operations.

### `createArrayPopHandler(path)`

Creates a function that removes the last element from an array.

**Parameters:**
- `path` (Array): Path to the target array

**Returns:**
- `Function`: Handler function that removes the last element

**Example:**
```javascript
const state = new FlatState({
    items: ['apple', 'banana', 'cherry']
});

const removeLastItem = state.createArrayPopHandler(['items']);

// Use in event handlers
document.getElementById('removeBtn').onclick = removeLastItem;

// Or call directly
removeLastItem(); // Removes 'cherry'
console.log(state.get(['items'])); // ['apple', 'banana']
```

### `createArrayPushHandler(path, item = null)`

Creates a function that adds an element to the end of an array.

**Parameters:**
- `path` (Array): Path to the target array
- `item` (any, optional): Item to push. Defaults to null.

**Returns:**
- `Function`: Handler function that adds the specified item

**Examples:**
```javascript
const state = new FlatState({
    items: []
});

// Create handler with specific item
const addApple = state.createArrayPushHandler(['items'], 'apple');
const addBanana = state.createArrayPushHandler(['items'], 'banana');

// Use handlers
addApple(); // Adds 'apple'
addBanana(); // Adds 'banana'
console.log(state.get(['items'])); // ['apple', 'banana']

// Create handler for dynamic items
const addTodo = state.createArrayPushHandler(['todos'], null);
// Later, you might modify this to push actual todo objects

// Use in React
const TodoApp = () => {
    const addNewTodo = state.createArrayPushHandler(['todos'], {
        id: Date.now(),
        text: 'New Todo',
        completed: false
    });
    
    return <button onClick={addNewTodo}>Add Todo</button>;
};
```

### `createArrayRemoveHandler(path, index)`

Creates a function that removes an element at a specific index.

**Parameters:**
- `path` (Array): Path to the target array
- `index` (number): Index of element to remove

**Returns:**
- `Function`: Handler function that removes the element at the specified index

**Example:**
```javascript
const state = new FlatState({
    items: ['apple', 'banana', 'cherry']
});

// Create handlers for specific indices
const removeFirst = state.createArrayRemoveHandler(['items'], 0);
const removeSecond = state.createArrayRemoveHandler(['items'], 1);

removeFirst(); // Removes 'apple'
console.log(state.get(['items'])); // ['banana', 'cherry']

// In a list component
const TodoList = () => {
    const todos = state.get(['todos']) || [];
    
    return (
        <ul>
            {todos.map((todo, index) => (
                <li key={todo.id}>
                    {todo.text}
                    <button onClick={state.createArrayRemoveHandler(['todos'], index)}>
                        Delete
                    </button>
                </li>
            ))}
        </ul>
    );
};
```

### `createArrayDestroyHandler(path, index)`

Creates a function that safely removes an element at a specific index with bounds checking.

**Parameters:**
- `path` (Array): Path to the target array
- `index` (number): Index of element to remove

**Returns:**
- `Function`: Handler function that safely removes the element

**Note:** This is similar to `createArrayRemoveHandler` but uses the `destroy` method internally, which provides better error handling and bounds checking.

**Example:**
```javascript
const state = new FlatState({
    items: ['apple', 'banana', 'cherry']
});

const safeRemoveFirst = state.createArrayDestroyHandler(['items'], 0);
const safeRemoveLast = state.createArrayDestroyHandler(['items'], -1);

safeRemoveLast(); // Safely removes 'cherry'
console.log(state.get(['items'])); // ['apple', 'banana']

// Won't throw error if index becomes invalid
safeRemoveFirst();
safeRemoveFirst(); // Safe even when array becomes empty
```

## Array Best Practices

### Working with Dynamic Lists

```javascript
const state = new FlatState({
    todos: [],
    nextId: 1
});

// Add new todo
function addTodo(text) {
    const newTodo = {
        id: state.get(['nextId']),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    state.append(['todos'], newTodo);
    state.set(['nextId'], state.get(['nextId']) + 1);
}

// Remove todo by ID
function removeTodoById(id) {
    const todos = state.get(['todos']) || [];
    const index = todos.findIndex(todo => todo.id === id);
    if (index !== -1) {
        state.destroy(['todos'], index);
    }
}

// Toggle todo completion
function toggleTodo(id) {
    const todos = state.get(['todos']) || [];
    const index = todos.findIndex(todo => todo.id === id);
    if (index !== -1) {
        const currentStatus = state.get(['todos', index, 'completed']);
        state.set(['todos', index, 'completed'], !currentStatus);
    }
}
```

### Batch Operations

```javascript
// Adding multiple items efficiently
function addMultipleItems(items) {
    items.forEach(item => {
        state.append(['items'], item);
    });
}

// Moving items within array
function moveItem(fromIndex, toIndex) {
    const items = state.get(['items']) || [];
    if (fromIndex < 0 || fromIndex >= items.length || 
        toIndex < 0 || toIndex >= items.length) {
        return;
    }
    
    const item = items[fromIndex];
    state.destroy(['items'], fromIndex);
    state.insert(['items'], toIndex, item);
}
```