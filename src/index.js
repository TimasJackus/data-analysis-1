const csvjson = require('csvjson');
const fs = require('fs');
const fillMissingData = require('./fill-missing-data');
const removeOutliers = require('./removeOutliers');
const jstat = require('jstat');
const math = require('mathjs');
const buildChart = require('./buildChart');

const data = fs.readFileSync('src/dataset.csv', { encoding : 'utf8'});

var options = {
    quote     : '"',
    delimiter: '',
};

let items = csvjson.toObject(data, options);
items = fillMissingData(items);
items = removeOutliers(items);

const normData = {};

const buildNormData = (items, columns) => {
    columns.forEach(column => {
        const values = items.map(item => item[column]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const mean = math.mean(...values);
        const std = math.std(...values);
        normData[column] = {
            min,
            max,
            mean,
            std
        };
    });
};

const columns = ["Revenue", "Expenses", "Profit", "Employees", "Growth"];
buildNormData(items, columns);

const normByMinMax = (items, columns) => {
    return items.map(item => {
        const itemCopy = { ...item };
        columns.forEach(column => {
            const { min, max } = normData[column];
            itemCopy[column] = (itemCopy[column] - min) / (max - min);
        });
        return itemCopy;
    });
};

const normByCovariance = (items, columns) => {
    return items.map(item => {
        const itemCopy = { ...item };
        columns.forEach(column => {
            const { mean, std } = normData[column];
            itemCopy[column] = (itemCopy[column] - mean) / std;
        });
        return itemCopy;
    });
};

normedItemsByMinMax = normByMinMax(items, columns);
normedItemsByCovariance = normByCovariance(items, columns);

// const chartData = columns.map(column => minMaxData[column].max);
// console.log(chartData);

// buildChart.histogramChart(chartData);

// ------------------
// Correlation table
const capitalize = (lower) => {
    return lower.charAt(0).toUpperCase() + lower.substring(1);
}

const buildCorrelationTable = (fileName, array, columns) => {
    const correlationArray = []
    columns.forEach(column => {
        const columnArray = { Column: capitalize(column) };
        const columnValues = array.map(item => item[column]);
        columns.forEach(secondColumn => {
            const secondColumnValues = array.map(item => item[secondColumn]);
            Object.assign(columnArray, { [secondColumn]: jstat.corrcoeff(columnValues, secondColumnValues) });
        });
        correlationArray.push(columnArray);
    });
    const tableCSV = csvjson.toCSV(correlationArray, { ...options, headers: 'key' });
    fs.writeFileSync(`src/${fileName}.csv`, tableCSV, { encoding : 'utf8'});
};

buildCorrelationTable("min_max_corr", normedItemsByMinMax, columns);
buildCorrelationTable("cov_corr", normedItemsByCovariance, columns);
buildCorrelationTable("not_normed_corr", items, columns);
// ------------------


const itemsCSV = csvjson.toCSV(items, { ...options, headers: 'key' });
fs.writeFileSync('src/output.csv', itemsCSV, { encoding : 'utf8'});
const normedItemsByMinMaxCSV = csvjson.toCSV(normedItemsByMinMax, { ...options, headers: 'key' });
fs.writeFileSync('src/normed_by_min_max.csv', normedItemsByMinMaxCSV, { encoding : 'utf8'});
const normedItemsByCovarianceCSV = csvjson.toCSV(normedItemsByCovariance, { ...options, headers: 'key' });
fs.writeFileSync('src/normed_by_covariance.csv', normedItemsByCovarianceCSV, { encoding : 'utf8'});
