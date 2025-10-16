const STORAGE_KEY = 'finance-tracker-state';

/**
 * Saves the current application state to localStorage.
 * @param {object} currentState The state object to save.
 */
function saveState(currentState) {
    try {
        const jsonState = JSON.stringify(currentState);
        localStorage.setItem(STORAGE_KEY, jsonState);
    } catch (error) {
        console.error("Could not save state to localStorage", error);
    }
}

/**
 * Loads the application state from localStorage.
 * If no state is found, it loads the initial seed data.
 * @returns {Promise<object>} A promise that resolves to the loaded state object.
 */
async function loadState() {
    try {
        const jsonState = localStorage.getItem(STORAGE_KEY);

        // If there's saved data, parse and return it
        if (jsonState) {
            return JSON.parse(jsonState);
        }

        // If no saved data, fetch and use the seed data
        console.log("No saved state found. Loading seed data...");
        const response = await fetch('../seed.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const seedData = await response.json();

        // Return a state object that includes the seed data
        return { records: seedData };

    } catch (error) {
        console.error("Could not load state from localStorage or seed.json", error);
        // Return a default empty state in case of any errors
        return { records: [] };
    }
}