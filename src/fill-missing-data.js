const math = require('mathjs');

function fillMissingData(items) {
    items.forEach(item => {
        item["Growth"] = item["Growth"].replace('%', '');
        item["Revenue"] = item["Revenue"].split('$').join('').split(',').join('');
        item["Expenses"] = item["Expenses"].split(' Dollars').join('').split(',').join('');
    })
    
    
    const calculateMedian = (column, industry) => {
        const filteredItems = items.filter(item => {
            return (item[column].length !== 0 && item["Industry"] === industry);
        });
    
        const values = filteredItems.map(item => Number(item[column]));
        return math.round(math.median(values));
    };
    
    const medians = {};
    
    const getMedian = (column, industry) => {
        const name = `${column}:${industry}`;
        if (!medians[name]) {
            return calculateMedian(column, industry);
        }
        return Number(medians[name]);
    };
    
    const calculateMedianByColumnByIndustry = (column, secondColumn, thirdColumn, item, add = false) => {
        const multiplier = add ? -1 : 1;
        if (item[column].length === 0) {
            if (item[secondColumn].length !== 0 && item[thirdColumn].length !== 0) {
                const value = Number(item[secondColumn]) - Number(item[thirdColumn]) * multiplier;
                return value;
            }
            return getMedian(column, item["Industry"]);
        }
        return Number(item[column]);
    };
    
    items.forEach(item => {
        item["Revenue"] = calculateMedianByColumnByIndustry("Revenue", "Expenses", "Profit", item, true);
        item["Expenses"] = calculateMedianByColumnByIndustry("Expenses", "Revenue", "Profit", item);
        item["Profit"] = calculateMedianByColumnByIndustry("Profit", "Revenue", "Expenses", item);
        if (item["Growth"].length === 0) {
            item["Growth"] = getMedian("Growth", item["Industry"]);
        } else {
            item["Growth"] = Number(item["Growth"]);
        }
        if (item["Employees"].length === 0) {
            item["Employees"] = getMedian("Employees", item["Industry"]);
        } else {
            item["Employees"] = Number(item["Employees"]);
        }
    });

    return items;
}

module.exports = fillMissingData;