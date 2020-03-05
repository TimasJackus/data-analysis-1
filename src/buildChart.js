const fs = require('fs');
const Handlebars = require('handlebars');

const chart = (array, fileName, type, lines) => {
    const template = fs.readFileSync(`src/templates/${type}.hbs`, { encoding : 'utf8'});
    const barHTML = Handlebars.compile(template);
    const array1 = JSON.stringify(array.map(item => item.label));
    const array2 = JSON.stringify(array.map(item => item.value));
    let lineX;
    let lineY;
    if (type === 'scatter') {
        lineX = JSON.stringify(lines.lineX);
        lineY = JSON.stringify(lines.lineY);
    }
    fs.writeFileSync(`src/charts/${fileName}.html`, barHTML({ array1, array2, lineX, lineY }), { encoding : 'utf8'});
};

const boxChart = (array, fileName, column) => {
    const template = fs.readFileSync(`src/templates/box.hbs`, { encoding : 'utf8'});
    const barHTML = Handlebars.compile(template);
    array = JSON.stringify(array);
    fs.writeFileSync(`src/charts/${fileName}.html`, barHTML({ array, name: JSON.stringify(column) }), { encoding : 'utf8'});
};

exports.chart = chart;
exports.boxChart = boxChart;