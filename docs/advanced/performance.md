# Performance Optimization

This guide covers best practices and techniques for optimizing FlatState performance in large applications.

## Understanding FlatState Performance Characteristics

### Memory and Reference Management

FlatState operates directly on JavaScript objects and arrays, which means:

- **Shared References**: SubStates share the same underlying data
- **Direct Mutations**: Changes are applied directly to the data structure
- **No Immutability Overhead**: Unlike some state management libraries, FlatState doesn't create new objects on every change
- **Callback Efficiency**: Single callback function handles all state changes

```javascript
// FlatState uses direct mutations - efficient memory usage
const state = new FlatState({
    users: new Array(10000).fill(null).map((_, i) => ({
        id: i,
        name: `User ${i}`,
        active: true
    }))
});

// This modifies the existing object directly - no copying
state.set(['users', 5000, 'active'], false);

// Memory usage remains constant regardless of data size
console.log('Memory efficient - no object copying');
```

## Callback Optimization

### Selective Re-rendering

The most important performance optimization is controlling when and what re-renders:

```javascript
class OptimizedStateManager {
    constructor(state) {
        this.state = state;
        this.subscribers = new Map();
        this.batchedUpdates = new Set();
        this.updateScheduled = false;
        
        this.state.setSetterCallback((props) => {
            this.handleStateChange(props);
        });
    }

    // Subscribe to specific path changes only
    subscribe(pathPattern, callback) {
        const id = Date.now() + Math.random();
        this.subscribers.set(id, { pathPattern, callback });
        
        return () => {
            this.subscribers.delete(id);
        };
    }

    handleStateChange(props) {
        // Find matching subscribers
        this.subscribers.forEach(({ pathPattern, callback }) => {
            if (this.pathMatches(props.path, pathPattern)) {
                this.batchedUpdates.add(callback);
            }
        });
        
        // Batch updates to next tick
        if (!this.updateScheduled) {
            this.updateScheduled = true;
            
            requestAnimationFrame(() => {
                this.batchedUpdates.forEach(callback => {
                    try {
                        callback(props);
                    } catch (error) {
                        console.error('Subscriber callback error:', error);
                    }
                });
                
                this.batchedUpdates.clear();
                this.updateScheduled = false;
            });
        }
    }

    pathMatches(changePath, pattern) {
        if (!pattern || pattern.length === 0) return true;
        
        return pattern.every((segment, index) => {
            if (segment === '*') return true;
            if (segment === '**') return true; // Wildcard for any depth
            return changePath[index] === segment;
        });
    }
}

// Usage
const state = new FlatState({ /* large data structure */ });
const manager = new OptimizedStateManager(state);

// Only subscribe to user changes
const unsubscribeUsers = manager.subscribe(['users'], () => {
    console.log('Users changed');
    updateUserUI();
});

// Only subscribe to specific user
const unsubscribeUserProfile = manager.subscribe(['users', 123, 'profile'], () => {
    console.log('User 123 profile changed');
    updateUserProfile(123);
});

// Wildcard subscriptions
const unsubscribeAllNames = manager.subscribe(['users', '*', 'name'], () => {
    console.log('Some user name changed');
    updateUserList();
});
```

### React Optimization Patterns

```jsx
import React, { memo, useMemo, useCallback } from 'react';

// Memoized component that only re-renders when specific data changes
const OptimizedUserList = memo(({ userIds, onUserClick }) => {
    console.log('UserList rendering');
    
    return (
        <div className="user-list">
            {userIds.map(userId => (
                <OptimizedUserItem 
                    key={userId} 
                    userId={userId} 
                    onClick={onUserClick}
                />
            ))}
        </div>
    );
});

// Individual user component with its own subscription
const OptimizedUserItem = memo(({ userId, onClick }) => {
    const [userState] = useState(() => new UserState(userId));
    
    const user = userState.getUser();
    
    const handleClick = useCallback(() => {
        onClick(userId);
    }, [userId, onClick]);
    
    console.log(`UserItem ${userId} rendering`);
    
    return (
        <div className="user-item" onClick={handleClick}>
            <img src={user.avatar} alt={user.name} />
            <span>{user.name}</span>
            <span className={user.online ? 'online' : 'offline'}>
                {user.online ? 'Online' : 'Offline'}
            </span>
        </div>
    );
});

// Dedicated state manager for individual users
class UserState {
    constructor(userId) {
        this.userId = userId;
        this.forceUpdate = null;
        
        // Subscribe only to this user's changes
        this.unsubscribe = globalState.subscribe(['users', userId], () => {
            if (this.forceUpdate) {
                this.forceUpdate({});
            }
        });
    }

    setForceUpdate(forceUpdate) {
        this.forceUpdate = forceUpdate;
    }

    getUser() {
        return globalState.get(['users', this.userId]) || {};
    }

    updateUser(updates) {
        Object.keys(updates).forEach(key => {
            globalState.set(['users', this.userId, key], updates[key]);
        });
    }

    cleanup() {
        this.unsubscribe();
    }
}

// Hook for user state
function useUserState(userId) {
    const [, forceUpdate] = useState({});
    const userState = useMemo(() => new UserState(userId), [userId]);
    
    useEffect(() => {
        userState.setForceUpdate(forceUpdate);
        return () => userState.cleanup();
    }, [userState]);
    
    return userState;
}
```

## Large Dataset Optimization

### Virtual Scrolling with FlatState

```javascript
const virtualListState = new FlatState({
    items: [], // All items
    virtualizedItems: [], // Currently visible items
    scrollTop: 0,
    containerHeight: 400,
    itemHeight: 50,
    visibleRange: { start: 0, end: 0 },
    bufferSize: 5 // Extra items to render for smooth scrolling
});

class VirtualListManager {
    constructor(state) {
        this.state = state;
        this.setupVirtualization();
    }

    setupVirtualization() {
        this.state.setSetterCallback((props) => {
            if (props.path[0] === 'scrollTop' || 
                props.path[0] === 'containerHeight') {
                this.updateVisibleRange();
            }
        });
    }

    loadItems(items) {
        this.state.set(['items'], items);
        this.updateVisibleRange();
    }

    updateVisibleRange() {
        const scrollTop = this.state.get(['scrollTop']);
        const containerHeight = this.state.get(['containerHeight']);
        const itemHeight = this.state.get(['itemHeight']);
        const bufferSize = this.state.get(['bufferSize']);
        const totalItems = this.state.size(['items']);

        const startIndex = Math.max(0, 
            Math.floor(scrollTop / itemHeight) - bufferSize
        );
        
        const endIndex = Math.min(totalItems - 1,
            Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize
        );

        this.state.set(['visibleRange'], { start: startIndex, end: endIndex });
        this.updateVirtualizedItems();
    }

    updateVirtualizedItems() {
        const items = this.state.get(['items']) || [];
        const range = this.state.get(['visibleRange']);
        
        const virtualizedItems = [];
        for (let i = range.start; i <= range.end && i < items.length; i++) {
            virtualizedItems.push({
                ...items[i],
                index: i,
                top: i * this.state.get(['itemHeight'])
            });
        }
        
        this.state.set(['virtualizedItems'], virtualizedItems);
    }

    handleScroll(scrollTop) {
        this.state.set(['scrollTop'], scrollTop);
    }

    // Optimized item updates
    updateItem(index, updates) {
        const items = this.state.get(['items']);
        if (index >= 0 && index < items.length) {
            // Only update if item is currently visible
            const range = this.state.get(['visibleRange']);
            if (index >= range.start && index <= range.end) {
                // Direct update for visible items
                Object.keys(updates).forEach(key => {
                    this.state.set(['items', index, key], updates[key]);
                });
                this.updateVirtualizedItems();
            } else {
                // Batch update for non-visible items
                Object.keys(updates).forEach(key => {
                    this.state.set(['items', index, key], updates[key]);
                });
            }
        }
    }
}

// React component for virtual list
function VirtualList({ items, renderItem }) {
    const containerRef = useRef();
    const [manager] = useState(() => new VirtualListManager(virtualListState));
    const { get } = useFlatState(virtualListState);
    
    useEffect(() => {
        manager.loadItems(items);
    }, [items, manager]);
    
    const handleScroll = useCallback((e) => {
        manager.handleScroll(e.target.scrollTop);
    }, [manager]);
    
    const virtualizedItems = get(['virtualizedItems']) || [];
    const totalHeight = (get(['items']) || []).length * get(['itemHeight']);
    
    return (
        <div 
            ref={containerRef}
            className="virtual-list-container"
            style={{ 
                height: get(['containerHeight']),
                overflow: 'auto'
            }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {virtualizedItems.map(item => (
                    <div
                        key={item.id}
                        style={{
                            position: 'absolute',
                            top: item.top,
                            height: get(['itemHeight']),
                            width: '100%'
                        }}
                    >
                        {renderItem(item, item.index)}
                    </div>
                ))}
            </div>
        </div>
    );
}
```

## Efficient Array Operations

### Batch Operations

```javascript
class BatchOperationManager {
    constructor(state) {
        this.state = state;
        this.batchQueue = [];
        this.batchScheduled = false;
    }

    // Batch multiple array operations
    batchArrayOperations(operations) {
        this.batchQueue.push(...operations);
        
        if (!this.batchScheduled) {
            this.batchScheduled = true;
            
            // Use setTimeout to batch operations
            setTimeout(() => {
                this.executeBatch();
                this.batchScheduled = false;
            }, 0);
        }
    }

    executeBatch() {
        // Disable callbacks during batch operations
        const originalCallback = this.state.setterCallback;
        this.state.setterCallback = null;
        
        try {
            // Sort operations: deletions from end to start, insertions from start to end
            const deletions = this.batchQueue
                .filter(op => op.type === 'delete')
                .sort((a, b) => b.index - a.index);
            
            const insertions = this.batchQueue
                .filter(op => op.type === 'insert')
                .sort((a, b) => a.index - b.index);
            
            const updates = this.batchQueue
                .filter(op => op.type === 'update');
            
            // Execute operations in order
            deletions.forEach(op => {
                this.state.destroy(op.path, op.index);
            });
            
            insertions.forEach(op => {
                this.state.insert(op.path, op.index, op.value);
            });
            
            updates.forEach(op => {
                this.state.set([...op.path, op.index, ...op.subPath], op.value);
            });
            
        } finally {
            // Re-enable callbacks and trigger once
            this.state.setterCallback = originalCallback;
            if (originalCallback) {
                originalCallback({ path: ['batch'], value: 'completed' });
            }
            
            this.batchQueue = [];
        }
    }

    // Optimized bulk insert
    bulkInsert(path, items, startIndex = -1) {
        const operations = items.map((item, i) => ({
            type: 'insert',
            path,
            index: startIndex === -1 ? -1 : startIndex + i,
            value: item
        }));
        
        this.batchArrayOperations(operations);
    }

    // Optimized bulk delete
    bulkDelete(path, indices) {
        const operations = indices.map(index => ({
            type: 'delete',
            path,
            index
        }));
        
        this.batchArrayOperations(operations);
    }

    // Optimized bulk update
    bulkUpdate(path, updates) {
        const operations = updates.map(({ index, subPath, value }) => ({
            type: 'update',
            path,
            index,
            subPath,
            value
        }));
        
        this.batchArrayOperations(operations);
    }
}

// Usage example
const batchManager = new BatchOperationManager(state);

// Instead of individual operations:
// items.forEach((item, index) => {
//     state.set(['todos', index, 'completed'], true);
// });

// Use batch operations:
batchManager.bulkUpdate(['todos'], 
    items.map((_, index) => ({
        index,
        subPath: ['completed'],
        value: true
    }))
);
```

## Memory Management

### Cleanup and Garbage Collection

```javascript
class StateCleanupManager {
    constructor() {
        this.subscriptions = new Set();
        this.timers = new Set();
        this.observers = new Set();
    }

    // Track subscriptions for cleanup
    addSubscription(unsubscribe) {
        this.subscriptions.add(unsubscribe);
        return unsubscribe;
    }

    // Track timers for cleanup
    addTimer(timerId) {
        this.timers.add(timerId);
        return timerId;
    }

    // Cleanup all resources
    cleanup() {
        // Clear subscriptions
        this.subscriptions.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.error('Subscription cleanup error:', error);
            }
        });
        this.subscriptions.clear();

        // Clear timers
        this.timers.forEach(timerId => {
            clearTimeout(timerId);
            clearInterval(timerId);
        });
        this.timers.clear();

        // Clear observers
        this.observers.forEach(observer => {
            try {
                observer.disconnect();
            } catch (error) {
                console.error('Observer cleanup error:', error);
            }
        });
        this.observers.clear();
    }
}

// Component cleanup pattern
function useStateCleanup() {
    const cleanupManager = useRef(new StateCleanupManager());
    
    useEffect(() => {
        return () => {
            cleanupManager.current.cleanup();
        };
    }, []);
    
    return cleanupManager.current;
}

// Usage in component
function UserDashboard() {
    const cleanup = useStateCleanup();
    
    useEffect(() => {
        // Track subscription
        const unsubscribe = globalState.subscribe(['users'], updateUsers);
        cleanup.addSubscription(unsubscribe);
        
        // Track timer
        const timerId = setInterval(refreshData, 30000);
        cleanup.addTimer(timerId);
        
        // Track intersection observer
        const observer = new IntersectionObserver(handleIntersection);
        cleanup.observers.add(observer);
        
    }, [cleanup]);
    
    return <div>User Dashboard</div>;
}
```

## Profiling and Monitoring

### Performance Monitoring

```javascript
class StatePerformanceMonitor {
    constructor(state) {
        this.state = state;
        this.metrics = {
            setOperations: 0,
            callbackExecutions: 0,
            averageCallbackTime: 0,
            slowCallbacks: [],
            pathHitCount: new Map()
        };
        
        this.setupMonitoring();
    }

    setupMonitoring() {
        const originalCallback = this.state.setterCallback;
        
        this.state.setSetterCallback = (props) => {
            const startTime = performance.now();
            
            // Track path usage
            const pathKey = props.path.join('.');
            this.metrics.pathHitCount.set(pathKey, 
                (this.metrics.pathHitCount.get(pathKey) || 0) + 1
            );
            
            this.metrics.setOperations++;
            
            if (originalCallback) {
                try {
                    originalCallback(props);
                } catch (error) {
                    console.error('Callback error:', error);
                }
            }
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            this.metrics.callbackExecutions++;
            this.updateAverageTime(executionTime);
            
            // Track slow callbacks
            if (executionTime > 16) { // Slower than 60fps
                this.metrics.slowCallbacks.push({
                    path: props.path,
                    time: executionTime,
                    timestamp: Date.now()
                });
                
                // Keep only recent slow callbacks
                if (this.metrics.slowCallbacks.length > 100) {
                    this.metrics.slowCallbacks = this.metrics.slowCallbacks.slice(-50);
                }
            }
        };
    }

    updateAverageTime(newTime) {
        const count = this.metrics.callbackExecutions;
        const currentAvg = this.metrics.averageCallbackTime;
        this.metrics.averageCallbackTime = (currentAvg * (count - 1) + newTime) / count;
    }

    getMetrics() {
        return {
            ...this.metrics,
            hotPaths: this.getHotPaths(),
            performanceIssues: this.getPerformanceIssues()
        };
    }

    getHotPaths() {
        return Array.from(this.metrics.pathHitCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }

    getPerformanceIssues() {
        const issues = [];
        
        if (this.metrics.averageCallbackTime > 5) {
            issues.push({
                type: 'slow_callbacks',
                message: `Average callback time is ${this.metrics.averageCallbackTime.toFixed(2)}ms`,
                severity: 'warning'
            });
        }
        
        if (this.metrics.slowCallbacks.length > 10) {
            issues.push({
                type: 'frequent_slow_callbacks',
                message: `${this.metrics.slowCallbacks.length} slow callbacks detected`,
                severity: 'error'
            });
        }
        
        const memoryUsage = this.estimateMemoryUsage();
        if (memoryUsage > 10000000) { // 10MB
            issues.push({
                type: 'high_memory_usage',
                message: `Estimated memory usage: ${(memoryUsage / 1000000).toFixed(2)}MB`,
                severity: 'warning'
            });
        }
        
        return issues;
    }

    estimateMemoryUsage() {
        // Rough estimation of state size
        return JSON.stringify(this.state.getState()).length * 2; // UTF-16
    }

    resetMetrics() {
        this.metrics = {
            setOperations: 0,
            callbackExecutions: 0,
            averageCallbackTime: 0,
            slowCallbacks: [],
            pathHitCount: new Map()
        };
    }
}

// Usage
const performanceMonitor = new StatePerformanceMonitor(globalState);

// Check performance periodically
setInterval(() => {
    const metrics = performanceMonitor.getMetrics();
    console.log('FlatState Performance Metrics:', metrics);
    
    if (metrics.performanceIssues.length > 0) {
        console.warn('Performance Issues Detected:', metrics.performanceIssues);
    }
}, 30000);
```

## Best Practices Summary

### Do's and Don'ts

```javascript
// ✅ DO: Use specific path subscriptions
manager.subscribe(['users', userId], callback);

// ❌ DON'T: Subscribe to everything
manager.subscribe([], callback);

// ✅ DO: Batch array operations
batchManager.bulkUpdate(path, updates);

// ❌ DON'T: Loop individual updates
items.forEach(item => state.set(path, item));

// ✅ DO: Use virtualization for large lists
<VirtualList items={largeArray} />

// ❌ DON'T: Render all items at once
{largeArray.map(item => <Item />)}

// ✅ DO: Clean up subscriptions
useEffect(() => {
    const unsubscribe = state.subscribe(path, callback);
    return unsubscribe;
}, []);

// ❌ DON'T: Leave subscriptions hanging
useEffect(() => {
    state.subscribe(path, callback);
}, []);

// ✅ DO: Use memo for expensive components
const ExpensiveComponent = memo(({ data }) => {
    return <ComplexVisualization data={data} />;
});

// ❌ DON'T: Re-render unnecessary components
function App() {
    const allData = state.getState(); // Re-renders on any change
    return <ExpensiveComponent data={allData} />;
}
```

### Performance Checklist

1. **Subscription Management**
   - [ ] Subscribe only to needed paths
   - [ ] Clean up subscriptions on component unmount
   - [ ] Use wildcard patterns efficiently

2. **Array Operations**
   - [ ] Batch multiple operations
   - [ ] Use virtual scrolling for large lists
   - [ ] Sort deletion operations from end to start

3. **Component Optimization**
   - [ ] Use React.memo for expensive components
   - [ ] Implement proper shouldComponentUpdate logic
   - [ ] Avoid unnecessary re-renders

4. **Memory Management**
   - [ ] Clean up timers and observers
   - [ ] Remove unused event listeners
   - [ ] Monitor memory usage in production

5. **Monitoring**
   - [ ] Track callback execution times
   - [ ] Monitor hot paths
   - [ ] Set up performance alerts

Following these optimization techniques will ensure FlatState performs well even with large datasets and complex applications.