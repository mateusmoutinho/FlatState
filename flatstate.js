

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
            current = current[key];
        }
        
        return current;
    }

    getState() {
        return this.mainObject;
    }

}

module.exports = FlatState;