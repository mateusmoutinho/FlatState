# State Architecture

This guide covers best practices for organizing and structuring application state using FlatState for large, complex applications.

## State Organization Principles

### Hierarchical Structure Design

```javascript
// Good: Logical, hierarchical organization
const appState = new FlatState({
    // Application-level data
    app: {
        version: '1.0.0',
        environment: 'production',
        config: {
            apiUrl: 'https://api.example.com',
            features: {
                darkMode: true,
                notifications: true,
                analytics: false
            }
        }
    },
    
    // User-related data
    user: {
        authentication: {
            isLoggedIn: false,
            token: null,
            expiresAt: null
        },
        profile: {
            id: null,
            name: '',
            email: '',
            avatar: null,
            preferences: {
                theme: 'light',
                language: 'en',
                timezone: 'UTC'
            }
        },
        permissions: {
            roles: [],
            capabilities: []
        }
    },
    
    // Business domain data
    data: {
        products: {
            items: [],
            categories: [],
            filters: {
                category: null,
                priceRange: [0, 1000],
                searchQuery: ''
            },
            pagination: {
                page: 1,
                pageSize: 20,
                total: 0
            }
        },
        orders: {
            items: [],
            current: null,
            history: []
        },
        cart: {
            items: [],
            summary: {
                subtotal: 0,
                tax: 0,
                shipping: 0,
                total: 0
            }
        }
    },
    
    // UI state
    ui: {
        layout: {
            sidebarOpen: true,
            headerHeight: 60,
            footerVisible: true
        },
        modals: {
            loginModal: { open: false, data: null },
            productModal: { open: false, data: null },
            confirmModal: { open: false, data: null }
        },
        loading: {
            global: false,
            products: false,
            orders: false,
            user: false
        },
        errors: {
            global: null,
            form: {},
            api: {}
        },
        notifications: {
            items: [],
            position: 'top-right'
        }
    },
    
    // Temporary/transient data
    temp: {
        formDrafts: {},
        searches: {},
        cache: {}
    }
});
```

### Domain-Driven State Structure

```javascript
// Organize state by business domains
class StateArchitecture {
    constructor() {
        this.domains = {
            user: this.createUserDomain(),
            product: this.createProductDomain(),
            order: this.createOrderDomain(),
            ui: this.createUIDomain(),
            system: this.createSystemDomain()
        };
        
        // Main state combines all domains
        this.state = new FlatState(this.domains);
    }

    createUserDomain() {
        return {
            authentication: {
                status: 'unauthenticated', // unauthenticated, authenticating, authenticated
                credentials: null,
                session: {
                    token: null,
                    refreshToken: null,
                    expiresAt: null
                }
            },
            profile: {
                personal: {
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    avatar: null
                },
                preferences: {
                    communication: {
                        email: true,
                        sms: false,
                        push: true
                    },
                    privacy: {
                        profileVisibility: 'public',
                        showEmail: false,
                        showPhone: false
                    },
                    interface: {
                        theme: 'system',
                        language: 'en',
                        dateFormat: 'MM/dd/yyyy',
                        timeFormat: '12h'
                    }
                }
            },
            activity: {
                loginHistory: [],
                actions: [],
                statistics: {
                    totalLogins: 0,
                    lastLoginAt: null,
                    accountCreatedAt: null
                }
            }
        };
    }

    createProductDomain() {
        return {
            catalog: {
                items: [],
                categories: [],
                brands: [],
                metadata: {
                    totalCount: 0,
                    lastUpdated: null
                }
            },
            search: {
                query: '',
                results: [],
                suggestions: [],
                filters: {
                    category: null,
                    brand: null,
                    priceRange: { min: 0, max: 1000 },
                    rating: 0,
                    availability: 'all' // all, inStock, outOfStock
                },
                sorting: {
                    field: 'relevance', // relevance, price, rating, newest
                    direction: 'asc'
                },
                pagination: {
                    page: 1,
                    pageSize: 24,
                    totalPages: 0
                }
            },
            details: {
                current: null,
                reviews: [],
                recommendations: [],
                variants: []
            }
        };
    }

    createOrderDomain() {
        return {
            cart: {
                items: [],
                summary: {
                    itemCount: 0,
                    subtotal: 0,
                    tax: 0,
                    shipping: 0,
                    discount: 0,
                    total: 0
                },
                shipping: {
                    address: null,
                    method: null,
                    options: []
                },
                payment: {
                    method: null,
                    billing: null
                }
            },
            orders: {
                current: null,
                history: [],
                tracking: {}
            },
            checkout: {
                step: 1, // 1: cart, 2: shipping, 3: payment, 4: review, 5: complete
                validation: {
                    cart: false,
                    shipping: false,
                    payment: false
                },
                processing: false
            }
        };
    }

    createUIDomain() {
        return {
            layout: {
                header: {
                    visible: true,
                    height: 60,
                    sticky: true
                },
                sidebar: {
                    open: false,
                    width: 280,
                    mode: 'overlay' // overlay, push, side
                },
                footer: {
                    visible: true,
                    height: 120
                }
            },
            modals: {
                active: null,
                stack: [],
                config: {
                    closeOnEscape: true,
                    closeOnOverlay: true,
                    showOverlay: true
                }
            },
            notifications: {
                items: [],
                position: 'top-right',
                timeout: 5000,
                maxVisible: 5
            },
            loading: {
                global: false,
                components: {},
                requests: {}
            },
            errors: {
                global: null,
                components: {},
                forms: {}
            },
            responsive: {
                breakpoint: 'desktop', // mobile, tablet, desktop, wide
                isMobile: false,
                isTablet: false,
                screenWidth: 1920,
                screenHeight: 1080
            }
        };
    }

    createSystemDomain() {
        return {
            app: {
                name: 'MyApp',
                version: '1.0.0',
                build: '12345',
                environment: 'production'
            },
            config: {
                api: {
                    baseUrl: '',
                    timeout: 30000,
                    retries: 3
                },
                features: {
                    flags: {},
                    experiments: {}
                },
                limits: {
                    fileUpload: 10485760, // 10MB
                    requestTimeout: 30000,
                    maxRetries: 3
                }
            },
            performance: {
                metrics: {
                    loadTime: 0,
                    renderTime: 0,
                    apiCalls: 0
                },
                monitoring: {
                    enabled: true,
                    level: 'info'
                }
            },
            network: {
                online: true,
                quality: 'good', // poor, fair, good, excellent
                speed: {
                    download: 0,
                    upload: 0
                }
            }
        };
    }

    // Get domain-specific state managers
    getUserState() {
        return this.state.subState(['user']);
    }

    getProductState() {
        return this.state.subState(['product']);
    }

    getOrderState() {
        return this.state.subState(['order']);
    }

    getUIState() {
        return this.state.subState(['ui']);
    }

    getSystemState() {
        return this.state.subState(['system']);
    }
}

// Initialize architecture
const stateArchitecture = new StateArchitecture();
const appState = stateArchitecture.state;
```

## State Managers and Services

### Domain-Specific State Managers

```javascript
// Base state manager class
class BaseStateManager {
    constructor(state, basePath) {
        this.state = state;
        this.basePath = basePath;
        this.subscriptions = new Set();
        this.setupReactiveCallbacks();
    }

    setupReactiveCallbacks() {
        // Override in subclasses
    }

    get(path = []) {
        return this.state.get([...this.basePath, ...path]);
    }

    set(path, value, props) {
        this.state.set([...this.basePath, ...path], value, props);
    }

    subscribe(path, callback) {
        const fullPath = [...this.basePath, ...path];
        const unsubscribe = this.state.subscribe(fullPath, callback);
        this.subscriptions.add(unsubscribe);
        return unsubscribe;
    }

    cleanup() {
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions.clear();
    }
}

// User state manager
class UserStateManager extends BaseStateManager {
    constructor(state) {
        super(state, ['user']);
        this.setupAuthenticationFlow();
    }

    setupAuthenticationFlow() {
        // Monitor authentication status changes
        this.subscribe(['authentication', 'status'], (status) => {
            if (status === 'authenticated') {
                this.loadUserProfile();
                this.setupSessionMonitoring();
            } else if (status === 'unauthenticated') {
                this.clearUserData();
            }
        });
    }

    async login(credentials) {
        this.set(['authentication', 'status'], 'authenticating');
        
        try {
            const response = await authAPI.login(credentials);
            
            this.set(['authentication'], {
                status: 'authenticated',
                credentials: null, // Don't store credentials
                session: {
                    token: response.token,
                    refreshToken: response.refreshToken,
                    expiresAt: response.expiresAt
                }
            });
            
            return { success: true };
        } catch (error) {
            this.set(['authentication', 'status'], 'unauthenticated');
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await authAPI.logout();
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            this.set(['authentication', 'status'], 'unauthenticated');
        }
    }

    async loadUserProfile() {
        try {
            const profile = await userAPI.getProfile();
            this.set(['profile'], profile);
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }

    updateProfile(updates) {
        Object.keys(updates).forEach(key => {
            this.set(['profile', 'personal', key], updates[key]);
        });
        
        // Persist to server
        this.saveProfile();
    }

    updatePreferences(section, updates) {
        Object.keys(updates).forEach(key => {
            this.set(['profile', 'preferences', section, key], updates[key]);
        });
        
        // Apply preferences immediately
        this.applyPreferences();
    }

    async saveProfile() {
        const profile = this.get(['profile']);
        try {
            await userAPI.updateProfile(profile);
        } catch (error) {
            console.error('Failed to save profile:', error);
            // Could implement retry logic or show error notification
        }
    }

    applyPreferences() {
        const preferences = this.get(['profile', 'preferences', 'interface']);
        
        // Apply theme
        if (preferences.theme) {
            document.body.className = `theme-${preferences.theme}`;
        }
        
        // Apply language
        if (preferences.language) {
            // Set language for i18n library
            i18n.changeLanguage(preferences.language);
        }
    }

    setupSessionMonitoring() {
        const expiresAt = this.get(['authentication', 'session', 'expiresAt']);
        
        if (expiresAt) {
            const timeUntilExpiry = new Date(expiresAt) - new Date();
            
            // Set up refresh timer (refresh 5 minutes before expiry)
            setTimeout(() => {
                this.refreshSession();
            }, Math.max(0, timeUntilExpiry - 5 * 60 * 1000));
        }
    }

    async refreshSession() {
        const refreshToken = this.get(['authentication', 'session', 'refreshToken']);
        
        try {
            const response = await authAPI.refreshToken(refreshToken);
            this.set(['authentication', 'session'], response);
            this.setupSessionMonitoring(); // Setup next refresh
        } catch (error) {
            console.error('Session refresh failed:', error);
            this.logout(); // Force logout on refresh failure
        }
    }

    clearUserData() {
        this.set(['profile'], {
            personal: {},
            preferences: {},
            activity: {}
        });
    }

    // Permission checking methods
    hasRole(role) {
        const roles = this.get(['permissions', 'roles']) || [];
        return roles.includes(role);
    }

    hasCapability(capability) {
        const capabilities = this.get(['permissions', 'capabilities']) || [];
        return capabilities.includes(capability);
    }

    canAccess(resource, action = 'read') {
        // Implement permission logic
        return this.hasCapability(`${resource}:${action}`);
    }
}

// Product state manager
class ProductStateManager extends BaseStateManager {
    constructor(state) {
        super(state, ['product']);
        this.setupSearchReactivity();
    }

    setupSearchReactivity() {
        // Auto-search when filters or query change
        this.subscribe(['search', 'query'], this.performSearch.bind(this));
        this.subscribe(['search', 'filters'], this.performSearch.bind(this));
        this.subscribe(['search', 'sorting'], this.performSearch.bind(this));
    }

    async loadCatalog() {
        try {
            const [products, categories, brands] = await Promise.all([
                productAPI.getProducts(),
                productAPI.getCategories(),
                productAPI.getBrands()
            ]);
            
            this.set(['catalog'], {
                items: products,
                categories,
                brands,
                metadata: {
                    totalCount: products.length,
                    lastUpdated: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Failed to load catalog:', error);
        }
    }

    async performSearch() {
        const query = this.get(['search', 'query']);
        const filters = this.get(['search', 'filters']);
        const sorting = this.get(['search', 'sorting']);
        const pagination = this.get(['search', 'pagination']);
        
        try {
            const results = await productAPI.search({
                query,
                filters,
                sorting,
                page: pagination.page,
                pageSize: pagination.pageSize
            });
            
            this.set(['search', 'results'], results.items);
            this.set(['search', 'pagination', 'totalPages'], results.totalPages);
        } catch (error) {
            console.error('Search failed:', error);
            this.set(['search', 'results'], []);
        }
    }

    updateSearchQuery(query) {
        this.set(['search', 'query'], query);
        this.set(['search', 'pagination', 'page'], 1); // Reset to first page
    }

    updateFilter(filterName, value) {
        this.set(['search', 'filters', filterName], value);
        this.set(['search', 'pagination', 'page'], 1);
    }

    updateSorting(field, direction = 'asc') {
        this.set(['search', 'sorting'], { field, direction });
        this.set(['search', 'pagination', 'page'], 1);
    }

    changePage(page) {
        const totalPages = this.get(['search', 'pagination', 'totalPages']);
        if (page >= 1 && page <= totalPages) {
            this.set(['search', 'pagination', 'page'], page);
        }
    }

    async loadProductDetails(productId) {
        try {
            const [product, reviews, recommendations] = await Promise.all([
                productAPI.getProduct(productId),
                productAPI.getReviews(productId),
                productAPI.getRecommendations(productId)
            ]);
            
            this.set(['details'], {
                current: product,
                reviews,
                recommendations,
                variants: product.variants || []
            });
        } catch (error) {
            console.error('Failed to load product details:', error);
        }
    }

    clearDetails() {
        this.set(['details'], {
            current: null,
            reviews: [],
            recommendations: [],
            variants: []
        });
    }
}

// UI state manager
class UIStateManager extends BaseStateManager {
    constructor(state) {
        super(state, ['ui']);
        this.setupResponsiveHandling();
        this.setupModalManagement();
    }

    setupResponsiveHandling() {
        const updateBreakpoint = () => {
            const width = window.innerWidth;
            let breakpoint = 'desktop';
            
            if (width < 768) breakpoint = 'mobile';
            else if (width < 1024) breakpoint = 'tablet';
            else if (width >= 1920) breakpoint = 'wide';
            
            this.set(['responsive'], {
                breakpoint,
                isMobile: breakpoint === 'mobile',
                isTablet: breakpoint === 'tablet',
                screenWidth: width,
                screenHeight: window.innerHeight
            });
        };
        
        window.addEventListener('resize', updateBreakpoint);
        updateBreakpoint(); // Initial call
    }

    setupModalManagement() {
        // Handle escape key for modal closing
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const config = this.get(['modals', 'config']);
                if (config.closeOnEscape) {
                    this.closeModal();
                }
            }
        });
    }

    openModal(modalName, data = null) {
        const currentActive = this.get(['modals', 'active']);
        const stack = this.get(['modals', 'stack']) || [];
        
        // Add current modal to stack if exists
        if (currentActive) {
            this.state.append(['ui', 'modals', 'stack'], currentActive);
        }
        
        this.set(['modals', 'active'], { name: modalName, data });
    }

    closeModal() {
        const stack = this.get(['modals', 'stack']) || [];
        
        if (stack.length > 0) {
            // Restore previous modal from stack
            const previous = this.state.pop(['modals', 'stack']);
            this.set(['modals', 'active'], previous);
        } else {
            this.set(['modals', 'active'], null);
        }
    }

    closeAllModals() {
        this.set(['modals', 'active'], null);
        this.set(['modals', 'stack'], []);
    }

    showNotification(notification) {
        const id = Date.now() + Math.random();
        const timeout = this.get(['notifications', 'timeout']);
        
        const notificationData = {
            id,
            type: 'info',
            ...notification,
            timestamp: new Date().toISOString()
        };
        
        this.state.append(['ui', 'notifications', 'items'], notificationData);
        
        // Auto-remove after timeout
        if (timeout > 0) {
            setTimeout(() => {
                this.removeNotification(id);
            }, timeout);
        }
    }

    removeNotification(id) {
        const notifications = this.get(['notifications', 'items']) || [];
        const index = notifications.findIndex(n => n.id === id);
        
        if (index !== -1) {
            this.state.destroy(['notifications', 'items'], index);
        }
    }

    clearNotifications() {
        this.set(['notifications', 'items'], []);
    }

    setLoading(component, isLoading) {
        this.set(['loading', 'components', component], isLoading);
    }

    setError(component, error) {
        this.set(['errors', 'components', component], error);
    }

    clearError(component) {
        this.set(['errors', 'components', component], null);
    }

    toggleSidebar() {
        const isOpen = this.get(['layout', 'sidebar', 'open']);
        this.set(['layout', 'sidebar', 'open'], !isOpen);
    }
}
```

## State Composition and Modules

### Modular State Architecture

```javascript
// State module interface
class StateModule {
    constructor(name, initialState = {}) {
        this.name = name;
        this.initialState = initialState;
        this.dependencies = [];
        this.manager = null;
    }

    // Override in subclasses
    createManager(state) {
        throw new Error('createManager must be implemented');
    }

    // Define dependencies on other modules
    dependsOn(...moduleNames) {
        this.dependencies.push(...moduleNames);
        return this;
    }

    // Initialize the module
    initialize(rootState, moduleRegistry) {
        // Check dependencies
        for (const dep of this.dependencies) {
            if (!moduleRegistry.has(dep)) {
                throw new Error(`Module ${this.name} depends on ${dep} which is not registered`);
            }
        }

        this.manager = this.createManager(rootState);
        return this.manager;
    }
}

// User module
class UserModule extends StateModule {
    constructor() {
        super('user', {
            authentication: { status: 'unauthenticated' },
            profile: {},
            permissions: { roles: [], capabilities: [] }
        });
    }

    createManager(state) {
        return new UserStateManager(state);
    }
}

// Product module
class ProductModule extends StateModule {
    constructor() {
        super('product', {
            catalog: { items: [], categories: [], brands: [] },
            search: { query: '', results: [], filters: {} },
            details: { current: null }
        });
    }

    createManager(state) {
        return new ProductStateManager(state);
    }
}

// Order module
class OrderModule extends StateModule {
    constructor() {
        super('order', {
            cart: { items: [], summary: {} },
            orders: { current: null, history: [] },
            checkout: { step: 1, processing: false }
        });
        
        this.dependsOn('user', 'product');
    }

    createManager(state) {
        return new OrderStateManager(state);
    }
}

// UI module
class UIModule extends StateModule {
    constructor() {
        super('ui', {
            layout: { sidebar: { open: false } },
            modals: { active: null, stack: [] },
            notifications: { items: [] },
            loading: { global: false },
            errors: {}
        });
    }

    createManager(state) {
        return new UIStateManager(state);
    }
}

// State registry for managing modules
class StateRegistry {
    constructor() {
        this.modules = new Map();
        this.managers = new Map();
        this.state = null;
    }

    register(module) {
        if (this.modules.has(module.name)) {
            throw new Error(`Module ${module.name} is already registered`);
        }
        
        this.modules.set(module.name, module);
        return this;
    }

    initialize() {
        // Build initial state from all modules
        const combinedState = {};
        
        for (const [name, module] of this.modules) {
            combinedState[name] = module.initialState;
        }
        
        // Create root state
        this.state = new FlatState(combinedState);
        
        // Initialize modules in dependency order
        const initialized = new Set();
        const initializeModule = (moduleName) => {
            if (initialized.has(moduleName)) return;
            
            const module = this.modules.get(moduleName);
            if (!module) return;
            
            // Initialize dependencies first
            for (const dep of module.dependencies) {
                initializeModule(dep);
            }
            
            // Initialize this module
            const manager = module.initialize(this.state, this.modules);
            this.managers.set(moduleName, manager);
            initialized.add(moduleName);
        };
        
        // Initialize all modules
        for (const moduleName of this.modules.keys()) {
            initializeModule(moduleName);
        }
        
        return this;
    }

    getState() {
        return this.state;
    }

    getManager(moduleName) {
        return this.managers.get(moduleName);
    }

    cleanup() {
        // Cleanup all managers
        for (const manager of this.managers.values()) {
            if (manager.cleanup) {
                manager.cleanup();
            }
        }
        
        this.managers.clear();
    }
}

// Application setup
const stateRegistry = new StateRegistry()
    .register(new UserModule())
    .register(new ProductModule())
    .register(new OrderModule())
    .register(new UIModule())
    .initialize();

// Get state and managers
const appState = stateRegistry.getState();
const userManager = stateRegistry.getManager('user');
const productManager = stateRegistry.getManager('product');
const orderManager = stateRegistry.getManager('order');
const uiManager = stateRegistry.getManager('ui');

// Export for global access
window.appState = {
    state: appState,
    user: userManager,
    product: productManager,
    order: orderManager,
    ui: uiManager
};
```

This architecture provides a scalable, maintainable approach to organizing complex application state. It separates concerns into logical domains, provides clear interfaces between modules, and supports dependency management while maintaining the simplicity and performance benefits of FlatState.