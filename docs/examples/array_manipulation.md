# Array Manipulation

This guide demonstrates advanced patterns for working with arrays in FlatState, including list management, sorting, filtering, and complex data structures.

## Basic Array Operations Review

```javascript
const state = new FlatState({
    items: ['apple', 'banana', 'cherry'],
    todos: [],
    users: []
});

// Basic operations
state.append(['items'], 'date');           // Add to end
state.insert(['items'], 1, 'blueberry');   // Insert at position
state.destroy(['items'], 0);               // Remove by index
const lastItem = state.pop(['items']);     // Remove and return last
const count = state.size(['items']);       // Get array length

console.log(state.get(['items'])); // ['blueberry', 'banana', 'cherry', 'date']
```

## Todo List Management

### Complete Todo Application

```javascript
const todoState = new FlatState({
    todos: [],
    filters: {
        status: 'all', // all, active, completed
        search: '',
        sortBy: 'created', // created, updated, alphabetical
        sortOrder: 'desc' // asc, desc
    },
    ui: {
        newTodoText: '',
        editingId: null,
        editText: ''
    },
    stats: {
        total: 0,
        completed: 0,
        active: 0
    }
});

// Todo management functions
class TodoManager {
    constructor(state) {
        this.state = state;
        this.nextId = 1;
        
        // Set up reactive stats calculation
        this.state.setSetterCallback((props) => {
            if (props.path[0] === 'todos') {
                this.updateStats();
            }
        });
    }

    addTodo(text) {
        if (!text.trim()) return;

        const newTodo = {
            id: this.nextId++,
            text: text.trim(),
            completed: false,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            priority: 'normal', // low, normal, high
            category: 'general',
            tags: []
        };

        this.state.append(['todos'], newTodo);
        this.state.set(['ui', 'newTodoText'], '');
    }

    toggleTodo(id) {
        const todos = this.state.get(['todos']) || [];
        const index = todos.findIndex(todo => todo.id === id);
        
        if (index !== -1) {
            const completed = !this.state.get(['todos', index, 'completed']);
            this.state.set(['todos', index, 'completed'], completed);
            this.state.set(['todos', index, 'updated'], new Date().toISOString());
        }
    }

    deleteTodo(id) {
        const todos = this.state.get(['todos']) || [];
        const index = todos.findIndex(todo => todo.id === id);
        
        if (index !== -1) {
            this.state.destroy(['todos'], index);
        }
    }

    editTodo(id, newText) {
        const todos = this.state.get(['todos']) || [];
        const index = todos.findIndex(todo => todo.id === id);
        
        if (index !== -1 && newText.trim()) {
            this.state.set(['todos', index, 'text'], newText.trim());
            this.state.set(['todos', index, 'updated'], new Date().toISOString());
        }
    }

    setPriority(id, priority) {
        const todos = this.state.get(['todos']) || [];
        const index = todos.findIndex(todo => todo.id === id);
        
        if (index !== -1) {
            this.state.set(['todos', index, 'priority'], priority);
            this.state.set(['todos', index, 'updated'], new Date().toISOString());
        }
    }

    addTag(id, tag) {
        const todos = this.state.get(['todos']) || [];
        const index = todos.findIndex(todo => todo.id === id);
        
        if (index !== -1) {
            const currentTags = this.state.get(['todos', index, 'tags']) || [];
            if (!currentTags.includes(tag)) {
                this.state.append(['todos', index, 'tags'], tag);
                this.state.set(['todos', index, 'updated'], new Date().toISOString());
            }
        }
    }

    removeTag(id, tagIndex) {
        const todos = this.state.get(['todos']) || [];
        const index = todos.findIndex(todo => todo.id === id);
        
        if (index !== -1) {
            this.state.destroy(['todos', index, 'tags'], tagIndex);
            this.state.set(['todos', index, 'updated'], new Date().toISOString());
        }
    }

    moveUp(id) {
        const todos = this.state.get(['todos']) || [];
        const index = todos.findIndex(todo => todo.id === id);
        
        if (index > 0) {
            const todo = todos[index];
            this.state.destroy(['todos'], index);
            this.state.insert(['todos'], index - 1, todo);
        }
    }

    moveDown(id) {
        const todos = this.state.get(['todos']) || [];
        const index = todos.findIndex(todo => todo.id === id);
        
        if (index < todos.length - 1) {
            const todo = todos[index];
            this.state.destroy(['todos'], index);
            this.state.insert(['todos'], index + 1, todo);
        }
    }

    getFilteredTodos() {
        const todos = this.state.get(['todos']) || [];
        const filters = this.state.get(['filters']);
        
        let filtered = todos;

        // Status filter
        if (filters.status === 'active') {
            filtered = filtered.filter(todo => !todo.completed);
        } else if (filters.status === 'completed') {
            filtered = filtered.filter(todo => todo.completed);
        }

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(todo =>
                todo.text.toLowerCase().includes(searchLower) ||
                (todo.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
            );
        }

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;
            
            switch (filters.sortBy) {
                case 'alphabetical':
                    comparison = a.text.localeCompare(b.text);
                    break;
                case 'priority':
                    const priorityOrder = { high: 3, normal: 2, low: 1 };
                    comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
                    break;
                case 'updated':
                    comparison = new Date(b.updated) - new Date(a.updated);
                    break;
                case 'created':
                default:
                    comparison = new Date(b.created) - new Date(a.created);
                    break;
            }
            
            return filters.sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }

    updateStats() {
        const todos = this.state.get(['todos']) || [];
        const total = todos.length;
        const completed = todos.filter(todo => todo.completed).length;
        const active = total - completed;

        this.state.set(['stats'], { total, completed, active });
    }

    clearCompleted() {
        const todos = this.state.get(['todos']) || [];
        // Remove from end to beginning to maintain correct indices
        for (let i = todos.length - 1; i >= 0; i--) {
            if (todos[i].completed) {
                this.state.destroy(['todos'], i);
            }
        }
    }

    completeAll() {
        const todos = this.state.get(['todos']) || [];
        const allCompleted = todos.every(todo => todo.completed);
        
        todos.forEach((todo, index) => {
            this.state.set(['todos', index, 'completed'], !allCompleted);
            this.state.set(['todos', index, 'updated'], new Date().toISOString());
        });
    }
}

// Initialize todo manager
const todoManager = new TodoManager(todoState);

// React component for todo list
function TodoApp() {
    const { get } = useFlatState(todoState);
    
    return (
        <div className="todo-app">
            <TodoHeader />
            <TodoInput />
            <TodoFilters />
            <TodoList />
            <TodoFooter />
        </div>
    );
}

function TodoInput() {
    const { get } = useFlatState(todoState, ['ui']);
    const inputHandler = todoState.createEventTargetPathHandler(['ui', 'newTodoText']);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        todoManager.addTodo(get(['newTodoText']));
    };

    return (
        <form onSubmit={handleSubmit} className="todo-input">
            <input
                type="text"
                placeholder="What needs to be done?"
                value={get(['newTodoText'])}
                onChange={inputHandler}
                className="new-todo-input"
            />
            <button type="submit">Add</button>
        </form>
    );
}

function TodoFilters() {
    const { get } = useFlatState(todoState, ['filters']);
    
    const statusHandler = todoState.createSelectEventHandler(['filters', 'status']);
    const searchHandler = todoState.createEventTargetPathHandler(['filters', 'search']);
    const sortByHandler = todoState.createSelectEventHandler(['filters', 'sortBy']);
    const sortOrderHandler = todoState.createSelectEventHandler(['filters', 'sortOrder']);

    return (
        <div className="todo-filters">
            <div className="filter-group">
                <label>Status:</label>
                <select value={get(['status'])} onChange={statusHandler}>
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            
            <div className="filter-group">
                <label>Search:</label>
                <input
                    type="text"
                    placeholder="Search todos..."
                    value={get(['search'])}
                    onChange={searchHandler}
                />
            </div>
            
            <div className="filter-group">
                <label>Sort by:</label>
                <select value={get(['sortBy'])} onChange={sortByHandler}>
                    <option value="created">Created Date</option>
                    <option value="updated">Updated Date</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="priority">Priority</option>
                </select>
                
                <select value={get(['sortOrder'])} onChange={sortOrderHandler}>
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>
            </div>
        </div>
    );
}

function TodoList() {
    const filteredTodos = todoManager.getFilteredTodos();
    
    return (
        <div className="todo-list">
            {filteredTodos.map(todo => (
                <TodoItem key={todo.id} todo={todo} />
            ))}
            {filteredTodos.length === 0 && (
                <div className="empty-state">No todos found</div>
            )}
        </div>
    );
}

function TodoItem({ todo }) {
    const { get } = useFlatState(todoState, ['ui']);
    const isEditing = get(['editingId']) === todo.id;
    
    const startEdit = () => {
        todoState.set(['ui', 'editingId'], todo.id);
        todoState.set(['ui', 'editText'], todo.text);
    };
    
    const saveEdit = () => {
        todoManager.editTodo(todo.id, get(['editText']));
        todoState.set(['ui', 'editingId'], null);
    };
    
    const cancelEdit = () => {
        todoState.set(['ui', 'editingId'], null);
    };

    if (isEditing) {
        return (
            <div className="todo-item editing">
                <input
                    type="text"
                    value={get(['editText'])}
                    onChange={todoState.createEventTargetPathHandler(['ui', 'editText'])}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                    }}
                    autoFocus
                />
                <button onClick={saveEdit}>Save</button>
                <button onClick={cancelEdit}>Cancel</button>
            </div>
        );
    }

    return (
        <div className={`todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}`}>
            <div className="todo-main">
                <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => todoManager.toggleTodo(todo.id)}
                />
                <span className="todo-text" onClick={startEdit}>
                    {todo.text}
                </span>
                <div className="todo-tags">
                    {(todo.tags || []).map((tag, index) => (
                        <span key={index} className="tag">
                            {tag}
                            <button 
                                onClick={() => todoManager.removeTag(todo.id, index)}
                                className="remove-tag"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            </div>
            
            <div className="todo-actions">
                <select
                    value={todo.priority}
                    onChange={(e) => todoManager.setPriority(todo.id, e.target.value)}
                >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                </select>
                
                <button onClick={() => todoManager.moveUp(todo.id)}>↑</button>
                <button onClick={() => todoManager.moveDown(todo.id)}>↓</button>
                <button onClick={() => todoManager.deleteTodo(todo.id)}>Delete</button>
            </div>
        </div>
    );
}

function TodoFooter() {
    const { get } = useFlatState(todoState, ['stats']);
    const stats = get([]);
    
    return (
        <div className="todo-footer">
            <div className="stats">
                <span>Total: {stats.total}</span>
                <span>Active: {stats.active}</span>
                <span>Completed: {stats.completed}</span>
            </div>
            
            <div className="bulk-actions">
                <button onClick={() => todoManager.completeAll()}>
                    Toggle All
                </button>
                <button onClick={() => todoManager.clearCompleted()}>
                    Clear Completed
                </button>
            </div>
        </div>
    );
}
```

## Shopping Cart Management

### E-commerce Cart with Complex Items

```javascript
const cartState = new FlatState({
    items: [],
    summary: {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        itemCount: 0
    },
    settings: {
        taxRate: 0.08,
        freeShippingThreshold: 50,
        shippingRate: 5.99
    }
});

class CartManager {
    constructor(state) {
        this.state = state;
        
        // Auto-calculate totals when items change
        this.state.setSetterCallback((props) => {
            if (props.path[0] === 'items') {
                this.calculateTotals();
            }
        });
    }

    addItem(product, quantity = 1, options = {}) {
        const items = this.state.get(['items']) || [];
        
        // Check if item with same product and options already exists
        const existingIndex = items.findIndex(item =>
            item.productId === product.id &&
            JSON.stringify(item.options) === JSON.stringify(options)
        );

        if (existingIndex !== -1) {
            // Update quantity of existing item
            const currentQty = this.state.get(['items', existingIndex, 'quantity']);
            this.state.set(['items', existingIndex, 'quantity'], currentQty + quantity);
        } else {
            // Add new item
            const cartItem = {
                id: Date.now(),
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                options: options, // size, color, etc.
                image: product.image,
                addedAt: new Date().toISOString()
            };
            
            this.state.append(['items'], cartItem);
        }
    }

    removeItem(itemId) {
        const items = this.state.get(['items']) || [];
        const index = items.findIndex(item => item.id === itemId);
        
        if (index !== -1) {
            this.state.destroy(['items'], index);
        }
    }

    updateQuantity(itemId, quantity) {
        const items = this.state.get(['items']) || [];
        const index = items.findIndex(item => item.id === itemId);
        
        if (index !== -1) {
            if (quantity <= 0) {
                this.removeItem(itemId);
            } else {
                this.state.set(['items', index, 'quantity'], quantity);
            }
        }
    }

    updateOptions(itemId, options) {
        const items = this.state.get(['items']) || [];
        const index = items.findIndex(item => item.id === itemId);
        
        if (index !== -1) {
            this.state.set(['items', index, 'options'], options);
        }
    }

    moveItem(fromIndex, toIndex) {
        const items = this.state.get(['items']) || [];
        
        if (fromIndex >= 0 && fromIndex < items.length &&
            toIndex >= 0 && toIndex < items.length) {
            
            const item = items[fromIndex];
            this.state.destroy(['items'], fromIndex);
            this.state.insert(['items'], toIndex, item);
        }
    }

    clearCart() {
        this.state.set(['items'], []);
    }

    calculateTotals() {
        const items = this.state.get(['items']) || [];
        const settings = this.state.get(['settings']);
        
        const subtotal = items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        const tax = subtotal * settings.taxRate;
        
        const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingRate;
        
        const total = subtotal + tax + shipping;
        
        const itemCount = items.reduce((count, item) => count + item.quantity, 0);
        
        this.state.set(['summary'], {
            subtotal: Number(subtotal.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            shipping: Number(shipping.toFixed(2)),
            total: Number(total.toFixed(2)),
            itemCount
        });
    }

    applyCoupon(couponCode) {
        // Implement coupon logic
        const validCoupons = {
            'SAVE10': { type: 'percentage', value: 0.1 },
            'FREESHIP': { type: 'freeShipping' },
            'SAVE5': { type: 'fixed', value: 5 }
        };
        
        const coupon = validCoupons[couponCode];
        if (coupon) {
            this.state.set(['coupon'], coupon);
            this.calculateTotals();
            return true;
        }
        return false;
    }

    getItemsByCategory() {
        const items = this.state.get(['items']) || [];
        const categorized = {};
        
        items.forEach(item => {
            const category = item.category || 'Other';
            if (!categorized[category]) {
                categorized[category] = [];
            }
            categorized[category].push(item);
        });
        
        return categorized;
    }
}

const cartManager = new CartManager(cartState);

// React Components
function ShoppingCart() {
    const { get } = useFlatState(cartState);
    
    return (
        <div className="shopping-cart">
            <CartHeader />
            <CartItems />
            <CartSummary />
            <CartActions />
        </div>
    );
}

function CartItems() {
    const { get } = useFlatState(cartState, ['items']);
    const items = get([]) || [];
    
    if (items.length === 0) {
        return <div className="empty-cart">Your cart is empty</div>;
    }
    
    return (
        <div className="cart-items">
            {items.map((item, index) => (
                <CartItem key={item.id} item={item} index={index} />
            ))}
        </div>
    );
}

function CartItem({ item, index }) {
    const updateQuantity = (newQuantity) => {
        cartManager.updateQuantity(item.id, parseInt(newQuantity));
    };
    
    const removeItem = () => {
        cartManager.removeItem(item.id);
    };
    
    const moveUp = () => {
        cartManager.moveItem(index, index - 1);
    };
    
    const moveDown = () => {
        cartManager.moveItem(index, index + 1);
    };

    return (
        <div className="cart-item">
            <img src={item.image} alt={item.name} className="item-image" />
            
            <div className="item-details">
                <h3>{item.name}</h3>
                <div className="item-options">
                    {Object.entries(item.options || {}).map(([key, value]) => (
                        <span key={key} className="option">
                            {key}: {value}
                        </span>
                    ))}
                </div>
                <div className="item-price">${item.price}</div>
            </div>
            
            <div className="item-controls">
                <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.quantity - 1)}>-</button>
                    <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(e.target.value)}
                        min="1"
                    />
                    <button onClick={() => updateQuantity(item.quantity + 1)}>+</button>
                </div>
                
                <div className="item-actions">
                    <button onClick={moveUp} disabled={index === 0}>↑</button>
                    <button onClick={moveDown}>↓</button>
                    <button onClick={removeItem} className="remove-btn">Remove</button>
                </div>
            </div>
            
            <div className="item-total">
                ${(item.price * item.quantity).toFixed(2)}
            </div>
        </div>
    );
}

function CartSummary() {
    const { get } = useFlatState(cartState, ['summary']);
    const summary = get([]);
    
    return (
        <div className="cart-summary">
            <div className="summary-line">
                <span>Subtotal ({summary.itemCount} items):</span>
                <span>${summary.subtotal}</span>
            </div>
            <div className="summary-line">
                <span>Tax:</span>
                <span>${summary.tax}</span>
            </div>
            <div className="summary-line">
                <span>Shipping:</span>
                <span>
                    {summary.shipping === 0 ? 'FREE' : `$${summary.shipping}`}
                </span>
            </div>
            <div className="summary-line total">
                <span>Total:</span>
                <span>${summary.total}</span>
            </div>
        </div>
    );
}
```

## Data Table with Sorting and Filtering

### Advanced Data Management

```javascript
const tableState = new FlatState({
    data: [],
    originalData: [],
    columns: [
        { key: 'name', label: 'Name', sortable: true, filterable: true },
        { key: 'email', label: 'Email', sortable: true, filterable: true },
        { key: 'age', label: 'Age', sortable: true, filterable: false, type: 'number' },
        { key: 'department', label: 'Department', sortable: true, filterable: true },
        { key: 'salary', label: 'Salary', sortable: true, filterable: false, type: 'currency' }
    ],
    sorting: {
        column: null,
        direction: 'asc' // asc or desc
    },
    filtering: {
        global: '',
        columns: {}
    },
    pagination: {
        page: 1,
        pageSize: 10,
        totalPages: 1,
        totalRecords: 0
    },
    selection: {
        selected: [],
        selectAll: false
    }
});

class DataTableManager {
    constructor(state) {
        this.state = state;
        this.setupReactiveUpdates();
    }

    setupReactiveUpdates() {
        this.state.setSetterCallback((props) => {
            if (props.path[0] === 'sorting' || 
                props.path[0] === 'filtering' ||
                props.path[0] === 'pagination') {
                this.applyFiltersAndSort();
            }
        });
    }

    loadData(data) {
        this.state.set(['originalData'], data);
        this.state.set(['data'], data);
        this.updatePagination();
    }

    addRow(rowData) {
        this.state.append(['originalData'], {
            id: Date.now(),
            ...rowData
        });
        this.applyFiltersAndSort();
    }

    updateRow(id, updates) {
        const data = this.state.get(['originalData']) || [];
        const index = data.findIndex(row => row.id === id);
        
        if (index !== -1) {
            Object.keys(updates).forEach(key => {
                this.state.set(['originalData', index, key], updates[key]);
            });
            this.applyFiltersAndSort();
        }
    }

    deleteRow(id) {
        const data = this.state.get(['originalData']) || [];
        const index = data.findIndex(row => row.id === id);
        
        if (index !== -1) {
            this.state.destroy(['originalData'], index);
            this.applyFiltersAndSort();
        }
    }

    deleteSelected() {
        const selected = this.state.get(['selection', 'selected']) || [];
        const data = this.state.get(['originalData']) || [];
        
        // Sort selected IDs in descending index order for safe removal
        const indices = selected
            .map(id => data.findIndex(row => row.id === id))
            .filter(index => index !== -1)
            .sort((a, b) => b - a);
        
        indices.forEach(index => {
            this.state.destroy(['originalData'], index);
        });
        
        this.state.set(['selection', 'selected'], []);
        this.state.set(['selection', 'selectAll'], false);
        this.applyFiltersAndSort();
    }

    sort(column) {
        const currentSort = this.state.get(['sorting']);
        
        if (currentSort.column === column) {
            // Toggle direction
            const newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
            this.state.set(['sorting', 'direction'], newDirection);
        } else {
            // New column
            this.state.set(['sorting', 'column'], column);
            this.state.set(['sorting', 'direction'], 'asc');
        }
    }

    filter(column, value) {
        if (column === 'global') {
            this.state.set(['filtering', 'global'], value);
        } else {
            this.state.set(['filtering', 'columns', column], value);
        }
        this.state.set(['pagination', 'page'], 1); // Reset to first page
    }

    applyFiltersAndSort() {
        let data = [...(this.state.get(['originalData']) || [])];
        
        // Apply filters
        data = this.applyFilters(data);
        
        // Apply sorting
        data = this.applySorting(data);
        
        this.state.set(['data'], data);
        this.updatePagination();
    }

    applyFilters(data) {
        const filtering = this.state.get(['filtering']);
        
        // Global filter
        if (filtering.global) {
            const globalTerm = filtering.global.toLowerCase();
            data = data.filter(row =>
                Object.values(row).some(value =>
                    String(value).toLowerCase().includes(globalTerm)
                )
            );
        }
        
        // Column filters
        Object.entries(filtering.columns || {}).forEach(([column, value]) => {
            if (value) {
                const filterTerm = value.toLowerCase();
                data = data.filter(row =>
                    String(row[column]).toLowerCase().includes(filterTerm)
                );
            }
        });
        
        return data;
    }

    applySorting(data) {
        const sorting = this.state.get(['sorting']);
        
        if (!sorting.column) return data;
        
        return data.sort((a, b) => {
            const aVal = a[sorting.column];
            const bVal = b[sorting.column];
            
            let comparison = 0;
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = aVal - bVal;
            } else {
                comparison = String(aVal).localeCompare(String(bVal));
            }
            
            return sorting.direction === 'asc' ? comparison : -comparison;
        });
    }

    updatePagination() {
        const data = this.state.get(['data']) || [];
        const pageSize = this.state.get(['pagination', 'pageSize']);
        const totalRecords = data.length;
        const totalPages = Math.ceil(totalRecords / pageSize);
        
        this.state.set(['pagination', 'totalRecords'], totalRecords);
        this.state.set(['pagination', 'totalPages'], totalPages);
        
        // Ensure current page is valid
        const currentPage = this.state.get(['pagination', 'page']);
        if (currentPage > totalPages && totalPages > 0) {
            this.state.set(['pagination', 'page'], totalPages);
        }
    }

    changePage(page) {
        const totalPages = this.state.get(['pagination', 'totalPages']);
        if (page >= 1 && page <= totalPages) {
            this.state.set(['pagination', 'page'], page);
        }
    }

    changePageSize(pageSize) {
        this.state.set(['pagination', 'pageSize'], pageSize);
        this.state.set(['pagination', 'page'], 1);
        this.updatePagination();
    }

    toggleRowSelection(id) {
        const selected = this.state.get(['selection', 'selected']) || [];
        const index = selected.indexOf(id);
        
        if (index === -1) {
            this.state.append(['selection', 'selected'], id);
        } else {
            this.state.destroy(['selection', 'selected'], index);
        }
        
        this.updateSelectAllState();
    }

    toggleSelectAll() {
        const selectAll = this.state.get(['selection', 'selectAll']);
        
        if (selectAll) {
            this.state.set(['selection', 'selected'], []);
        } else {
            const visibleData = this.getPaginatedData();
            const allIds = visibleData.map(row => row.id);
            this.state.set(['selection', 'selected'], allIds);
        }
        
        this.state.set(['selection', 'selectAll'], !selectAll);
    }

    updateSelectAllState() {
        const selected = this.state.get(['selection', 'selected']) || [];
        const visibleData = this.getPaginatedData();
        const allVisible = visibleData.every(row => selected.includes(row.id));
        
        this.state.set(['selection', 'selectAll'], allVisible && visibleData.length > 0);
    }

    getPaginatedData() {
        const data = this.state.get(['data']) || [];
        const pagination = this.state.get(['pagination']);
        
        const startIndex = (pagination.page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        
        return data.slice(startIndex, endIndex);
    }

    exportData(format = 'json') {
        const data = this.state.get(['data']) || [];
        
        switch (format) {
            case 'csv':
                return this.exportToCSV(data);
            case 'json':
            default:
                return JSON.stringify(data, null, 2);
        }
    }

    exportToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header =>
                    JSON.stringify(row[header] || '')
                ).join(',')
            )
        ].join('\n');
        
        return csvContent;
    }
}

// Initialize table manager
const tableManager = new DataTableManager(tableState);

// Load sample data
tableManager.loadData([
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, department: 'Engineering', salary: 75000 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 28, department: 'Marketing', salary: 65000 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, department: 'Sales', salary: 70000 }
]);
```

This comprehensive guide demonstrates advanced array manipulation patterns in FlatState, from simple todo lists to complex data tables with sorting, filtering, and pagination. These examples show how FlatState's array operations can handle sophisticated data management scenarios while maintaining clean, reactive code.