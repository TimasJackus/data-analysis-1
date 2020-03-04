const fs = require('fs');
const Handlebars = require('handlebars');

const histogramChart = (data) => {

    const template = fs.readFileSync('src/templates/bar.hbs', { encoding : 'utf8'});
    const barHTML = Handlebars.compile(template);

    fs.writeFileSync('src/charts/chart.html', barHTML({ data, title: 'Bar chart', label: '# of Test' }), { encoding : 'utf8'});
} ;

exports.histogramChart = histogramChart;