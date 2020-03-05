const csvjson = require('csvjson');
const fs = require('fs');
const fillMissingData = require('./fill-missing-data');
const removeOutliers = require('./removeOutliers');
const jstat = require('jstat');
const math = require('mathjs');
const buildChart = require('./buildChart');

const data = fs.readFileSync('src/data/input.csv', { encoding : 'utf8'});
const columns = ["Revenue", "Expenses", "Profit", "Employees", "Growth"];

var options = {
    quote     : '"',
    delimiter: '',
};

let items = csvjson.toObject(data, options);
items = fillMissingData(items);
const summary = {};
columns.forEach(column => {
    const array = items.map(item => item[column]);
    summary[column] = {
        min: Math.min(...array),
        max: Math.max(...array),
        q1: Number(math.quantileSeq(array, 0.25)),
        q3: Number(math.quantileSeq(array, 0.75)),
        mean: math.mean(...array),
        variance: math.variance(...array),
        median: math.median(...array),
        std: math.std(...array)
    };
});

// console.log('summary before remove outliers: ', summary);

items = removeOutliers(items, columns);

columns.forEach(column => {
    const array = items.map(item => item[column]);
    summary[column] = {
        min: Math.min(...array),
        max: Math.max(...array),
        q1: Number(math.quantileSeq(array, 0.25)),
        q3: Number(math.quantileSeq(array, 0.75)),
        mean: math.mean(...array),
        variance: math.variance(...array),
        median: math.median(...array),
        std: math.std(...array)
    };
});
// console.log('summary after remove outliers: ', summary);

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

const normedItemsByMinMax = normByMinMax(items, columns);
const normedItemsByCovariance = normByCovariance(items, columns);



// ------------------
// Correlation table
const buildCorrelationTable = (fileName, array, columns) => {
    const correlationArray = []
    columns.forEach(column => {
        const columnArray = { Column: column };
        const columnValues = array.map(item => item[column]);
        columns.forEach(secondColumn => {
            const secondColumnValues = array.map(item => item[secondColumn]);
            Object.assign(columnArray, { [secondColumn]: jstat.corrcoeff(columnValues, secondColumnValues) });
        });
        correlationArray.push(columnArray);
    });
    const tableCSV = csvjson.toCSV(correlationArray, { ...options, headers: 'key' });
    fs.writeFileSync(`src/data/${fileName}.csv`, tableCSV, { encoding : 'utf8'});
};

buildCorrelationTable("min_max_corr", normedItemsByMinMax, columns);
buildCorrelationTable("cov_corr", normedItemsByCovariance, columns);
buildCorrelationTable("not_normed_corr", items, columns);
// ------------------

const regression = require('regression');

const buildDiagram = (items, xColumn, yColumn, type = 'bar') => {
    let industries = new Set();
    items.forEach(item => industries.add(item[xColumn]));
    industries = [...industries];
    const industryValues = {};
    industries.forEach(key => Object.assign(industryValues, { [key]: [] }));

    items.forEach(item => {
        industryValues[item[xColumn]].push(item[yColumn]);
    });

    industries = industries.map(industry => {
        return {
            label: industry,
            value: math.mean(...industryValues[industry])
        }
    }).sort((a, b) => b.value - a.value);

    if (type === 'scatter') {
        const result = regression.linear(industries.map(item => [item.label, item.value]));
        const lineX = result.points.map(point => point[0]);
        const lineY = result.points.map(point => point[1]);
        buildChart.chart(industries, `${xColumn}_${yColumn}`.toLowerCase(), type, { lineX, lineY });
        return;
    }
    buildChart.chart(industries, `${xColumn}_${yColumn}`.toLowerCase(), type);
};
buildDiagram(items, "Industry", "Revenue");
buildDiagram(items, "Industry", "Profit");
buildDiagram(items, "Industry", "Growth");
buildDiagram(items, "Industry", "Employees");
buildDiagram(items, "State", "Profit");
//
buildDiagram(items, "Revenue", "Profit", 'scatter');
buildDiagram(items, "Profit", "Expenses", 'scatter');
buildDiagram(items, "Revenue", "Growth", 'scatter');
buildDiagram(items, "Revenue", "Expenses", 'scatter');
//
const buildFreqDiagram = (items, column, type = 'bar') => {
    let industries = {};
    items.forEach(item => {
        if (!industries[item[column]]) {
            industries[item[column]] = 1;
        } else {
            industries[item[column]] += 1;
        }
    });
    const array = Object.keys(industries).map(label => {
        return {
            label,
            value: industries[label]
        };
    }).sort((a, b) => b.value - a.value);;


    buildChart.chart(array, `${column}_frequency`.toLowerCase(), type);
};
buildFreqDiagram(items, "Industry");
buildFreqDiagram(items, "State");

const buildBoxDiagram = (items, column) => {
    const array = items.map(item => item[column]);

    buildChart.boxChart(array, `${column}_box`.toLowerCase(), column);
};

buildBoxDiagram(items, "Revenue");
buildBoxDiagram(items, "Employees");
buildBoxDiagram(items, "Expenses");
buildBoxDiagram(items, "Profit");
buildBoxDiagram(items, "Growth");


const itemsCSV = csvjson.toCSV(items, { ...options, headers: 'key' });
fs.writeFileSync('src/data/output.csv', itemsCSV, { encoding : 'utf8'});
const normedItemsByMinMaxCSV = csvjson.toCSV(normedItemsByMinMax, { ...options, headers: 'key' });
fs.writeFileSync('src/data/normed_by_min_max.csv', normedItemsByMinMaxCSV, { encoding : 'utf8'});
const normedItemsByCovarianceCSV = csvjson.toCSV(normedItemsByCovariance, { ...options, headers: 'key' });
fs.writeFileSync('src/data/normed_by_covariance.csv', normedItemsByCovarianceCSV, { encoding : 'utf8'});
