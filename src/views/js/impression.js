// eslint-disable-next-line @typescript-eslint/no-unused-vars
var render = function (data) {
    var table, mapping, chart;
    // set the data
    table = anychart.data.table();
    table.addData(data);

    // map the data
    mapping = table.mapAs({
        high: 1,
        low: 2,
        value: 3,
    });

    // chart type
    var chart = anychart.stock();

    var rangePlot = chart.plot(0);

    var series = rangePlot.hilo(mapping);
    series.name('Daily Hi-lo');

    var trendPlot = chart.plot(1);

    var ema3 = trendPlot.ema(mapping, 3).series();
    ema3.name('3-day weighted avg');

    var ema10 = trendPlot.ema(mapping, 10).series();
    ema10.name('10-day weighted avg');

    var ema30 = trendPlot.ema(mapping, 30).series();
    ema30.name('30-day weighted avg');

    var ema90 = trendPlot.ema(mapping, 90).series();
    ema90.name('90-day weighted avg');

    // Set up vertical gridlines
    rangePlot.yMinorGrid().palette(['White', null]);
    trendPlot.yMinorGrid().palette(['White', null]);

    chart.title('Mood');

    chart.background().fill('#EEE');
    chart.container('container');
    chart.draw();

    var rangeSelector = anychart.ui.rangeSelector();
    var rangePicker = anychart.ui.rangePicker();

    var customRanges = [
        {
            text: 'Quarter',
            type: 'unit',
            unit: 'quarter',
            count: 1,
        },
        {
            text: 'Half',
            type: 'unit',
            unit: 'semester',
            count: 1,
        },
        {
            text: 'Year',
            type: 'unit',
            unit: 'year',
            count: 1,
        },
        {
            text: '500 Days',
            type: 'points',
            count: 490,
        },
        {
            text: 'All',
            type: 'max',
        },
    ];

    rangeSelector.ranges(customRanges);

    rangePicker.render(chart);
    rangeSelector.render(chart);
};
