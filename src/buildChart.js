const fs = require('fs');
const Handlebars = require('handlebars');

const backgroundColor = [
    'rgba(255, 99, 132, 0.2)',
    'rgba(54, 162, 235, 0.2)',
    'rgba(255, 206, 86, 0.2)',
    'rgba(75, 192, 192, 0.2)',
    'rgba(153, 102, 255, 0.2)',
    'rgba(255, 159, 64, 0.2)'
];

const borderColor = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)'
];

const borderWidth = 1;

const histogramChart = (object) => {
    const template = fs.readFileSync('src/templates/bar.hbs', { encoding : 'utf8'});
    const barHTML = Handlebars.compile(template);
    const array1 = JSON.stringify(object["Revenue"]);
    const array2 = JSON.stringify(object["Profit"]);
    fs.writeFileSync('src/charts/chart.html', barHTML({ array1, array2 }), { encoding : 'utf8'});
} ;

exports.histogramChart = histogramChart;