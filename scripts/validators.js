// An object to hold all our validation regular expressions
const validationRules = {
    // Description: a non-empty string, trims whitespace.
    description: /^s*(\S+(\s+\S+)*)\s*$/,

    // Amount: a positive number with up to two decimal places.
    amount: /^\d+(\.\d{1,2})?$/,

    // Date: must be in YYYY-MM-DD format.
    date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,

    // Category: allows letters, spaces, and hyphens.
    category: /^[A-Za-z\s\-]+$/,

    // Advanced: finds any repeated word back-to-back (e.g., "the the").
    duplicateWord: /\b(\w+)\s+\1\b/,
};

/**
 * A safe function to compile a user-provided string into a RegExp object.
 * Prevents the app from crashing if the user enters an invalid regex pattern.
 * @param {string} input The raw string pattern from the user.
 * @param {string} flags The regex flags (e.g., 'i' for case-insensitive).
 * @returns {RegExp|null} A RegExp object if valid, otherwise null.
 */
function compileRegex(input, flags = 'i') {
    try {
        return new RegExp(input, flags);
    } catch (e) {
        console.error("Invalid regular expression:", e);
        return null;
    }
}
/**
 * Validates the structure of imported JSON data.
 * @param {object} data The parsed JSON data.
 * @returns {boolean} True if the data is valid, false otherwise.
 */
function validateImportedData(data) {
    if (typeof data !== 'object' || data === null) return false;

    // Check for the presence of the 'records' array
    if (!Array.isArray(data.records)) return false;

    // Optionally, check if the first record has the expected structure
    if (data.records.length > 0) {
        const firstRecord = data.records[0];
        const requiredKeys = ['id', 'description', 'amount', 'category', 'date'];
        return requiredKeys.every(key => key in firstRecord);
    }

    // It's valid even if there are no records
    return true;
}