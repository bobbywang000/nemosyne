// eslint-disable-next-line @typescript-eslint/no-unused-vars
var render = function (rangeData, momentData) {
    // create a chart
    var chart = anychart.timeline();

    var rangeSeries = chart.range(rangeData);
    rangeSeries.name('Ranges');

    var momentSeries = chart.moment(momentData);
    momentSeries.name('Moments');

    // set the chart title
    chart.title('Timeline');

    // Scroll settings
    chart.scroller(true);

    // Zoom settings
    chart.interactivity().zoomOnMouseWheel(false);
    chart.scale().zoomLevels([
        [
            { unit: 'week', count: 1 },
            { unit: 'month', count: 1 },
            { unit: 'year', count: 1 },
        ],
    ]);

    // add a zoom control panel
    var zoomController = anychart.ui.zoom();
    zoomController.target(chart);
    zoomController.render();

    // link settings
    chart.listen('pointDblClick', function (event) {
        var point = event.point;
        if (!!point.get('end')) {
            var start = new Date(point.get('start')).toISOString().split('T')[0];
            var rawEnd = new Date(point.get('end'));
            rawEnd.setDate(rawEnd.getDate() - 1);
            var end = rawEnd.toISOString().split('T')[0];
            window.location = '/entries?start=' + start + '&end=' + end;
        } else {
            var singleDate = new Date(point.get('x')).toISOString().split('T')[0];
            window.location = '/entries/on/' + singleDate;
        }
    });

    chart.container('container');
    chart.background().fill('#EEE');

    // initiate drawing the chart
    chart.draw();
};
