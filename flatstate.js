

class FlatState{
    constructor(mainObject = {}){
        this.mainObject = mainObject;
    }
    set(path, value){
        if (!Array.isArray(path) || path.length === 0) {
            throw new Error('Path must be a non-empty array');
        }
        
        let current = this.mainObject;
        
        // Traverse the path, creating objects/arrays as needed
        for (let i = 0; i < path.length - 1; i++) {
            let key = path[i];
            let nextKey = path[i + 1];
            
            // If current[key] doesn't exist, create it
            if (current[key] === undefined || current[key] === null) {
                // If next key is a number, create an array
                if (typeof nextKey === 'number') {
                    current[key] = [];
                } else {
                    // Otherwise create an object
                    current[key] = {};
                }
            }
            
            current = current[key];
        }
        
        // Set the final value
        current[path[path.length - 1]] = value;
    }
    get(path) {
        if (!Array.isArray(path)) {
            throw new Error('Path must be an array');
        }
        
        let current = this.mainObject;
        
        for (let key of path) {
            if (current === undefined || current === null) {
                return undefined;
            }
            
            // Handle negative indices for arrays
            if (Array.isArray(current) && typeof key === 'number' && key < 0) {
                key = current.length + key;
                // If the calculated index is still negative, return undefined
                if (key < 0) {
                    return undefined;
                }
            }
            
            current = current[key];
        }
        
        return current;
    }

    getState() {
        return this.mainObject;
    }

    

    createValueSetterHandler(path){
        return (newValue) => {
            this.set(path, newValue);
        }
    }
    createEventTargetPathHandler(path){
        return (event) => {
            console.log('Event target value:', event.target.value);
            this.set(path, event.target.value);
        }
    }

    createCheckboxHandler(path){
        return (event) => {
            this.set(path, event.target.checked);
        }
    }

    createNumberHandler(path){
        return (event) => {
            const value = parseFloat(event.target.value);
            this.set(path, isNaN(value) ? 0 : value);
        }
    }

    createIntegerHandler(path){
        return (event) => {
            const value = parseInt(event.target.value, 10);
            this.set(path, isNaN(value) ? 0 : value);
        }
    }

    createArrayPushHandler(path, item = null){
        return () => {
            const currentArray = this.get(path) || [];
            if (!Array.isArray(currentArray)) {
                this.set(path, []);
            }
            const array = this.get(path);
            array.push(item);
        }
    }

    createArrayRemoveHandler(path, index){
        return () => {
            const array = this.get(path);
            if (Array.isArray(array) && index >= 0 && index < array.length) {
                array.splice(index, 1);
            }
        }
    }

    createToggleHandler(path){
        return () => {
            const currentValue = this.get(path);
            this.set(path, !currentValue);
        }
    }

    createIncrementHandler(path, step = 1){
        return () => {
            const currentValue = this.get(path) || 0;
            this.set(path, currentValue + step);
        }
    }

    createDecrementHandler(path, step = 1){
        return () => {
            const currentValue = this.get(path) || 0;
            this.set(path, currentValue - step);
        }
    }

    createSelectHandler(path){
        return (event) => {
            const selectedOptions = Array.from(event.target.selectedOptions);
            if (event.target.multiple) {
                this.set(path, selectedOptions.map(option => option.value));
            } else {
                this.set(path, event.target.value);
            }
        }
    }

    createFormHandler(pathMap){
        return (event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            for (const [fieldName, path] of Object.entries(pathMap)) {
                const value = formData.get(fieldName);
                this.set(path, value);
            }
        }
    }

    createResetHandler(path, defaultValue = null){
        return () => {
            this.set(path, defaultValue);
        }
    }


}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlatState;
} 