# Custom Event Handlers

This guide demonstrates how to create your own custom event handlers and extend FlatState's functionality beyond the built-in handlers.

## Understanding Event Handler Patterns

FlatState's built-in event handlers follow a consistent pattern:

```javascript
// Basic pattern: function that returns a function
function createEventHandler(path, options = {}) {
    return (event) => {
        // Extract value from event
        const value = extractValue(event, options);
        
        // Update state
        state.set(path, value, { event, ...options });
    };
}

// Example: Built-in text input handler
function createEventTargetPathHandler(path) {
    return (event) => {
        state.set(path, event.target.value, { event });
    };
}
```

## Creating Basic Custom Handlers

### File Upload Handler

```javascript
// Create a file upload handler
function createFileUploadHandler(path, options = {}) {
    const {
        multiple = false,
        acceptedTypes = [],
        maxSize = null,
        onProgress = null,
        onError = null
    } = options;

    return async (event) => {
        const files = Array.from(event.target.files);
        
        // Validate files
        const validFiles = files.filter(file => {
            // Check file type
            if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
                if (onError) onError(new Error(`Invalid file type: ${file.type}`));
                return false;
            }
            
            // Check file size
            if (maxSize && file.size > maxSize) {
                if (onError) onError(new Error(`File too large: ${file.size} bytes`));
                return false;
            }
            
            return true;
        });

        if (validFiles.length === 0) return;

        // Process files
        const processedFiles = await Promise.all(
            validFiles.map(async (file) => {
                const fileData = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    dataUrl: null,
                    uploadProgress: 0
                };

                // Read file as data URL
                if (file.type.startsWith('image/') || options.readAsDataUrl) {
                    fileData.dataUrl = await readFileAsDataUrl(file);
                }

                return fileData;
            })
        );

        // Update state
        if (multiple) {
            state.set(path, processedFiles, { event, files: validFiles });
        } else {
            state.set(path, processedFiles[0] || null, { event, file: validFiles[0] });
        }
    };
}

// Helper function to read file as data URL
function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Usage
const state = new FlatState({
    userProfile: {
        avatar: null,
        documents: []
    }
});

const avatarHandler = state.createFileUploadHandler(['userProfile', 'avatar'], {
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxSize: 5 * 1024 * 1024, // 5MB
    readAsDataUrl: true,
    onError: (error) => {
        console.error('Avatar upload error:', error);
        alert(error.message);
    }
});

const documentsHandler = state.createFileUploadHandler(['userProfile', 'documents'], {
    multiple: true,
    acceptedTypes: ['application/pdf', 'image/*'],
    maxSize: 10 * 1024 * 1024 // 10MB
});

// HTML
// <input type="file" accept="image/*" onChange={avatarHandler} />
// <input type="file" multiple accept=".pdf,image/*" onChange={documentsHandler} />
```

### Debounced Input Handler

```javascript
// Create a debounced input handler for search/autocomplete
function createDebouncedInputHandler(path, delay = 300, options = {}) {
    let timeoutId = null;
    const { 
        minLength = 0,
        transform = (value) => value,
        onDebounce = null
    } = options;

    return (event) => {
        const rawValue = event.target.value;
        const value = transform(rawValue);

        // Clear previous timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Set immediate value (for UI responsiveness)
        state.set([...path, '_immediate'], rawValue, { event, immediate: true });

        // Set debounced value
        if (value.length >= minLength) {
            timeoutId = setTimeout(() => {
                state.set(path, value, { event, debounced: true });
                if (onDebounce) onDebounce(value);
            }, delay);
        } else {
            // Clear value if below minimum length
            state.set(path, '', { event, debounced: true, cleared: true });
        }
    };
}

// Usage
const searchHandler = state.createDebouncedInputHandler(['search', 'query'], 500, {
    minLength: 2,
    transform: (value) => value.toLowerCase().trim(),
    onDebounce: (query) => {
        console.log('Searching for:', query);
        performSearch(query);
    }
});

// React component
function SearchInput() {
    const immediateValue = state.get(['search', 'query', '_immediate']) || '';
    const searchQuery = state.get(['search', 'query']) || '';
    
    return (
        <div>
            <input
                type="text"
                placeholder="Search..."
                value={immediateValue}
                onChange={searchHandler}
            />
            {searchQuery && <div>Searching for: {searchQuery}</div>}
        </div>
    );
}
```

### Geolocation Handler

```javascript
// Create a geolocation handler
function createGeolocationHandler(path, options = {}) {
    const {
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 300000, // 5 minutes
        onError = null,
        onSuccess = null
    } = options;

    return () => {
        if (!navigator.geolocation) {
            const error = new Error('Geolocation is not supported');
            if (onError) onError(error);
            return;
        }

        // Set loading state
        state.set([...path, 'loading'], true);
        state.set([...path, 'error'], null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp,
                    loading: false,
                    error: null
                };

                state.set(path, locationData);
                if (onSuccess) onSuccess(locationData);
            },
            (error) => {
                const errorData = {
                    code: error.code,
                    message: error.message,
                    timestamp: Date.now()
                };

                state.set([...path, 'loading'], false);
                state.set([...path, 'error'], errorData);
                if (onError) onError(errorData);
            },
            {
                enableHighAccuracy,
                timeout,
                maximumAge
            }
        );
    };
}

// Usage
const locationHandler = state.createGeolocationHandler(['user', 'location'], {
    onSuccess: (location) => {
        console.log('Location obtained:', location);
        // Could trigger address lookup here
    },
    onError: (error) => {
        console.error('Location error:', error);
        alert('Could not get your location');
    }
});

// React component
function LocationButton() {
    const location = state.get(['user', 'location']) || {};
    
    return (
        <div>
            <button onClick={locationHandler} disabled={location.loading}>
                {location.loading ? 'Getting Location...' : 'Get My Location'}
            </button>
            
            {location.latitude && (
                <div>
                    Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    <br />
                    Accuracy: ±{location.accuracy}m
                </div>
            )}
            
            {location.error && (
                <div className="error">
                    Error: {location.error.message}
                </div>
            )}
        </div>
    );
}
```

## Advanced Custom Handlers

### Multi-Step Form Handler

```javascript
// Create a multi-step form handler with validation
function createMultiStepFormHandler(formPath, steps, options = {}) {
    const {
        validateStep = () => true,
        onStepChange = null,
        onComplete = null,
        autoSave = false
    } = options;

    // Initialize form state
    state.set([...formPath, 'currentStep'], 0);
    state.set([...formPath, 'completed'], false);
    state.set([...formPath, 'errors'], {});

    const handlers = {
        nextStep: () => {
            const currentStep = state.get([...formPath, 'currentStep']);
            const formData = state.get([...formPath, 'data']) || {};
            
            // Validate current step
            const stepConfig = steps[currentStep];
            const errors = validateStep(stepConfig, formData);
            
            if (Object.keys(errors).length > 0) {
                state.set([...formPath, 'errors'], errors);
                return false;
            }
            
            // Clear errors and move to next step
            state.set([...formPath, 'errors'], {});
            
            if (currentStep < steps.length - 1) {
                const nextStep = currentStep + 1;
                state.set([...formPath, 'currentStep'], nextStep);
                
                if (onStepChange) {
                    onStepChange(nextStep, steps[nextStep]);
                }
                
                if (autoSave) {
                    saveFormData(formPath, formData);
                }
                
                return true;
            } else {
                // Complete form
                state.set([...formPath, 'completed'], true);
                if (onComplete) {
                    onComplete(formData);
                }
                return true;
            }
        },

        prevStep: () => {
            const currentStep = state.get([...formPath, 'currentStep']);
            
            if (currentStep > 0) {
                const prevStep = currentStep - 1;
                state.set([...formPath, 'currentStep'], prevStep);
                state.set([...formPath, 'errors'], {});
                
                if (onStepChange) {
                    onStepChange(prevStep, steps[prevStep]);
                }
            }
        },

        goToStep: (stepIndex) => {
            if (stepIndex >= 0 && stepIndex < steps.length) {
                state.set([...formPath, 'currentStep'], stepIndex);
                state.set([...formPath, 'errors'], {});
                
                if (onStepChange) {
                    onStepChange(stepIndex, steps[stepIndex]);
                }
            }
        },

        reset: () => {
            state.set([...formPath, 'currentStep'], 0);
            state.set([...formPath, 'completed'], false);
            state.set([...formPath, 'errors'], {});
            state.set([...formPath, 'data'], {});
        },

        createFieldHandler: (fieldName, stepIndex = null) => {
            return state.createEventTargetPathHandler([
                ...formPath, 'data', fieldName
            ]);
        }
    };

    return handlers;
}

// Usage
const registrationSteps = [
    {
        name: 'personal',
        title: 'Personal Information',
        fields: ['firstName', 'lastName', 'email']
    },
    {
        name: 'address',
        title: 'Address Information',
        fields: ['street', 'city', 'state', 'zipCode']
    },
    {
        name: 'preferences',
        title: 'Preferences',
        fields: ['newsletter', 'notifications']
    }
];

const formHandlers = state.createMultiStepFormHandler(
    ['registration'],
    registrationSteps,
    {
        validateStep: (stepConfig, formData) => {
            const errors = {};
            
            stepConfig.fields.forEach(field => {
                if (!formData[field]) {
                    errors[field] = `${field} is required`;
                }
            });
            
            return errors;
        },
        onStepChange: (step, config) => {
            console.log('Moved to step:', step, config.title);
        },
        onComplete: (data) => {
            console.log('Registration completed:', data);
            submitRegistration(data);
        },
        autoSave: true
    }
);

// React component
function MultiStepRegistration() {
    const currentStep = state.get(['registration', 'currentStep']) || 0;
    const errors = state.get(['registration', 'errors']) || {};
    const completed = state.get(['registration', 'completed']);
    
    if (completed) {
        return <div>Registration completed!</div>;
    }
    
    const stepConfig = registrationSteps[currentStep];
    
    return (
        <div className="multi-step-form">
            <div className="step-indicator">
                {registrationSteps.map((step, index) => (
                    <div 
                        key={step.name}
                        className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                        onClick={() => formHandlers.goToStep(index)}
                    >
                        {step.title}
                    </div>
                ))}
            </div>
            
            <div className="step-content">
                <h2>{stepConfig.title}</h2>
                
                {stepConfig.fields.map(field => (
                    <div key={field} className="form-group">
                        <label>{field}:</label>
                        <input
                            type="text"
                            onChange={formHandlers.createFieldHandler(field)}
                            value={state.get(['registration', 'data', field]) || ''}
                        />
                        {errors[field] && (
                            <div className="error">{errors[field]}</div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="form-navigation">
                <button 
                    onClick={formHandlers.prevStep}
                    disabled={currentStep === 0}
                >
                    Previous
                </button>
                
                <button onClick={formHandlers.nextStep}>
                    {currentStep === registrationSteps.length - 1 ? 'Complete' : 'Next'}
                </button>
            </div>
        </div>
    );
}
```

### Drag and Drop Handler

```javascript
// Create a drag and drop handler
function createDragDropHandler(path, options = {}) {
    const {
        acceptedTypes = [],
        multiple = true,
        onDragEnter = null,
        onDragLeave = null,
        onDrop = null,
        onError = null
    } = options;

    let dragCounter = 0;

    const handlers = {
        onDragEnter: (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            dragCounter++;
            
            if (dragCounter === 1) {
                state.set([...path, 'isDragOver'], true);
                if (onDragEnter) onDragEnter(event);
            }
        },

        onDragLeave: (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            dragCounter--;
            
            if (dragCounter === 0) {
                state.set([...path, 'isDragOver'], false);
                if (onDragLeave) onDragLeave(event);
            }
        },

        onDragOver: (event) => {
            event.preventDefault();
            event.stopPropagation();
        },

        onDrop: async (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            dragCounter = 0;
            state.set([...path, 'isDragOver'], false);
            
            const files = Array.from(event.dataTransfer.files);
            
            if (files.length === 0) return;
            
            // Filter accepted file types
            const validFiles = files.filter(file => {
                if (acceptedTypes.length === 0) return true;
                return acceptedTypes.some(type => {
                    if (type.endsWith('/*')) {
                        return file.type.startsWith(type.slice(0, -1));
                    }
                    return file.type === type;
                });
            });
            
            if (validFiles.length === 0) {
                if (onError) {
                    onError(new Error('No valid files found'));
                }
                return;
            }
            
            // Process files
            const processedFiles = await Promise.all(
                validFiles.map(async (file) => ({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    file: file
                }))
            );
            
            // Update state
            if (multiple) {
                const existingFiles = state.get([...path, 'files']) || [];
                state.set([...path, 'files'], [...existingFiles, ...processedFiles]);
            } else {
                state.set([...path, 'file'], processedFiles[0]);
            }
            
            if (onDrop) onDrop(processedFiles, event);
        }
    };

    return handlers;
}

// Usage
const dropHandlers = state.createDragDropHandler(['fileUpload'], {
    acceptedTypes: ['image/*', 'application/pdf'],
    multiple: true,
    onDrop: (files) => {
        console.log('Files dropped:', files);
        uploadFiles(files);
    },
    onError: (error) => {
        console.error('Drop error:', error);
        alert(error.message);
    }
});

// React component
function FileDropZone() {
    const isDragOver = state.get(['fileUpload', 'isDragOver']);
    const files = state.get(['fileUpload', 'files']) || [];
    
    return (
        <div 
            className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
            {...dropHandlers}
        >
            {isDragOver ? (
                <div>Drop files here...</div>
            ) : (
                <div>
                    Drag and drop files here
                    <br />
                    Accepted: Images and PDFs
                </div>
            )}
            
            {files.length > 0 && (
                <div className="dropped-files">
                    <h3>Dropped Files:</h3>
                    {files.map((file, index) => (
                        <div key={index} className="file-item">
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

## Handler Composition and Extension

### Combining Multiple Handlers

```javascript
// Create a composite handler that combines multiple behaviors
function createCompositeHandler(...handlers) {
    return (event) => {
        handlers.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                console.error('Handler error:', error);
            }
        });
    };
}

// Create a conditional handler
function createConditionalHandler(condition, trueHandler, falseHandler = null) {
    return (event) => {
        if (condition(event)) {
            trueHandler(event);
        } else if (falseHandler) {
            falseHandler(event);
        }
    };
}

// Usage examples
const analyticsHandler = (event) => {
    analytics.track('input_changed', {
        field: event.target.name,
        value: event.target.value
    });
};

const validationHandler = state.createEventTargetPathHandler(['form', 'email']);

// Combine validation and analytics
const emailHandler = state.createCompositeHandler(
    validationHandler,
    analyticsHandler
);

// Conditional handler based on user permissions
const adminOnlyHandler = state.createConditionalHandler(
    () => user.hasRole('admin'),
    state.createEventTargetPathHandler(['admin', 'settings']),
    () => alert('Admin access required')
);
```

### Creating Handler Factories

```javascript
// Factory for creating field handlers with common behaviors
function createFieldHandlerFactory(basePath, commonOptions = {}) {
    return (fieldName, fieldOptions = {}) => {
        const options = { ...commonOptions, ...fieldOptions };
        const fieldPath = [...basePath, fieldName];
        
        const handler = (event) => {
            let value = event.target.value;
            
            // Apply transformations
            if (options.transform) {
                value = options.transform(value);
            }
            
            // Validate
            if (options.validate) {
                const error = options.validate(value);
                if (error) {
                    state.set([...fieldPath, '_error'], error);
                    return;
                } else {
                    state.set([...fieldPath, '_error'], null);
                }
            }
            
            // Update value
            state.set(fieldPath, value, { event, ...options });
            
            // Trigger additional actions
            if (options.onChange) {
                options.onChange(value, event);
            }
        };
        
        return handler;
    };
}

// Usage
const createFormField = state.createFieldHandlerFactory(['form', 'data'], {
    transform: (value) => value.trim(),
    validate: (value) => value.length > 0 ? null : 'Field is required'
});

const nameHandler = createFormField('name', {
    validate: (value) => {
        if (!value) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return null;
    }
});

const emailHandler = createFormField('email', {
    transform: (value) => value.toLowerCase().trim(),
    validate: (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
        return null;
    }
});
```

### Extension Methods Pattern

```javascript
// Extend FlatState prototype with custom handler creators
FlatState.prototype.createFileUploadHandler = function(path, options) {
    return createFileUploadHandler.call(this, path, options);
};

FlatState.prototype.createDebouncedInputHandler = function(path, delay, options) {
    return createDebouncedInputHandler.call(this, path, delay, options);
};

FlatState.prototype.createGeolocationHandler = function(path, options) {
    return createGeolocationHandler.call(this, path, options);
};

FlatState.prototype.createMultiStepFormHandler = function(formPath, steps, options) {
    return createMultiStepFormHandler.call(this, formPath, steps, options);
};

FlatState.prototype.createDragDropHandler = function(path, options) {
    return createDragDropHandler.call(this, path, options);
};

FlatState.prototype.createCompositeHandler = function(...handlers) {
    return createCompositeHandler(...handlers);
};

FlatState.prototype.createConditionalHandler = function(condition, trueHandler, falseHandler) {
    return createConditionalHandler(condition, trueHandler, falseHandler);
};

FlatState.prototype.createFieldHandlerFactory = function(basePath, commonOptions) {
    return createFieldHandlerFactory.call(this, basePath, commonOptions);
};

// Now you can use them directly on state instances
const state = new FlatState();

const fileHandler = state.createFileUploadHandler(['files'], { multiple: true });
const searchHandler = state.createDebouncedInputHandler(['search'], 300);
const locationHandler = state.createGeolocationHandler(['location']);
```

This guide demonstrates how to create sophisticated custom event handlers that extend FlatState's capabilities. These patterns allow you to build reusable, composable handlers for complex UI interactions while maintaining clean separation of concerns.