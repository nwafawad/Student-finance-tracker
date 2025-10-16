// scripts/search.js
/**
 * Filters records based on a search query and highlights matches.
 * @param {Array<object>} records - The array of records to filter.
 * @param {string} query - The search string or regex pattern.
 * @param {boolean} isCaseSensitive - Whether the search should be case-sensitive.
 * @returns {{filteredRecords: Array<object>, searchRegex: RegExp|null}} An object containing the filtered records and the regex used.
 */
function filterAndHighlight(records, query, isCaseSensitive) {
    // If the query is empty, return all records without highlighting
    if (!query) {
        return { filteredRecords: records, searchRegex: null };
    }

    // Use our safe compiler to create a regular expression
    const flags = isCaseSensitive ? 'g' : 'gi'; // 'g' for global, 'i' for case-insensitive
    const searchRegex = compileRegex(query, flags);

    // If the regex is invalid, return all records
    if (!searchRegex) {
        return { filteredRecords: records, searchRegex: null };
    }

    const filteredRecords = records.filter(record => {
        // Test the regex against the description and category fields
        return searchRegex.test(record.description) || searchRegex.test(record.category);
    });

    return { filteredRecords, searchRegex };
}