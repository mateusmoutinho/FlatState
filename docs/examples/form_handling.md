# Form Handling

This guide covers comprehensive form handling patterns using FlatState, from simple forms to complex multi-step forms with validation.

## Basic Form Handling

### Simple Contact Form

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://github.com/mateusmoutinho/FlatState/releases/download/0.1.0/flatstate.js"></script>
    <style>
        .form-group { margin-bottom: 15px; }
        .error { color: red; font-size: 0.9em; }
        .success { color: green; }
        input, textarea, select { width: 100%; padding: 8px; margin-top: 5px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
        button:disabled { background: #ccc; cursor: not-allowed; }
    </style>
</head>
<body>
    <form id="contactForm">
        <div class="form-group">
            <label for="name">Name:</label>
            <input type="text" id="name" required>
            <div class="error" id="nameError"></div>
        </div>
        
        <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" required>
            <div class="error" id="emailError"></div>
        </div>
        
        <div class="form-group">
            <label for="subject">Subject:</label>
            <select id="subject">
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="support">Support</option>
                <option value="sales">Sales</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="message">Message:</label>
            <textarea id="message" rows="5" required></textarea>
            <div class="error" id="messageError"></div>
        </div>
        
        <div class="form-group">
            <label>
                <input type="checkbox" id="newsletter"> Subscribe to newsletter
            </label>
        </div>
        
        <button type="submit" id="submitBtn">Send Message</button>
        <div id="formStatus"></div>
    </form>

    <script>
        const formState = new FlatState({
            data: {
                name: '',
                email: '',
                subject: '',
                message: '',
                newsletter: false
            },
            errors: {},
            isSubmitting: false,
            submitted: false
        });

        // Create event handlers
        const nameHandler = formState.createEventTargetPathHandler(['data', 'name']);
        const emailHandler = formState.createEventTargetPathHandler(['data', 'email']);
        const subjectHandler = formState.createSelectEventHandler(['data', 'subject']);
        const messageHandler = formState.createEventTargetPathHandler(['data', 'message']);
        const newsletterHandler = formState.createCheckboxEventHandler(['data', 'newsletter']);

        // Bind event handlers
        document.getElementById('name').addEventListener('blur', nameHandler);
        document.getElementById('email').addEventListener('blur', emailHandler);
        document.getElementById('subject').addEventListener('change', subjectHandler);
        document.getElementById('message').addEventListener('blur', messageHandler);
        document.getElementById('newsletter').addEventListener('change', newsletterHandler);

        // Validation functions
        function validateName(name) {
            if (!name.trim()) return 'Name is required';
            if (name.length < 2) return 'Name must be at least 2 characters';
            return null;
        }

        function validateEmail(email) {
            if (!email.trim()) return 'Email is required';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) return 'Please enter a valid email';
            return null;
        }

        function validateMessage(message) {
            if (!message.trim()) return 'Message is required';
            if (message.length < 10) return 'Message must be at least 10 characters';
            return null;
        }

        function validateForm() {
            const data = formState.get(['data']);
            const errors = {};

            errors.name = validateName(data.name);
            errors.email = validateEmail(data.email);
            errors.message = validateMessage(data.message);

            // Remove null errors
            Object.keys(errors).forEach(key => {
                if (errors[key] === null) delete errors[key];
            });

            formState.set(['errors'], errors);
            return Object.keys(errors).length === 0;
        }

        // Set up reactive updates
        formState.setSetterCallback((props) => {
            updateFormDisplay();
            
            // Validate on data changes
            if (props.path[0] === 'data') {
                setTimeout(validateForm, 100); // Debounce validation
            }
        });

        function updateFormDisplay() {
            const data = formState.get(['data']);
            const errors = formState.get(['errors']);
            const isSubmitting = formState.get(['isSubmitting']);
            const submitted = formState.get(['submitted']);

            // Update form values
            document.getElementById('name').value = data.name;
            document.getElementById('email').value = data.email;
            document.getElementById('subject').value = data.subject;
            document.getElementById('message').value = data.message;
            document.getElementById('newsletter').checked = data.newsletter;

            // Display errors
            document.getElementById('nameError').textContent = errors.name || '';
            document.getElementById('emailError').textContent = errors.email || '';
            document.getElementById('messageError').textContent = errors.message || '';

            // Update submit button
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = isSubmitting;
            submitBtn.textContent = isSubmitting ? 'Sending...' : 'Send Message';

            // Show status
            const status = document.getElementById('formStatus');
            if (submitted) {
                status.innerHTML = '<div class="success">Message sent successfully!</div>';
            } else if (isSubmitting) {
                status.innerHTML = '<div>Sending message...</div>';
            } else {
                status.innerHTML = '';
            }
        }

        // Handle form submission
        document.getElementById('contactForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateForm()) {
                return;
            }

            formState.set(['isSubmitting'], true);

            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const formData = formState.get(['data']);
                console.log('Form submitted:', formData);
                
                // Reset form after successful submission
                formState.set(['data'], {
                    name: '',
                    email: '',
                    subject: '',
                    message: '',
                    newsletter: false
                });
                formState.set(['submitted'], true);
                
                // Hide success message after 3 seconds
                setTimeout(() => {
                    formState.set(['submitted'], false);
                }, 3000);
                
            } catch (error) {
                console.error('Form submission error:', error);
                alert('Failed to send message. Please try again.');
            } finally {
                formState.set(['isSubmitting'], false);
            }
        });

        // Initialize display
        updateFormDisplay();
    </script>
</body>
</html>
```

## Dynamic Form Fields

### User Registration with Conditional Fields

```javascript
const registrationState = new FlatState({
    user: {
        accountType: 'personal', // personal or business
        personal: {
            firstName: '',
            lastName: '',
            dateOfBirth: ''
        },
        business: {
            companyName: '',
            taxId: '',
            industry: ''
        },
        contact: {
            email: '',
            phone: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'US'
            }
        },
        preferences: {
            newsletter: false,
            smsNotifications: false,
            marketing: false
        }
    },
    validation: {
        errors: {},
        touched: {}
    },
    ui: {
        currentStep: 1,
        totalSteps: 3
    }
});

// React component for dynamic registration form
function RegistrationForm() {
    const { get, set } = useFlatState(registrationState);
    
    const currentStep = get(['ui', 'currentStep']);
    
    const nextStep = () => {
        if (validateCurrentStep()) {
            set(['ui', 'currentStep'], Math.min(currentStep + 1, get(['ui', 'totalSteps'])));
        }
    };
    
    const prevStep = () => {
        set(['ui', 'currentStep'], Math.max(currentStep - 1, 1));
    };
    
    const validateCurrentStep = () => {
        // Implement step-specific validation
        return true;
    };

    return (
        <div className="registration-form">
            <ProgressIndicator />
            
            {currentStep === 1 && <AccountTypeStep />}
            {currentStep === 2 && <ContactInformationStep />}
            {currentStep === 3 && <PreferencesStep />}
            
            <NavigationButtons 
                currentStep={currentStep}
                totalSteps={get(['ui', 'totalSteps'])}
                onNext={nextStep}
                onPrev={prevStep}
            />
        </div>
    );
}

function AccountTypeStep() {
    const { get } = useFlatState(registrationState, ['user']);
    
    const accountTypeHandler = registrationState.createSelectEventHandler(['user', 'accountType']);
    const firstNameHandler = registrationState.createEventTargetPathHandler(['user', 'personal', 'firstName']);
    const lastNameHandler = registrationState.createEventTargetPathHandler(['user', 'personal', 'lastName']);
    const dobHandler = registrationState.createEventTargetPathHandler(['user', 'personal', 'dateOfBirth']);
    const companyHandler = registrationState.createEventTargetPathHandler(['user', 'business', 'companyName']);
    const taxIdHandler = registrationState.createEventTargetPathHandler(['user', 'business', 'taxId']);
    const industryHandler = registrationState.createSelectEventHandler(['user', 'business', 'industry']);

    const accountType = get(['accountType']);

    return (
        <div className="step account-type-step">
            <h2>Account Information</h2>
            
            <div className="form-group">
                <label>Account Type:</label>
                <select value={accountType} onChange={accountTypeHandler}>
                    <option value="personal">Personal</option>
                    <option value="business">Business</option>
                </select>
            </div>

            {accountType === 'personal' && (
                <div className="personal-fields">
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name:</label>
                            <input
                                type="text"
                                value={get(['personal', 'firstName'])}
                                onChange={firstNameHandler}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name:</label>
                            <input
                                type="text"
                                value={get(['personal', 'lastName'])}
                                onChange={lastNameHandler}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Date of Birth:</label>
                        <input
                            type="date"
                            value={get(['personal', 'dateOfBirth'])}
                            onChange={dobHandler}
                        />
                    </div>
                </div>
            )}

            {accountType === 'business' && (
                <div className="business-fields">
                    <div className="form-group">
                        <label>Company Name:</label>
                        <input
                            type="text"
                            value={get(['business', 'companyName'])}
                            onChange={companyHandler}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Tax ID:</label>
                        <input
                            type="text"
                            value={get(['business', 'taxId'])}
                            onChange={taxIdHandler}
                        />
                    </div>
                    <div className="form-group">
                        <label>Industry:</label>
                        <select value={get(['business', 'industry'])} onChange={industryHandler}>
                            <option value="">Select Industry</option>
                            <option value="technology">Technology</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="finance">Finance</option>
                            <option value="retail">Retail</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}

function ContactInformationStep() {
    const { get } = useFlatState(registrationState, ['user', 'contact']);
    
    // Create handlers for contact fields
    const emailHandler = registrationState.createEventTargetPathHandler(['user', 'contact', 'email']);
    const phoneHandler = registrationState.createEventTargetPathHandler(['user', 'contact', 'phone']);
    const streetHandler = registrationState.createEventTargetPathHandler(['user', 'contact', 'address', 'street']);
    const cityHandler = registrationState.createEventTargetPathHandler(['user', 'contact', 'address', 'city']);
    const stateHandler = registrationState.createEventTargetPathHandler(['user', 'contact', 'address', 'state']);
    const zipHandler = registrationState.createEventTargetPathHandler(['user', 'contact', 'address', 'zipCode']);
    const countryHandler = registrationState.createSelectEventHandler(['user', 'contact', 'address', 'country']);

    return (
        <div className="step contact-step">
            <h2>Contact Information</h2>
            
            <div className="form-row">
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={get(['email'])}
                        onChange={emailHandler}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Phone:</label>
                    <input
                        type="tel"
                        value={get(['phone'])}
                        onChange={phoneHandler}
                    />
                </div>
            </div>

            <h3>Address</h3>
            <div className="form-group">
                <label>Street Address:</label>
                <input
                    type="text"
                    value={get(['address', 'street'])}
                    onChange={streetHandler}
                />
            </div>
            
            <div className="form-row">
                <div className="form-group">
                    <label>City:</label>
                    <input
                        type="text"
                        value={get(['address', 'city'])}
                        onChange={cityHandler}
                    />
                </div>
                <div className="form-group">
                    <label>State:</label>
                    <input
                        type="text"
                        value={get(['address', 'state'])}
                        onChange={stateHandler}
                    />
                </div>
                <div className="form-group">
                    <label>ZIP Code:</label>
                    <input
                        type="text"
                        value={get(['address', 'zipCode'])}
                        onChange={zipHandler}
                    />
                </div>
            </div>
            
            <div className="form-group">
                <label>Country:</label>
                <select value={get(['address', 'country'])} onChange={countryHandler}>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                </select>
            </div>
        </div>
    );
}

function PreferencesStep() {
    const { get } = useFlatState(registrationState, ['user', 'preferences']);
    
    const newsletterHandler = registrationState.createCheckboxEventHandler(['user', 'preferences', 'newsletter']);
    const smsHandler = registrationState.createCheckboxEventHandler(['user', 'preferences', 'smsNotifications']);
    const marketingHandler = registrationState.createCheckboxEventHandler(['user', 'preferences', 'marketing']);

    return (
        <div className="step preferences-step">
            <h2>Communication Preferences</h2>
            
            <div className="form-group">
                <label>
                    <input
                        type="checkbox"
                        checked={get(['newsletter'])}
                        onChange={newsletterHandler}
                    />
                    Subscribe to newsletter
                </label>
                <small>Receive weekly updates about new features and promotions</small>
            </div>
            
            <div className="form-group">
                <label>
                    <input
                        type="checkbox"
                        checked={get(['smsNotifications'])}
                        onChange={smsHandler}
                    />
                    SMS notifications
                </label>
                <small>Receive important account notifications via SMS</small>
            </div>
            
            <div className="form-group">
                <label>
                    <input
                        type="checkbox"
                        checked={get(['marketing'])}
                        onChange={marketingHandler}
                    />
                    Marketing communications
                </label>
                <small>Receive promotional offers and product recommendations</small>
            </div>

            <div className="summary">
                <h3>Registration Summary</h3>
                <RegistrationSummary />
            </div>
        </div>
    );
}

function RegistrationSummary() {
    const { get } = useFlatState(registrationState, ['user']);
    
    const accountType = get(['accountType']);
    const contact = get(['contact']);
    const preferences = get(['preferences']);

    return (
        <div className="summary-content">
            <div className="summary-section">
                <h4>Account Type</h4>
                <p>{accountType === 'personal' ? 'Personal Account' : 'Business Account'}</p>
                
                {accountType === 'personal' && (
                    <p>{get(['personal', 'firstName'])} {get(['personal', 'lastName'])}</p>
                )}
                
                {accountType === 'business' && (
                    <p>{get(['business', 'companyName'])}</p>
                )}
            </div>
            
            <div className="summary-section">
                <h4>Contact</h4>
                <p>{contact.email}</p>
                {contact.phone && <p>{contact.phone}</p>}
            </div>
            
            <div className="summary-section">
                <h4>Preferences</h4>
                <ul>
                    {preferences.newsletter && <li>Newsletter subscription</li>}
                    {preferences.smsNotifications && <li>SMS notifications</li>}
                    {preferences.marketing && <li>Marketing communications</li>}
                </ul>
            </div>
        </div>
    );
}
```

## Form Array Management

### Dynamic List with Add/Remove

```javascript
const surveyState = new FlatState({
    survey: {
        title: '',
        description: '',
        questions: []
    }
});

function SurveyBuilder() {
    const { get } = useFlatState(surveyState, ['survey']);
    
    const addQuestion = () => {
        surveyState.append(['survey', 'questions'], {
            id: Date.now(),
            type: 'text',
            question: '',
            required: false,
            options: [] // For multiple choice questions
        });
    };
    
    const removeQuestion = (index) => {
        surveyState.destroy(['survey', 'questions'], index);
    };
    
    const questions = get(['questions']) || [];

    return (
        <div className="survey-builder">
            <div className="survey-header">
                <input
                    type="text"
                    placeholder="Survey Title"
                    value={get(['title'])}
                    onChange={surveyState.createEventTargetPathHandler(['survey', 'title'])}
                />
                <textarea
                    placeholder="Survey Description"
                    value={get(['description'])}
                    onChange={surveyState.createEventTargetPathHandler(['survey', 'description'])}
                />
            </div>
            
            <div className="questions-list">
                {questions.map((question, index) => (
                    <QuestionEditor
                        key={question.id}
                        questionIndex={index}
                        onRemove={() => removeQuestion(index)}
                    />
                ))}
                
                <button onClick={addQuestion} className="add-question-btn">
                    Add Question
                </button>
            </div>
        </div>
    );
}

function QuestionEditor({ questionIndex, onRemove }) {
    const questionPath = ['survey', 'questions', questionIndex];
    const { get } = useFlatState(surveyState, questionPath);
    
    const question = get([]);
    
    const updateQuestion = (field, value) => {
        surveyState.set([...questionPath, field], value);
    };
    
    const addOption = () => {
        surveyState.append([...questionPath, 'options'], {
            id: Date.now(),
            text: '',
            value: ''
        });
    };
    
    const removeOption = (optionIndex) => {
        surveyState.destroy([...questionPath, 'options'], optionIndex);
    };

    return (
        <div className="question-editor">
            <div className="question-header">
                <select
                    value={question.type}
                    onChange={(e) => updateQuestion('type', e.target.value)}
                >
                    <option value="text">Text Input</option>
                    <option value="textarea">Long Text</option>
                    <option value="radio">Single Choice</option>
                    <option value="checkbox">Multiple Choice</option>
                    <option value="select">Dropdown</option>
                </select>
                
                <label>
                    <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateQuestion('required', e.target.checked)}
                    />
                    Required
                </label>
                
                <button onClick={onRemove} className="remove-btn">Remove</button>
            </div>
            
            <input
                type="text"
                placeholder="Enter your question"
                value={question.question}
                onChange={(e) => updateQuestion('question', e.target.value)}
                className="question-input"
            />
            
            {['radio', 'checkbox', 'select'].includes(question.type) && (
                <div className="options-editor">
                    <h4>Options:</h4>
                    {(question.options || []).map((option, optionIndex) => (
                        <div key={option.id} className="option-row">
                            <input
                                type="text"
                                placeholder="Option text"
                                value={option.text}
                                onChange={(e) => 
                                    surveyState.set([...questionPath, 'options', optionIndex, 'text'], e.target.value)
                                }
                            />
                            <input
                                type="text"
                                placeholder="Value"
                                value={option.value}
                                onChange={(e) => 
                                    surveyState.set([...questionPath, 'options', optionIndex, 'value'], e.target.value)
                                }
                            />
                            <button onClick={() => removeOption(optionIndex)}>×</button>
                        </div>
                    ))}
                    <button onClick={addOption}>Add Option</button>
                </div>
            )}
        </div>
    );
}
```

## Advanced Form Validation

### Real-time Validation with Custom Rules

```javascript
const advancedFormState = new FlatState({
    form: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: false
    },
    validation: {
        rules: {
            username: {
                required: true,
                minLength: 3,
                maxLength: 20,
                pattern: /^[a-zA-Z0-9_]+$/,
                asyncCheck: true // Check if username is available
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            },
            password: {
                required: true,
                minLength: 8,
                mustInclude: ['uppercase', 'lowercase', 'number', 'special']
            },
            confirmPassword: {
                required: true,
                mustMatch: 'password'
            },
            terms: {
                required: true,
                mustBeTrue: true
            }
        },
        errors: {},
        validating: {},
        valid: {}
    }
});

// Validation engine
class FormValidator {
    constructor(state) {
        this.state = state;
        this.asyncTimeouts = {};
    }

    async validateField(fieldName, value, allData) {
        const rules = this.state.get(['validation', 'rules', fieldName]);
        if (!rules) return null;

        const errors = [];

        // Required validation
        if (rules.required && !value) {
            errors.push(`${fieldName} is required`);
        }

        if (value) {
            // Length validation
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
            }
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`);
            }

            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(`${fieldName} format is invalid`);
            }

            // Password strength validation
            if (rules.mustInclude) {
                const checks = {
                    uppercase: /[A-Z]/.test(value),
                    lowercase: /[a-z]/.test(value),
                    number: /\d/.test(value),
                    special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
                };

                rules.mustInclude.forEach(requirement => {
                    if (!checks[requirement]) {
                        errors.push(`${fieldName} must include ${requirement} characters`);
                    }
                });
            }

            // Match validation
            if (rules.mustMatch) {
                const matchField = allData[rules.mustMatch];
                if (value !== matchField) {
                    errors.push(`${fieldName} must match ${rules.mustMatch}`);
                }
            }
        }

        // Boolean validation
        if (rules.mustBeTrue && !value) {
            errors.push(`You must accept the ${fieldName}`);
        }

        // Async validation
        if (rules.asyncCheck && errors.length === 0) {
            errors.push(...await this.performAsyncValidation(fieldName, value));
        }

        return errors.length > 0 ? errors : null;
    }

    async performAsyncValidation(fieldName, value) {
        if (fieldName === 'username') {
            // Simulate API call to check username availability
            this.state.set(['validation', 'validating', fieldName], true);
            
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Simulate some usernames being taken
                const takenUsernames = ['admin', 'user', 'test', 'demo'];
                if (takenUsernames.includes(value.toLowerCase())) {
                    return ['Username is already taken'];
                }
                
                return [];
            } catch (error) {
                return ['Unable to verify username availability'];
            } finally {
                this.state.set(['validation', 'validating', fieldName], false);
            }
        }
        
        return [];
    }

    async validateAll() {
        const formData = this.state.get(['form']);
        const rules = this.state.get(['validation', 'rules']);
        
        const validationPromises = Object.keys(rules).map(async (fieldName) => {
            const errors = await this.validateField(fieldName, formData[fieldName], formData);
            return { fieldName, errors };
        });
        
        const results = await Promise.all(validationPromises);
        
        const allErrors = {};
        const validFields = {};
        
        results.forEach(({ fieldName, errors }) => {
            if (errors) {
                allErrors[fieldName] = errors;
                validFields[fieldName] = false;
            } else {
                validFields[fieldName] = true;
            }
        });
        
        this.state.set(['validation', 'errors'], allErrors);
        this.state.set(['validation', 'valid'], validFields);
        
        return Object.keys(allErrors).length === 0;
    }

    setupRealtimeValidation() {
        this.state.setSetterCallback((props) => {
            if (props.path[0] === 'form') {
                const fieldName = props.path[1];
                const value = props.value;
                const formData = this.state.get(['form']);
                
                // Debounce validation
                clearTimeout(this.asyncTimeouts[fieldName]);
                this.asyncTimeouts[fieldName] = setTimeout(async () => {
                    const errors = await this.validateField(fieldName, value, formData);
                    
                    if (errors) {
                        this.state.set(['validation', 'errors', fieldName], errors);
                        this.state.set(['validation', 'valid', fieldName], false);
                    } else {
                        this.state.set(['validation', 'errors', fieldName], null);
                        this.state.set(['validation', 'valid', fieldName], true);
                    }
                }, 500);
            }
        });
    }
}

// Initialize validator
const validator = new FormValidator(advancedFormState);
validator.setupRealtimeValidation();

function AdvancedForm() {
    const { get } = useFlatState(advancedFormState);
    
    const formData = get(['form']);
    const errors = get(['validation', 'errors']);
    const validating = get(['validation', 'validating']);
    const valid = get(['validation', 'valid']);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const isValid = await validator.validateAll();
        
        if (isValid) {
            console.log('Form submitted:', formData);
            // Submit form
        }
    };

    return (
        <form onSubmit={handleSubmit} className="advanced-form">
            <FormField
                label="Username"
                name="username"
                value={formData.username}
                errors={errors.username}
                validating={validating.username}
                valid={valid.username}
                handler={advancedFormState.createEventTargetPathHandler(['form', 'username'])}
            />
            
            <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                errors={errors.email}
                valid={valid.email}
                handler={advancedFormState.createEventTargetPathHandler(['form', 'email'])}
            />
            
            <FormField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                errors={errors.password}
                valid={valid.password}
                handler={advancedFormState.createEventTargetPathHandler(['form', 'password'])}
            />
            
            <FormField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                errors={errors.confirmPassword}
                valid={valid.confirmPassword}
                handler={advancedFormState.createEventTargetPathHandler(['form', 'confirmPassword'])}
            />
            
            <div className="form-group">
                <label>
                    <input
                        type="checkbox"
                        checked={formData.terms}
                        onChange={advancedFormState.createCheckboxEventHandler(['form', 'terms'])}
                    />
                    I agree to the terms and conditions
                </label>
                {errors.terms && (
                    <div className="error-messages">
                        {errors.terms.map((error, index) => (
                            <div key={index} className="error">{error}</div>
                        ))}
                    </div>
                )}
            </div>
            
            <button 
                type="submit" 
                disabled={Object.values(validating).some(v => v)}
                className="submit-btn"
            >
                Create Account
            </button>
        </form>
    );
}

function FormField({ label, name, type = 'text', value, errors, validating, valid, handler }) {
    const fieldClass = `form-field ${valid === true ? 'valid' : ''} ${valid === false ? 'invalid' : ''}`;
    
    return (
        <div className={fieldClass}>
            <label>{label}</label>
            <div className="input-wrapper">
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={handler}
                    className={validating ? 'validating' : ''}
                />
                {validating && <div className="spinner">⟳</div>}
                {valid === true && <div className="success-icon">✓</div>}
                {valid === false && <div className="error-icon">✗</div>}
            </div>
            {errors && (
                <div className="error-messages">
                    {errors.map((error, index) => (
                        <div key={index} className="error">{error}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

This comprehensive guide covers form handling from basic forms to complex multi-step forms with advanced validation. FlatState's event handlers and reactive updates make it easy to create powerful, user-friendly forms.