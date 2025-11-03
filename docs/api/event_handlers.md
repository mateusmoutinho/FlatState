# Event Handlers

FlatState provides a comprehensive set of pre-built event handlers that make it easy to bind UI elements directly to your state. These handlers automatically extract values from events and update the state accordingly.

## Input Event Handlers

### `createEventTargetPathHandler(path)`

Creates a handler that sets the state to `event.target.value`.

**Parameters:**
- `path` (Array): Path where to store the input value

**Returns:**
- `Function`: Event handler function

**Use Cases:**
- Text inputs
- Textareas
- Any input with a `value` property

**Examples:**
```javascript
const state = new FlatState();

// Basic text input
const nameHandler = state.createEventTargetPathHandler(['user', 'name']);

// HTML
// <input type="text" onblur={nameHandler} placeholder="Enter name" />

// React
const NameInput = () => (
    <input 
        type="text" 
        onBlur={nameHandler}
        defaultValue={state.get(['user', 'name'])}
        placeholder="Enter name" 
    />
);

// Textarea
const descriptionHandler = state.createEventTargetPathHandler(['description']);
// <textarea onchange={descriptionHandler}></textarea>
```

### `createCheckboxEventHandler(path)`

Creates a handler for checkbox inputs that sets the state to `event.target.checked`.

**Parameters:**
- `path` (Array): Path where to store the boolean value

**Returns:**
- `Function`: Event handler function

**Examples:**
```javascript
const state = new FlatState();

// Single checkbox
const agreementHandler = state.createCheckboxEventHandler(['user', 'agreedToTerms']);

// HTML
// <input type="checkbox" onchange={agreementHandler} />

// React
const AgreementCheckbox = () => (
    <label>
        <input 
            type="checkbox" 
            onChange={agreementHandler}
            defaultChecked={state.get(['user', 'agreedToTerms'])}
        />
        I agree to the terms
    </label>
);

// Multiple checkboxes for features
const features = ['notifications', 'newsletter', 'updates'];
features.forEach(feature => {
    const handler = state.createCheckboxEventHandler(['preferences', feature]);
    // Bind to respective checkboxes
});
```

### `createNumberEventHandler(path)`

Creates a handler for numeric inputs that parses the value as a float.

**Parameters:**
- `path` (Array): Path where to store the numeric value

**Returns:**
- `Function`: Event handler function

**Features:**
- Automatically converts string to number using `parseFloat()`
- Sets value to 0 if parsing results in `NaN`

**Examples:**
```javascript
const state = new FlatState();

// Price input
const priceHandler = state.createNumberEventHandler(['product', 'price']);

// HTML
// <input type="number" step="0.01" onblur={priceHandler} />

// React
const PriceInput = () => (
    <input 
        type="number" 
        step="0.01"
        onBlur={priceHandler}
        defaultValue={state.get(['product', 'price'])}
        placeholder="0.00"
    />
);

// Range slider
const volumeHandler = state.createNumberEventHandler(['settings', 'volume']);
// <input type="range" min="0" max="100" oninput={volumeHandler} />
```

### `createIntegerEventHandler(path)`

Creates a handler for integer inputs that parses the value as an integer.

**Parameters:**
- `path` (Array): Path where to store the integer value

**Returns:**
- `Function`: Event handler function

**Features:**
- Automatically converts string to integer using `parseInt(value, 10)`
- Sets value to 0 if parsing results in `NaN`

**Examples:**
```javascript
const state = new FlatState();

// Age input
const ageHandler = state.createIntegerEventHandler(['user', 'age']);

// Quantity input
const quantityHandler = state.createIntegerEventHandler(['cart', 'quantity']);

// HTML
// <input type="number" min="0" onblur={ageHandler} />

// React
const AgeInput = () => (
    <input 
        type="number" 
        min="0"
        max="120"
        onBlur={ageHandler}
        defaultValue={state.get(['user', 'age'])}
    />
);
```

### `createSelectEventHandler(path)`

Creates a handler for select elements that handles both single and multiple selections.

**Parameters:**
- `path` (Array): Path where to store the selected value(s)

**Returns:**
- `Function`: Event handler function

**Features:**
- Single select: stores the selected value as string
- Multiple select: stores array of selected values
- Automatically detects single vs multiple based on `event.target.multiple`

**Examples:**
```javascript
const state = new FlatState();

// Single select
const countryHandler = state.createSelectEventHandler(['user', 'country']);

// HTML - Single Select
/*
<select onchange={countryHandler}>
    <option value="us">United States</option>
    <option value="ca">Canada</option>
    <option value="uk">United Kingdom</option>
</select>
*/

// Multiple select
const skillsHandler = state.createSelectEventHandler(['user', 'skills']);

// HTML - Multiple Select
/*
<select multiple onchange={skillsHandler}>
    <option value="js">JavaScript</option>
    <option value="py">Python</option>
    <option value="java">Java</option>
    <option value="cpp">C++</option>
</select>
*/

// React
const CountrySelect = () => (
    <select 
        onChange={countryHandler}
        defaultValue={state.get(['user', 'country'])}
    >
        <option value="">Select Country</option>
        <option value="us">United States</option>
        <option value="ca">Canada</option>
        <option value="uk">United Kingdom</option>
    </select>
);

const SkillsSelect = () => (
    <select 
        multiple 
        onChange={skillsHandler}
        defaultValue={state.get(['user', 'skills']) || []}
    >
        <option value="js">JavaScript</option>
        <option value="py">Python</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>
    </select>
);
```

## Form Handlers

### `createFormEventHandler(pathMap)`

Creates a handler for form submissions that extracts all form data at once.

**Parameters:**
- `pathMap` (Object): Maps form field names to state paths

**Returns:**
- `Function`: Form submit event handler function

**Features:**
- Automatically calls `event.preventDefault()`
- Uses `FormData` to extract all form values
- Maps form fields to different state paths

**Examples:**
```javascript
const state = new FlatState();

// Define how form fields map to state paths
const formHandler = state.createFormEventHandler({
    'username': ['user', 'username'],
    'email': ['user', 'email'],
    'age': ['user', 'age'],
    'newsletter': ['preferences', 'newsletter']
});

// HTML Form
/*
<form onsubmit={formHandler}>
    <input name="username" type="text" placeholder="Username" />
    <input name="email" type="email" placeholder="Email" />
    <input name="age" type="number" placeholder="Age" />
    <input name="newsletter" type="checkbox" />
    <button type="submit">Submit</button>
</form>
*/

// React Form
const UserForm = () => (
    <form onSubmit={formHandler}>
        <input 
            name="username" 
            type="text" 
            placeholder="Username"
            defaultValue={state.get(['user', 'username'])}
        />
        <input 
            name="email" 
            type="email" 
            placeholder="Email"
            defaultValue={state.get(['user', 'email'])}
        />
        <input 
            name="age" 
            type="number" 
            placeholder="Age"
            defaultValue={state.get(['user', 'age'])}
        />
        <label>
            <input 
                name="newsletter" 
                type="checkbox"
                defaultChecked={state.get(['preferences', 'newsletter'])}
            />
            Subscribe to newsletter
        </label>
        <button type="submit">Submit</button>
    </form>
);

// Complex form with nested data
const addressFormHandler = state.createFormEventHandler({
    'street': ['address', 'street'],
    'city': ['address', 'city'],
    'state': ['address', 'state'],
    'zip': ['address', 'zipCode'],
    'country': ['address', 'country']
});
```

## Action Handlers

### `createValueSetterHandler(path)`

Creates a handler that sets a specific value (not from an event).

**Parameters:**
- `path` (Array): Path where to store the value

**Returns:**
- `Function`: Handler function that accepts a value parameter

**Examples:**
```javascript
const state = new FlatState();

// Create setter for theme
const setTheme = state.createValueSetterHandler(['settings', 'theme']);

// Use with buttons
const ThemeButtons = () => (
    <div>
        <button onClick={() => setTheme('light')}>Light Theme</button>
        <button onClick={() => setTheme('dark')}>Dark Theme</button>
        <button onClick={() => setTheme('auto')}>Auto Theme</button>
    </div>
);

// API response handler
fetch('/api/user')
    .then(response => response.json())
    .then(userData => {
        const setUser = state.createValueSetterHandler(['user']);
        setUser(userData);
    });

// Programmatic updates
const setStatus = state.createValueSetterHandler(['app', 'status']);
setStatus('loading');
// ... do work
setStatus('ready');
```

### `createToggleHandler(path)`

Creates a handler that toggles a boolean value.

**Parameters:**
- `path` (Array): Path to the boolean value to toggle

**Returns:**
- `Function`: Handler function that toggles the boolean value

**Examples:**
```javascript
const state = new FlatState({
    ui: {
        sidebarOpen: false,
        darkMode: false
    },
    user: {
        isOnline: true
    }
});

// Toggle handlers
const toggleSidebar = state.createToggleHandler(['ui', 'sidebarOpen']);
const toggleDarkMode = state.createToggleHandler(['ui', 'darkMode']);
const toggleOnlineStatus = state.createToggleHandler(['user', 'isOnline']);

// Use in components
const Header = () => (
    <header>
        <button onClick={toggleSidebar}>
            {state.get(['ui', 'sidebarOpen']) ? 'Close' : 'Open'} Menu
        </button>
        <button onClick={toggleDarkMode}>
            {state.get(['ui', 'darkMode']) ? 'Light' : 'Dark'} Mode
        </button>
    </header>
);

// Toggle visibility
const toggleModal = state.createToggleHandler(['ui', 'showModal']);
// <button onClick={toggleModal}>Toggle Modal</button>
```

### `createIncrementHandler(path, step = 1)`

Creates a handler that increments a numeric value.

**Parameters:**
- `path` (Array): Path to the numeric value
- `step` (number, optional): Amount to increment. Defaults to 1.

**Returns:**
- `Function`: Handler function that increments the value

**Examples:**
```javascript
const state = new FlatState({
    counter: 0,
    settings: {
        fontSize: 14,
        volume: 50
    }
});

// Basic increment
const increment = state.createIncrementHandler(['counter']);
const incrementBy5 = state.createIncrementHandler(['counter'], 5);

// Font size controls
const increaseFontSize = state.createIncrementHandler(['settings', 'fontSize'], 2);
const increaseVolume = state.createIncrementHandler(['settings', 'volume'], 10);

// Use in UI
const Counter = () => (
    <div>
        <span>Count: {state.get(['counter'])}</span>
        <button onClick={increment}>+1</button>
        <button onClick={incrementBy5}>+5</button>
    </div>
);

const VolumeControl = () => (
    <div>
        <span>Volume: {state.get(['settings', 'volume'])}</span>
        <button onClick={increaseVolume}>+</button>
    </div>
);
```

### `createDecrementHandler(path, step = 1)`

Creates a handler that decrements a numeric value.

**Parameters:**
- `path` (Array): Path to the numeric value
- `step` (number, optional): Amount to decrement. Defaults to 1.

**Returns:**
- `Function`: Handler function that decrements the value

**Examples:**
```javascript
const state = new FlatState({
    counter: 10,
    settings: {
        fontSize: 16,
        volume: 80
    }
});

// Basic decrement
const decrement = state.createDecrementHandler(['counter']);
const decrementBy5 = state.createDecrementHandler(['counter'], 5);

// Font size controls
const decreaseFontSize = state.createDecrementHandler(['settings', 'fontSize'], 2);
const decreaseVolume = state.createDecrementHandler(['settings', 'volume'], 10);

// Complete counter component
const Counter = () => {
    const count = state.get(['counter']);
    const increment = state.createIncrementHandler(['counter']);
    const decrement = state.createDecrementHandler(['counter']);
    
    return (
        <div>
            <button onClick={decrement}>-</button>
            <span>Count: {count}</span>
            <button onClick={increment}>+</button>
        </div>
    );
};
```

### `createResetHandler(path, defaultValue = null)`

Creates a handler that resets a value to a default.

**Parameters:**
- `path` (Array): Path to the value to reset
- `defaultValue` (any, optional): Value to reset to. Defaults to null.

**Returns:**
- `Function`: Handler function that resets the value

**Examples:**
```javascript
const state = new FlatState({
    form: {
        username: '',
        email: '',
        age: 0
    },
    filters: {
        category: 'all',
        priceRange: [0, 1000]
    }
});

// Reset individual fields
const resetUsername = state.createResetHandler(['form', 'username'], '');
const resetAge = state.createResetHandler(['form', 'age'], 0);

// Reset entire sections
const resetForm = state.createResetHandler(['form'], {
    username: '',
    email: '',
    age: 0
});

const resetFilters = state.createResetHandler(['filters'], {
    category: 'all',
    priceRange: [0, 1000]
});

// Use in components
const FormControls = () => (
    <div>
        <button onClick={resetUsername}>Reset Username</button>
        <button onClick={resetForm}>Reset Entire Form</button>
    </div>
);

const FilterControls = () => (
    <div>
        <button onClick={resetFilters}>Clear All Filters</button>
    </div>
);
```

## Best Practices for Event Handlers

### Combining Multiple Handlers

```javascript
// Create a comprehensive form with various input types
const state = new FlatState();

const handlers = {
    name: state.createEventTargetPathHandler(['user', 'name']),
    email: state.createEventTargetPathHandler(['user', 'email']),
    age: state.createIntegerEventHandler(['user', 'age']),
    newsletter: state.createCheckboxEventHandler(['preferences', 'newsletter']),
    country: state.createSelectEventHandler(['user', 'country']),
    toggle: state.createToggleHandler(['ui', 'showAdvanced']),
    reset: state.createResetHandler(['user'], {})
};

// React component using all handlers
const UserProfile = () => {
    const showAdvanced = state.get(['ui', 'showAdvanced']);
    
    return (
        <form>
            <input 
                type="text" 
                placeholder="Name"
                onBlur={handlers.name}
                defaultValue={state.get(['user', 'name'])}
            />
            
            <input 
                type="email" 
                placeholder="Email"
                onBlur={handlers.email}
                defaultValue={state.get(['user', 'email'])}
            />
            
            <input 
                type="number" 
                placeholder="Age"
                onBlur={handlers.age}
                defaultValue={state.get(['user', 'age'])}
            />
            
            <label>
                <input 
                    type="checkbox"
                    onChange={handlers.newsletter}
                    defaultChecked={state.get(['preferences', 'newsletter'])}
                />
                Subscribe to newsletter
            </label>
            
            <button type="button" onClick={handlers.toggle}>
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
            
            {showAdvanced && (
                <select onChange={handlers.country}>
                    <option value="us">United States</option>
                    <option value="ca">Canada</option>
                </select>
            )}
            
            <button type="button" onClick={handlers.reset}>
                Reset Form
            </button>
        </form>
    );
};
```

### Custom Event Handler Patterns

```javascript
// Create a compound handler that updates multiple fields
function createCompoundHandler(state, updates) {
    return (value) => {
        updates.forEach(({ path, transform }) => {
            const finalValue = transform ? transform(value) : value;
            state.set(path, finalValue);
        });
    };
}

// Usage
const updateUserAndLog = createCompoundHandler(state, [
    { path: ['user', 'lastActive'], transform: () => new Date().toISOString() },
    { path: ['user', 'name'], transform: (name) => name.trim() },
    { path: ['logs'], transform: (name) => `User ${name} updated profile` }
]);

// Debounced event handler
function createDebouncedHandler(handler, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => handler(...args), delay);
    };
}

// Usage with search
const searchHandler = state.createEventTargetPathHandler(['search', 'query']);
const debouncedSearch = createDebouncedHandler(searchHandler, 500);

// <input type="text" oninput={debouncedSearch} placeholder="Search..." />
```