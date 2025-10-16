// scripts/charts.js
/**
 * Calculates summary statistics from the records.
 * @param {Array<object>} records The array of record objects.
 * @returns {object} An object containing the calculated stats.
 */
function calculateStats(records) {
    if (!records || records.length === 0) {
        return {
            totalRecords: 0,
            totalAmount: 0,
            topCategory7Days: 'N/A',
            sparklineData: Array(7).fill(0) // Array of 7 zeros
        };
    }

    // Calculate Total Records and Amount
    const totalRecords = records.length;
    const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);

    // Filter records for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRecords = records.filter(r => new Date(r.date) >= sevenDaysAgo);

    // Find the top spending category in the last 7 days
    let topCategory7Days = 'N/A';
    if (recentRecords.length > 0) {
        const spendingByCategory = recentRecords.reduce((acc, record) => {
            acc[record.category] = (acc[record.category] || 0) + record.amount;
            return acc;
        }, {});

        topCategory7Days = Object.keys(spendingByCategory).reduce((a, b) =>
            spendingByCategory[a] > spendingByCategory[b] ? a : b
        );
    }

    // Prepare data for the sparkline (total spending for each of the last 7 days)
    const dailyTotals = Array(7).fill(0);
    const today = new Date();
    recentRecords.forEach(record => {
        const recordDate = new Date(record.date);
        const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
            dailyTotals[6 - diffDays] += record.amount;
        }
    });

    return { totalRecords, totalAmount, topCategory7Days, sparklineData: dailyTotals };
}