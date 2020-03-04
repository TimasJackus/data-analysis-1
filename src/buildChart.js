const fs = require('fs');
const Handlebars = require('handlebars');

const histogramChart = (array1, array2, fileName) => {
    const template = fs.readFileSync('src/templates/bar.hbs', { encoding : 'utf8'});
    const barHTML = Handlebars.compile(template);
    array1 = JSON.stringify(array1);
    array2 = JSON.stringify(array2);
    fs.writeFileSync(`src/charts/${fileName}.html`, barHTML({ array1, array2 }), { encoding : 'utf8'});
} ;

exports.histogramChart = histogramChart;