// Get a reference to the table body
const tableBody = document.querySelector('#records-table-body');
const searchInput = document.querySelector('#search-input');
const caseToggle = document.querySelector('#case-sensitive-toggle');
const budgetInput = document.querySelector('#budget-cap-input');
const ariaAnnouncer = document.querySelector('#aria-announcer');
const exportBtn = document.querySelector('#export-data-btn');
const importInput = document.querySelector('#import-data-input');
const importStatus = document.querySelector('#import-status');
const form = document.querySelector('#add-edit-form');
const formDescription = document.querySelector('#form-description');
const formAmount = document.querySelector('#form-amount');
const formDate = document.querySelector('#form-date');
const formCategory = document.querySelector('#form-category');

/**
 * Renders the records into the main table.
 * @param {Array<object>} records The array of record objects to render.
 * @param {RegExp|null} searchRegex Optional regex to highlight matches.
 */
function renderTable(records, searchRegex) {
    // Clear any existing content in the table body
    tableBody.innerHTML = '';

    // If there are no records, show a message
    if (!records || records.length === 0) {
        const noRecordsRow = `
            <tr>
                <td colspan="5" class="text-center">No records found.</td>
            </tr>
        `;
        tableBody.innerHTML = noRecordsRow;
        return;
    }

    // Loop through each record and create a table row for it
    records.forEach(record => {
        // Create a new table row element
        const row = document.createElement('tr');
        row.dataset.id = record.id; // Store the record ID for reference

        // Format the amount to 2 decimal places like currency
        const formattedAmount = Number(record.amount).toFixed(2);

        let description = record.description;
        let category = record.category;

        // If there's a valid search regex, highlight matches
        if (searchRegex) {
            description = description.replace(searchRegex, match => `<mark>${match}</mark>`);
            category = category.replace(searchRegex, match => `<mark>${match}</mark>`);
        }

        // Populate the row with cells (td) for each piece of data
        row.innerHTML = `
            <td>${record.date}</td>
            <td>${record.description}</td>
            <td>${record.category}</td>
            <td class="text-right">$${formattedAmount}</td>
            <td>
                <button class="edit-btn" data-id="${record.id}">Edit</button>
                <button class="delete-btn" data-id="${record.id}">Delete</button>
            </td>
        `;

        // Append the new row to the table body
        tableBody.appendChild(row);
    });
}
/**
 * Sorts the state.records array based on the current state.sortBy value.
 */
function sortRecords() {
    const [key, direction] = state.sortBy.split('_');

    state.records.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        let comparison = 0;

        // Compare based on the type of data
        if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB; // For numbers
        } else {
            comparison = String(valA).localeCompare(String(valB)); // For strings and dates
        }

        // Reverse the sort order if direction is 'desc'
        return direction === 'desc' ? comparison * -1 : comparison;
    });
}
/**
 * Sets up event listeners for the table headers to handle sorting.
 */
function setupSortListeners() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sort;
            const [currentKey, currentDirection] = state.sortBy.split('_');

            let newDirection = 'asc';
            // If clicking the same header, toggle the direction
            if (sortKey === currentKey && currentDirection === 'asc') {
                newDirection = 'desc';
            }

            // Update the state
            state.sortBy = `${sortKey}_${newDirection}`;

            // Re-sort, re-render, and save
            sortRecords();
            renderTable(state.records);
            saveState(state); // Persist the new sort order
        });
    });
}
// handle search input and case sensitivity toggle
function handleSearch() {
    const query = searchInput.value;
    const isCaseSensitive = caseToggle.checked;

    // Filter from the original, complete list of records
    const { filteredRecords, searchRegex } = filterAndHighlight(state.records, query, isCaseSensitive);

    // Re-render the table with only the filtered records and the highlight regex
    renderTable(filteredRecords, searchRegex);
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('main section');

    function showSection(hash) {
        // Default to #records if no hash is provided or it's invalid
        const sectionId = hash ? hash.substring(1) : 'records';

        sections.forEach(section => {
            if (section.id === sectionId) {
                section.removeAttribute('hidden');
            } else {
                section.setAttribute('hidden', true);
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            showSection(event.currentTarget.hash);
        });
    });

    // Show the correct section on initial page load based on the URL hash
    showSection(window.location.hash);
}

function renderDashboard() {
    const stats = calculateStats(state.records);

    document.querySelector('#total-records').textContent = stats.totalRecords;
    document.querySelector('#total-spending').textContent = `$${stats.totalAmount.toFixed(2)}`;
    document.querySelector('#top-category').textContent = stats.topCategory7Days;

    // Render the CSS sparkline
    const sparklineEl = document.querySelector('#sparkline');
    sparklineEl.innerHTML = ''; // Clear previous bars
    const maxVal = Math.max(...stats.sparklineData);
    if (maxVal > 0) {
        stats.sparklineData.forEach(val => {
            const bar = document.createElement('div');
            bar.className = 'sparkline-bar';
            // Set bar height as a percentage of the max value
            bar.style.height = `${(val / maxVal) * 100}%`;
            sparklineEl.appendChild(bar);
        });
    }
}

function updateBudgetStatus() {
    const cap = state.budgetCap;
    if (cap <= 0) {
        ariaAnnouncer.textContent = 'Monthly budget not set.';
        return;
    }

    // Calculate total spending for the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlySpending = state.records
        .filter(r => {
            const recordDate = new Date(r.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        })
        .reduce((sum, r) => sum + r.amount, 0);

    const remaining = cap - monthlySpending;
    let message = '';

    // Change the announcement's urgency based on budget status
    if (remaining < 0) {
        message = `Budget exceeded by $${Math.abs(remaining).toFixed(2)}.`;
        ariaAnnouncer.setAttribute('aria-live', 'assertive'); // Urgent!
    } else {
        message = `You have $${remaining.toFixed(2)} remaining in your budget this month.`;
        ariaAnnouncer.setAttribute('aria-live', 'polite'); // Not urgent
    }
    ariaAnnouncer.textContent = message;
}

function setupSettingsListeners() {
    budgetInput.addEventListener('change', () => {
        const newCap = Number(budgetInput.value) || 0;
        state.budgetCap = newCap;
        saveState(state);
        updateBudgetStatus();
    });
    // Export listener
    exportBtn.addEventListener('click', () => {
        try {
            const jsonState = JSON.stringify(state, null, 2); // Prettify the JSON
            const blob = new Blob([jsonState], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'finance-data.json';

            document.body.appendChild(link);
            link.click(); // Trigger the download
            document.body.removeChild(link); // Clean up

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export data:', error);
            alert('Error exporting data.');
        }
    });

    // Import listener
    importInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!validateImportedData(importedData)) {
                    throw new Error('Invalid or corrupted data file.');
                }

                // Update the global state with imported data
                state.records = importedData.records || [];
                state.sortBy = importedData.sortBy || 'date_desc';
                state.budgetCap = importedData.budgetCap || 0;

                saveState(state); // Persist the new state

                // Refresh the entire UI to show the new data
                budgetInput.value = state.budgetCap > 0 ? state.budgetCap : '';
                fullUIRefresh();

                importStatus.textContent = 'Import successful!';
                importStatus.style.color = 'green';

            } catch (error) {
                console.error('Failed to import data:', error);
                importStatus.textContent = `Error: ${error.message}`;
                importStatus.style.color = 'red';
            } finally {
                // Clear the input so the user can import the same file again
                importInput.value = '';
            }
        };

        reader.onerror = () => {
            importStatus.textContent = 'Error reading the file.';
            importStatus.style.color = 'red';
        };

        reader.readAsText(file);
    });
}

/**
 * A helper function to refresh all parts of the UI that display data.
 */
function fullUIRefresh() {
    sortRecords();
    renderTable(state.records);
    renderDashboard();
    updateBudgetStatus();
    // Reset search to show all new data
    searchInput.value = '';
}

function showValidationError(field, message) {
    const errorEl = document.querySelector(`#error-${field}`);
    errorEl.textContent = message;
}

function handleFormSubmit(event) {
    event.preventDefault(); // Stop the page from reloading

    // --- Basic Validation ---
    let isValid = true;
    // Simple check for description
    if (!formDescription.value.trim()) {
        showValidationError('description', 'Description cannot be empty.');
        isValid = false;
    } else {
        showValidationError('description', '');
    }
    // Check amount with regex
    if (!validationRules.amount.test(formAmount.value)) {
        showValidationError('amount', 'Please enter a valid amount (e.g., 12.50).');
        isValid = false;
    } else {
        showValidationError('amount', '');
    }
    // Check date with regex
    if (!validationRules.date.test(formDate.value)) {
        showValidationError('date', 'Please enter a date in YYYY-MM-DD format.');
        isValid = false;
    } else {
        showValidationError('date', '');
    }
    // Check category
    if (!formCategory.value) {
        showValidationError('category', 'Please select a category.');
        isValid = false;
    } else {
        showValidationError('category', '');
    }

    if (!isValid) return; // Stop if validation fails

    // --- Create New Record ---
    const now = new Date().toISOString();
    if (state.editingRecordId) {
        // UPDATE existing record
        const record = state.records.find(r => r.id === state.editingRecordId);
        record.description = formDescription.value.trim();
        record.amount = Number(formAmount.value);
        record.category = formCategory.value;
        record.date = formDate.value;
        record.updatedAt = now;
    } else {
        // CREATE new record
        const newRecord = {
            id: `rec_${crypto.randomUUID()}`,
            description: formDescription.value.trim(),
            amount: Number(formAmount.value),
            category: formCategory.value,
            date: formDate.value,
            createdAt: now,
            updatedAt: now,
        };
        state.records.push(newRecord);
    }

    // --- Update State and UI ---
    saveState(state);
    fullUIRefresh();

    // --- Reset Form and Navigate ---
    resetForm();
    window.location.hash = '#records'; // Go back to the records view
}

function setupFormListeners() {
    form.addEventListener('submit', handleFormSubmit);
    const cancelButton = form.querySelector('button[type="button"]');
    cancelButton.addEventListener('click', () => {
        resetForm();
        window.location.hash = '#records';
    });
}
/**
 * Populates the form with data from a record for editing.
 * @param {string} recordId The ID of the record to edit.
 */
function populateFormForEdit(recordId) {
    const record = state.records.find(r => r.id === recordId);
    if (!record) return;

    state.editingRecordId = recordId;

    // Fill the form fields
    formDescription.value = record.description;
    formAmount.value = record.amount;
    formDate.value = record.date;
    formCategory.value = record.category;

    // Change UI to "Edit Mode"
    document.querySelector('#form h2').textContent = 'Edit Record';
    form.querySelector('button[type="submit"]').textContent = 'Update Record';

    // Go to the form
    window.location.hash = '#form';
}

/**
 * Handles all click events within the records table body.
 * @param {Event} event The click event object.
 */
function handleTableClick(event) {
    const target = event.target;
    const recordId = target.dataset.id;

    if (!recordId) return;

    // Handle Delete Button Click
    if (target.matches('.delete-btn')) {
        if (confirm('Are you sure you want to delete this record?')) {
            // Create a new array excluding the record to be deleted
            state.records = state.records.filter(record => record.id !== recordId);
            saveState(state);
            fullUIRefresh();
        }
    }
    // Handle Edit Button Click
    if (target.matches('.edit-btn')) {
        populateFormForEdit(recordId);
    }
}

function resetForm() {
    form.reset();
    state.editingRecordId = null;
    document.querySelector('#form h2').textContent = 'Add/Edit Record';
    form.querySelector('button[type="submit"]').textContent = 'Save Record';
    // Clear all error messages
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
}

/**
 * Main initialization function to start the application.
 */
async function initializeApp() {
    // Load the state from storage
    const initialState = await loadState();

    // Update our application's state with the loaded data
    state.records = initialState.records || [];
    state.sortBy = initialState.sortBy || 'date_desc';
    state.budgetCap = initialState.budgetCap || 0;
    budgetInput.value = state.budgetCap > 0 ? state.budgetCap : '';


    // Render the table with the initial data
    sortRecords(); // Perform initial sort based on loaded preference
    renderTable(state.records);
    setupSortListeners(); // Set up the click listeners
    searchInput.addEventListener('input', handleSearch);
    caseToggle.addEventListener('change', handleSearch);
    setupNavigation(); // Set up navigation
    renderDashboard(); // Render the dashboard stats
    setupSettingsListeners();
    updateBudgetStatus(); // Initial check on load
    setupFormListeners(); // Set up form submission handling
    tableBody.addEventListener('click', handleTableClick);
    console.log('Application initialized with state:', state);
}

// Start the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);