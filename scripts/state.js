const state = {
    // The list of all financial records
    records: [],
    // Keep track of the current sort column and direction
    sortBy: 'date_desc', // Default sorting
    budgetCap: 0, // A budget of 0 means no cap is set
    editingRecordId: null, // Will hold the ID of the record being edited
};