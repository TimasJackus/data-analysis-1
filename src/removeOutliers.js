const csvjson = require('csvjson');
const fs = require('fs');
const math = require('mathjs');

var options = {
    quote     : '"',
    delimiter: '',
};

const removeOutliers = (items) => {
    const outlierData = {};

    const buildOutlierData = (items, columns) => {
        columns.forEach(column => {
            const q1 = Number(math.quantileSeq(items.map(item => Number(item[column])), 0.25));
            const q3 = Number(math.quantileSeq(items.map(item => Number(item[column])), 0.75));
            const h = Number(q3 - q1);
            const outerBarrier = [q1 - (3 * h), q3 + (3 * h)];
            const innerBarrier = [q1 - (1.5 * h), q3 + (1.5 * h)];
            outlierData[column] = {
                q1,
                q3,
                h,
                outerBarrier,
                innerBarrier
            };
        });
    };

    const isOuterOutlier = (item, columns ) => {
        return columns.find(column => {
            if (item[column] < outlierData[column].outerBarrier[0]) {
                return true;
            }
            if (item[column] > outlierData[column].outerBarrier[1]) {
                return true;
            }
            return false;
        }) ? true : false;
    };

    const isInnerOutlier = (item, columns) => {
        return columns.find(column => {
            if (item[column] < outlierData[column].innerBarrier[0] && item[column] > outlierData[column].outerBarrier[0]) {
                return true;
            }
            if (item[column] > outlierData[column].innerBarrier[1] && item[column] < outlierData[column].outerBarrier[1]) {
                return true;
            }
            return false
        }) ? true : false;
    };

    const columns = ["Revenue", "Expenses", "Profit", "Employees", "Growth"];
    buildOutlierData(items, columns);
    items = items.filter(item => !isOuterOutlier(item, columns));
    innerOutliers = items.filter(item => isInnerOutlier(item, columns));
    // inner outliers
    const innerOutliersCSV = csvjson.toCSV(innerOutliers, { ...options, headers: 'key' });
    fs.writeFileSync('src/data/inner_outliers.csv', innerOutliersCSV, { encoding : 'utf8'});
    return items;
};

module.exports = removeOutliers;