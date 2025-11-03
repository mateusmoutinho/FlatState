# React Integration

This guide demonstrates how to integrate FlatState with React applications for effective state management.

## Basic React Setup

### Simple State Integration

```jsx
import React, { useState, useEffect } from 'react';
import FlatState from './flatstate.js';

// Create global state instance
const appState = new FlatState({
    user: {
        name: '',
        email: '',
        age: 0
    },
    ui: {
        loading: false,
        theme: 'light'
    }
});

function App() {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        // Set up reactive updates
        appState.setSetterCallback(() => {
            forceUpdate({}); // Force re-render when state changes
        });
    }, []);

    return (
        <div className={`app theme-${appState.get(['ui', 'theme'])}`}>
            <UserProfile />
            <ThemeToggle />
        </div>
    );
}

function UserProfile() {
    const nameHandler = appState.createEventTargetPathHandler(['user', 'name']);
    const emailHandler = appState.createEventTargetPathHandler(['user', 'email']);
    const ageHandler = appState.createIntegerEventHandler(['user', 'age']);

    return (
        <div className="user-profile">
            <h2>User Profile</h2>
            <input
                type="text"
                placeholder="Name"
                value={appState.get(['user', 'name'])}
                onChange={nameHandler}
            />
            <input
                type="email"
                placeholder="Email"
                value={appState.get(['user', 'email'])}
                onChange={emailHandler}
            />
            <input
                type="number"
                placeholder="Age"
                value={appState.get(['user', 'age'])}
                onChange={ageHandler}
            />
        </div>
    );
}

function ThemeToggle() {
    const toggleTheme = () => {
        const currentTheme = appState.get(['ui', 'theme']);
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        appState.set(['ui', 'theme'], newTheme);
    };

    return (
        <button onClick={toggleTheme}>
            Switch to {appState.get(['ui', 'theme']) === 'light' ? 'Dark' : 'Light'} Theme
        </button>
    );
}

export default App;
```

## Custom Hook for FlatState

### Creating a Reusable Hook

```jsx
import { useState, useEffect, useCallback } from 'react';

// Custom hook for FlatState integration
function useFlatState(state, path = null) {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const callback = () => forceUpdate({});
        
        if (path) {
            // Only update if the specific path changed
            const originalCallback = state.setterCallback;
            state.setSetterCallback = (props) => {
                if (pathMatches(props.path, path)) {
                    callback();
                }
                if (originalCallback) originalCallback(props);
            };
        } else {
            state.setSetterCallback = callback;
        }

        return () => {
            state.setSetterCallback = null;
        };
    }, [state, path]);

    const get = useCallback((subPath = []) => {
        const fullPath = path ? [...path, ...subPath] : subPath;
        return state.get(fullPath);
    }, [state, path]);

    const set = useCallback((subPath, value, props) => {
        const fullPath = path ? [...path, ...subPath] : subPath;
        state.set(fullPath, value, props);
    }, [state, path]);

    return { get, set, state };
}

// Utility function to check if paths match
function pathMatches(changedPath, watchedPath) {
    if (!watchedPath || watchedPath.length === 0) return true;
    if (changedPath.length < watchedPath.length) return false;
    
    return watchedPath.every((segment, index) => 
        changedPath[index] === segment
    );
}

// Usage example
function UserComponent() {
    const { get, set } = useFlatState(appState, ['user']);

    const nameHandler = appState.createEventTargetPathHandler(['user', 'name']);
    
    return (
        <div>
            <h3>Hello, {get(['name']) || 'Guest'}!</h3>
            <input
                type="text"
                placeholder="Enter your name"
                value={get(['name'])}
                onChange={nameHandler}
            />
        </div>
    );
}
```

## Component-Based State Management

### Using SubStates with React Components

```jsx
import React from 'react';

// Main application state
const appState = new FlatState({
    todos: [],
    filters: {
        showCompleted: true,
        category: 'all'
    },
    ui: {
        newTodoText: '',
        editingId: null
    }
});

function TodoApp() {
    const { get } = useFlatState(appState);

    return (
        <div className="todo-app">
            <TodoInput />
            <TodoFilters />
            <TodoList />
            <TodoStats />
        </div>
    );
}

function TodoInput() {
    const { get } = useFlatState(appState, ['ui']);
    
    const inputHandler = appState.createEventTargetPathHandler(['ui', 'newTodoText']);
    
    const addTodo = () => {
        const text = get(['newTodoText']).trim();
        if (text) {
            appState.append(['todos'], {
                id: Date.now(),
                text,
                completed: false,
                createdAt: new Date().toISOString()
            });
            appState.set(['ui', 'newTodoText'], '');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    };

    return (
        <div className="todo-input">
            <input
                type="text"
                placeholder="Add a new todo..."
                value={get(['newTodoText'])}
                onChange={inputHandler}
                onKeyPress={handleKeyPress}
            />
            <button onClick={addTodo}>Add</button>
        </div>
    );
}

function TodoFilters() {
    const { get } = useFlatState(appState, ['filters']);
    
    const toggleCompleted = appState.createToggleHandler(['filters', 'showCompleted']);
    const categoryHandler = appState.createSelectEventHandler(['filters', 'category']);

    return (
        <div className="todo-filters">
            <label>
                <input
                    type="checkbox"
                    checked={get(['showCompleted'])}
                    onChange={toggleCompleted}
                />
                Show Completed
            </label>
            
            <select value={get(['category'])} onChange={categoryHandler}>
                <option value="all">All Categories</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="shopping">Shopping</option>
            </select>
        </div>
    );
}

function TodoList() {
    const { get } = useFlatState(appState, ['todos']);
    const filters = appState.get(['filters']);
    
    const todos = get([]) || [];
    
    const filteredTodos = todos.filter(todo => {
        if (!filters.showCompleted && todo.completed) return false;
        if (filters.category !== 'all' && todo.category !== filters.category) return false;
        return true;
    });

    return (
        <div className="todo-list">
            {filteredTodos.map((todo, index) => (
                <TodoItem key={todo.id} todo={todo} index={index} />
            ))}
            {filteredTodos.length === 0 && (
                <p className="empty-state">No todos to display</p>
            )}
        </div>
    );
}

function TodoItem({ todo, index }) {
    const { get } = useFlatState(appState, ['ui']);
    
    const isEditing = get(['editingId']) === todo.id;
    
    const toggleComplete = () => {
        appState.set(['todos', index, 'completed'], !todo.completed);
    };
    
    const deleteTodo = () => {
        appState.destroy(['todos'], index);
    };
    
    const startEditing = () => {
        appState.set(['ui', 'editingId'], todo.id);
        appState.set(['ui', 'editText'], todo.text);
    };
    
    const saveEdit = () => {
        const newText = appState.get(['ui', 'editText']).trim();
        if (newText) {
            appState.set(['todos', index, 'text'], newText);
        }
        appState.set(['ui', 'editingId'], null);
        appState.set(['ui', 'editText'], '');
    };
    
    const cancelEdit = () => {
        appState.set(['ui', 'editingId'], null);
        appState.set(['ui', 'editText'], '');
    };

    const editHandler = appState.createEventTargetPathHandler(['ui', 'editText']);

    if (isEditing) {
        return (
            <div className="todo-item editing">
                <input
                    type="text"
                    value={get(['editText'])}
                    onChange={editHandler}
                    autoFocus
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                    }}
                />
                <button onClick={saveEdit}>Save</button>
                <button onClick={cancelEdit}>Cancel</button>
            </div>
        );
    }

    return (
        <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input
                type="checkbox"
                checked={todo.completed}
                onChange={toggleComplete}
            />
            <span onClick={startEditing}>{todo.text}</span>
            <button onClick={deleteTodo}>Delete</button>
        </div>
    );
}

function TodoStats() {
    const { get } = useFlatState(appState, ['todos']);
    
    const todos = get([]) || [];
    const completedCount = todos.filter(todo => todo.completed).length;
    const totalCount = todos.length;
    const pendingCount = totalCount - completedCount;

    return (
        <div className="todo-stats">
            <span>Total: {totalCount}</span>
            <span>Completed: {completedCount}</span>
            <span>Pending: {pendingCount}</span>
        </div>
    );
}

export default TodoApp;
```

## Advanced React Patterns

### Context Provider for FlatState

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

// Create context for FlatState
const FlatStateContext = createContext();

// Provider component
export function FlatStateProvider({ state, children }) {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        state.setSetterCallback(() => {
            forceUpdate({});
        });

        return () => {
            state.setSetterCallback = null;
        };
    }, [state]);

    return (
        <FlatStateContext.Provider value={state}>
            {children}
        </FlatStateContext.Provider>
    );
}

// Hook to use FlatState from context
export function useFlatStateContext(path = null) {
    const state = useContext(FlatStateContext);
    
    if (!state) {
        throw new Error('useFlatStateContext must be used within a FlatStateProvider');
    }

    const get = (subPath = []) => {
        const fullPath = path ? [...path, ...subPath] : subPath;
        return state.get(fullPath);
    };

    const set = (subPath, value, props) => {
        const fullPath = path ? [...path, ...subPath] : subPath;
        state.set(fullPath, value, props);
    };

    return { get, set, state };
}

// Usage
function App() {
    return (
        <FlatStateProvider state={appState}>
            <UserDashboard />
        </FlatStateProvider>
    );
}

function UserDashboard() {
    const { get, set } = useFlatStateContext(['user']);
    
    return (
        <div>
            <h1>Welcome, {get(['name']) || 'Guest'}!</h1>
            <UserProfile />
            <UserSettings />
        </div>
    );
}

function UserProfile() {
    const { get } = useFlatStateContext(['user', 'profile']);
    
    // Component automatically re-renders when user.profile changes
    return (
        <div>
            <h2>Profile</h2>
            <p>Name: {get(['name'])}</p>
            <p>Email: {get(['email'])}</p>
        </div>
    );
}
```

### Form Validation with FlatState

```jsx
import React from 'react';

const formState = new FlatState({
    data: {
        name: '',
        email: '',
        age: '',
        password: '',
        confirmPassword: ''
    },
    errors: {},
    touched: {},
    isValid: false
});

// Validation rules
const validationRules = {
    name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return null;
    },
    email: (value) => {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return null;
    },
    age: (value) => {
        if (!value) return 'Age is required';
        const age = parseInt(value);
        if (isNaN(age) || age < 0 || age > 120) return 'Invalid age';
        return null;
    },
    password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return null;
    },
    confirmPassword: (value, data) => {
        if (!value) return 'Please confirm your password';
        if (value !== data.password) return 'Passwords do not match';
        return null;
    }
};

function validateField(field, value, allData) {
    const rule = validationRules[field];
    return rule ? rule(value, allData) : null;
}

function validateForm() {
    const data = formState.get(['data']);
    const errors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
        const error = validateField(field, data[field], data);
        if (error) {
            errors[field] = error;
            isValid = false;
        }
    });

    formState.set(['errors'], errors);
    formState.set(['isValid'], isValid);
}

function ValidatedForm() {
    const { get } = useFlatState(formState);

    // Set up validation on data changes
    React.useEffect(() => {
        formState.setSetterCallback((props) => {
            if (props.path[0] === 'data') {
                // Debounce validation
                setTimeout(validateForm, 100);
            }
        });
    }, []);

    const createFieldHandler = (field) => {
        return (e) => {
            const value = e.target.value;
            formState.set(['data', field], value);
            formState.set(['touched', field], true);
        };
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Mark all fields as touched
        Object.keys(validationRules).forEach(field => {
            formState.set(['touched', field], true);
        });
        
        validateForm();
        
        if (get(['isValid'])) {
            console.log('Form submitted:', get(['data']));
            // Submit form data
        }
    };

    const data = get(['data']);
    const errors = get(['errors']);
    const touched = get(['touched']);

    return (
        <form onSubmit={handleSubmit} className="validated-form">
            <FormField
                label="Name"
                type="text"
                value={data.name}
                onChange={createFieldHandler('name')}
                error={touched.name ? errors.name : null}
            />
            
            <FormField
                label="Email"
                type="email"
                value={data.email}
                onChange={createFieldHandler('email')}
                error={touched.email ? errors.email : null}
            />
            
            <FormField
                label="Age"
                type="number"
                value={data.age}
                onChange={createFieldHandler('age')}
                error={touched.age ? errors.age : null}
            />
            
            <FormField
                label="Password"
                type="password"
                value={data.password}
                onChange={createFieldHandler('password')}
                error={touched.password ? errors.password : null}
            />
            
            <FormField
                label="Confirm Password"
                type="password"
                value={data.confirmPassword}
                onChange={createFieldHandler('confirmPassword')}
                error={touched.confirmPassword ? errors.confirmPassword : null}
            />
            
            <button 
                type="submit" 
                disabled={!get(['isValid'])}
                className={get(['isValid']) ? 'valid' : 'invalid'}
            >
                Submit
            </button>
        </form>
    );
}

function FormField({ label, type, value, onChange, error }) {
    return (
        <div className={`form-field ${error ? 'error' : ''}`}>
            <label>{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
            />
            {error && <span className="error-message">{error}</span>}
        </div>
    );
}

export default ValidatedForm;
```

## Performance Optimization

### Selective Re-rendering

```jsx
import React, { memo } from 'react';

// Memoized component that only re-renders when specific paths change
const OptimizedComponent = memo(({ statePath, children }) => {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const originalCallback = appState.setterCallback;
        
        appState.setSetterCallback = (props) => {
            // Only update if the watched path changed
            if (pathStartsWith(props.path, statePath)) {
                forceUpdate({});
            }
            if (originalCallback) originalCallback(props);
        };

        return () => {
            appState.setSetterCallback = originalCallback;
        };
    }, [statePath]);

    return children;
});

function pathStartsWith(fullPath, prefix) {
    return prefix.every((segment, index) => fullPath[index] === segment);
}

// Usage
function App() {
    return (
        <div>
            <OptimizedComponent statePath={['user']}>
                <UserComponent />
            </OptimizedComponent>
            
            <OptimizedComponent statePath={['todos']}>
                <TodoList />
            </OptimizedComponent>
            
            <OptimizedComponent statePath={['ui']}>
                <UIControls />
            </OptimizedComponent>
        </div>
    );
}
```

This guide covers the essential patterns for integrating FlatState with React applications. The examples demonstrate how to create reactive components, manage complex state, and optimize performance while maintaining clean, readable code.