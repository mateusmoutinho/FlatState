# SubState Management

SubState is a powerful feature of FlatState that allows you to create isolated state instances that operate on a specific portion of your main state. This is particularly useful for component-based architectures where you want to give components their own state scope while maintaining connection to the global state.

## Creating SubStates

### `subState(path)`

Creates a new FlatState instance that operates on a subset of the current state.

**Parameters:**
- `path` (Array): Path to the object that will become the root of the substate

**Returns:**
- `FlatState`: New FlatState instance with the specified object as its root

**Throws:**
- `Error`: If the target at path is not a non-null object

**Key Features:**
- **Inherited Callbacks**: SubState inherits the parent's setter callback
- **Shared Reference**: Changes to substate directly affect the original state
- **Independent Operations**: SubState can be used like any FlatState instance
- **Nested SubStates**: You can create substates of substates

## Basic SubState Usage

```javascript
const state = new FlatState({
    app: {
        user: {
            profile: {
                name: 'John Doe',
                email: 'john@example.com',
                preferences: {
                    theme: 'dark',
                    notifications: true
                }
            },
            settings: {
                language: 'en',
                timezone: 'UTC'
            }
        },
        ui: {
            sidebar: { open: false },
            modal: { visible: false }
        }
    }
});

// Create substate for user management
const userState = state.subState(['app', 'user']);

// Create substate for profile within user
const profileState = userState.subState(['profile']);

// Create substate for UI management
const uiState = state.subState(['app', 'ui']);

// Operations on substate affect original state
profileState.set(['name'], 'Jane Doe');
console.log(state.get(['app', 'user', 'profile', 'name'])); // 'Jane Doe'

// SubState operations use relative paths
uiState.set(['sidebar', 'open'], true);
console.log(state.get(['app', 'ui', 'sidebar', 'open'])); // true
```

## Component-Based Architecture

SubStates are particularly powerful when building component-based applications where each component manages its own slice of state.

### React Component Example

```javascript
// Main application state
const appState = new FlatState({
    user: {
        profile: { name: '', email: '', avatar: '' },
        preferences: { theme: 'light', language: 'en' },
        activity: { lastLogin: null, loginCount: 0 }
    },
    posts: [],
    comments: {},
    ui: {
        loading: false,
        errors: [],
        notifications: []
    }
});

// User Profile Component
const UserProfile = () => {
    const userState = appState.subState(['user']);
    const profileState = userState.subState(['profile']);
    
    // Event handlers work on the substate
    const nameHandler = profileState.createEventTargetPathHandler(['name']);
    const emailHandler = profileState.createEventTargetPathHandler(['email']);
    
    return (
        <div className="user-profile">
            <h2>Profile</h2>
            <input 
                type="text"
                placeholder="Name"
                onBlur={nameHandler}
                defaultValue={profileState.get(['name'])}
            />
            <input 
                type="email"
                placeholder="Email"
                onBlur={emailHandler}
                defaultValue={profileState.get(['email'])}
            />
        </div>
    );
};

// User Preferences Component
const UserPreferences = () => {
    const preferencesState = appState.subState(['user', 'preferences']);
    
    const themeHandler = preferencesState.createSelectEventHandler(['theme']);
    const languageHandler = preferencesState.createSelectEventHandler(['language']);
    
    return (
        <div className="user-preferences">
            <h2>Preferences</h2>
            <select onChange={themeHandler} defaultValue={preferencesState.get(['theme'])}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
            </select>
            
            <select onChange={languageHandler} defaultValue={preferencesState.get(['language'])}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
            </select>
        </div>
    );
};

// Posts Component with its own substate
const PostsList = () => {
    const postsState = appState.subState(['posts']); // This would need posts to be an object
    // Alternative: work directly with the array
    const posts = appState.get(['posts']) || [];
    
    const addPost = appState.createArrayPushHandler(['posts'], {
        id: Date.now(),
        title: 'New Post',
        content: '',
        author: appState.get(['user', 'profile', 'name'])
    });
    
    return (
        <div className="posts-list">
            <h2>Posts</h2>
            <button onClick={addPost}>Add New Post</button>
            {posts.map((post, index) => (
                <PostItem key={post.id} postIndex={index} />
            ))}
        </div>
    );
};

// Individual Post Component
const PostItem = ({ postIndex }) => {
    // Create substate for this specific post
    const post = appState.get(['posts', postIndex]);
    if (!post) return null;
    
    // For array items, we typically work with the main state
    const titleHandler = appState.createEventTargetPathHandler(['posts', postIndex, 'title']);
    const contentHandler = appState.createEventTargetPathHandler(['posts', postIndex, 'content']);
    const deleteHandler = appState.createArrayDestroyHandler(['posts'], postIndex);
    
    return (
        <div className="post-item">
            <input 
                type="text"
                value={post.title}
                onChange={titleHandler}
            />
            <textarea 
                value={post.content}
                onChange={contentHandler}
            />
            <button onClick={deleteHandler}>Delete</button>
        </div>
    );
};
```

## Nested SubState Patterns

### Deep Component Hierarchies

```javascript
const appState = new FlatState({
    workspace: {
        projects: {
            current: {
                id: 1,
                name: 'My Project',
                files: {
                    'src/main.js': { content: 'console.log("hello");', modified: false },
                    'src/utils.js': { content: 'export function helper() {}', modified: true }
                },
                settings: {
                    autoSave: true,
                    theme: 'dark',
                    fontSize: 14
                }
            },
            recent: []
        },
        editor: {
            activeFile: 'src/main.js',
            openFiles: ['src/main.js', 'src/utils.js'],
            cursor: { line: 1, column: 0 }
        }
    }
});

// Workspace level component
const Workspace = () => {
    const workspaceState = appState.subState(['workspace']);
    
    return (
        <div className="workspace">
            <ProjectPanel workspaceState={workspaceState} />
            <Editor workspaceState={workspaceState} />
        </div>
    );
};

// Project panel with project-specific state
const ProjectPanel = ({ workspaceState }) => {
    const projectState = workspaceState.subState(['projects', 'current']);
    
    return (
        <div className="project-panel">
            <ProjectSettings projectState={projectState} />
            <FileExplorer projectState={projectState} />
        </div>
    );
};

// Project settings component
const ProjectSettings = ({ projectState }) => {
    const settingsState = projectState.subState(['settings']);
    
    const autoSaveHandler = settingsState.createCheckboxEventHandler(['autoSave']);
    const themeHandler = settingsState.createSelectEventHandler(['theme']);
    const fontSizeIncrement = settingsState.createIncrementHandler(['fontSize']);
    const fontSizeDecrement = settingsState.createDecrementHandler(['fontSize']);
    
    return (
        <div className="project-settings">
            <label>
                <input 
                    type="checkbox"
                    onChange={autoSaveHandler}
                    defaultChecked={settingsState.get(['autoSave'])}
                />
                Auto Save
            </label>
            
            <select 
                onChange={themeHandler}
                defaultValue={settingsState.get(['theme'])}
            >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
            
            <div className="font-controls">
                <button onClick={fontSizeDecrement}>A-</button>
                <span>{settingsState.get(['fontSize'])}px</span>
                <button onClick={fontSizeIncrement}>A+</button>
            </div>
        </div>
    );
};

// File explorer with file management
const FileExplorer = ({ projectState }) => {
    const filesState = projectState.subState(['files']);
    const files = filesState.getState();
    
    return (
        <div className="file-explorer">
            <h3>{projectState.get(['name'])}</h3>
            {Object.entries(files).map(([filePath, fileData]) => (
                <FileItem 
                    key={filePath}
                    filePath={filePath}
                    filesState={filesState}
                />
            ))}
        </div>
    );
};

// Individual file item
const FileItem = ({ filePath, filesState }) => {
    const fileState = filesState.subState([filePath]);
    const isModified = fileState.get(['modified']);
    
    const openFile = () => {
        // Update editor state to show this file
        appState.set(['workspace', 'editor', 'activeFile'], filePath);
    };
    
    return (
        <div 
            className={`file-item ${isModified ? 'modified' : ''}`}
            onClick={openFile}
        >
            {filePath} {isModified && '*'}
        </div>
    );
};
```

## SubState with Shared Callbacks

SubStates inherit the parent's setter callback, which enables centralized state change monitoring:

```javascript
const appState = new FlatState({
    user: { name: '', email: '' },
    posts: [],
    ui: { loading: false }
});

// Set up centralized state monitoring
appState.setSetterCallback((props) => {
    console.log('State changed:', props.path, props.value);
    
    // Trigger re-renders, logging, analytics, etc.
    if (props.path[0] === 'user') {
        console.log('User data updated');
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(appState.get(['user'])));
    }
    
    if (props.path[0] === 'posts') {
        console.log('Posts updated');
        // Sync with server
        syncPostsWithServer();
    }
    
    // Trigger UI updates
    if (typeof updateUI === 'function') {
        updateUI();
    }
});

// SubStates automatically inherit this callback
const userState = appState.subState(['user']);
const uiState = appState.subState(['ui']);

// Changes through substate trigger the main callback
userState.set(['name'], 'John'); 
// Logs: "State changed: ['user', 'name'] John"
// Logs: "User data updated"

uiState.set(['loading'], true);
// Logs: "State changed: ['ui', 'loading'] true"
```

## Best Practices for SubState Management

### 1. Component Isolation

```javascript
// Good: Each component gets its own substate scope
const UserDashboard = () => {
    const userState = appState.subState(['user']);
    
    return (
        <div>
            <UserProfile userState={userState} />
            <UserSettings userState={userState} />
            <UserActivity userState={userState} />
        </div>
    );
};

const UserProfile = ({ userState }) => {
    const profileState = userState.subState(['profile']);
    // Component only works with profile data
    return <ProfileForm profileState={profileState} />;
};
```

### 2. Avoiding Deep Nesting

```javascript
// Instead of deeply nested substates
const deepState = appState
    .subState(['level1'])
    .subState(['level2'])
    .subState(['level3']);

// Prefer direct path access when appropriate
const directState = appState.subState(['level1', 'level2', 'level3']);
```

### 3. SubState Factory Pattern

```javascript
// Create a factory for consistent substate creation
class StateManager {
    constructor(rootState) {
        this.rootState = rootState;
    }
    
    getUserState(userId) {
        return this.rootState.subState(['users', userId]);
    }
    
    getProjectState(projectId) {
        return this.rootState.subState(['projects', projectId]);
    }
    
    getUIState(component) {
        return this.rootState.subState(['ui', component]);
    }
}

const stateManager = new StateManager(appState);

// Usage in components
const UserProfile = ({ userId }) => {
    const userState = stateManager.getUserState(userId);
    // ...
};
```

### 4. SubState Validation

```javascript
// Utility to safely create substates
function createSafeSubState(state, path, defaultValue = {}) {
    try {
        return state.subState(path);
    } catch (error) {
        // Create the path if it doesn't exist
        state.set(path, defaultValue);
        return state.subState(path);
    }
}

// Usage
const userState = createSafeSubState(appState, ['user'], {
    profile: {},
    settings: {},
    activity: {}
});
```

## SubState Limitations and Considerations

### Array Items
SubStates work best with objects. For array items, you typically work with the main state:

```javascript
// Arrays are better handled through the main state
const todos = appState.get(['todos']) || [];

// Instead of substate for array items, use direct path access
todos.forEach((todo, index) => {
    const updateTodo = (field, value) => {
        appState.set(['todos', index, field], value);
    };
    
    // Or create handlers for specific fields
    const titleHandler = appState.createEventTargetPathHandler(['todos', index, 'title']);
    const completeHandler = appState.createCheckboxEventHandler(['todos', index, 'completed']);
});
```

### Performance Considerations
- SubStates share the same underlying data, so changes are immediately reflected
- Each substate is a new FlatState instance, so create them judiciously
- Consider caching substates for frequently accessed components

```javascript
// Cache substates for performance
const componentStates = new Map();

function getComponentState(component, path) {
    const key = `${component}_${path.join('.')}`;
    if (!componentStates.has(key)) {
        componentStates.set(key, appState.subState(path));
    }
    return componentStates.get(key);
}
```