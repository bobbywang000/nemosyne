import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { DateRange } from '../entity/DateRange';

export class DateRangeController {
    private repo = getRepository(DateRange);

    async allAnyChart(request: Request, response: Response, next: NextFunction) {
        const ranges = await this.repo.createQueryBuilder('range').where('range.start != range.end').getMany();
        const moments = await this.repo.createQueryBuilder('range').where('range.start == range.end').getMany();
        return response.render('range_anychart', {
            existingJS: this.existingAnyChartJS(ranges, moments),
        });
    }

    async allGoogleCharts(request: Request, response: Response, next: NextFunction) {
        const ranges = await this.repo.createQueryBuilder('range').where('range.start != range.end').getMany();
        return response.render('range_google', {
            existingJS: this.existingGoogleJS(ranges),
        });
    }

    existingAnyChartJS(ranges: DateRange[], moments: DateRange[]): string {
        return `
        anychart.onDocumentReady(function () {

            // create data

            var rangeData1 = [
                ${ranges.map((range) => this.formatRangeAnyChart(range)).join(',\n')}
            ];

            var momentData1 = [
                ${moments
                    .map((moment) => this.formatMomentAnyChart(moment))
                    .filter((moment) => !!moment)
                    .join(',\n')}
            ]

            // create a chart
            var chart = anychart.timeline();

            var rangeSeries1 = chart.range(rangeData1);
            rangeSeries1.name("Ranges");

            var momentSeries1 = chart.moment(momentData1);
            momentSeries1.name("Moments");

            // set the chart title
            chart.title("Timeline Chart: Navigation (Zoom Control Panel)");

            // Scroll settings
            chart.scroller(true);

            // Zoom settings
            chart.interactivity().zoomOnMouseWheel(false);
            chart.scale().zoomLevels([
                [
                    {"unit": "week", count: 1},
                    {"unit": "month", count: 1},
                    {"unit": "quarter", count: 1}
                ]
            ]);

            // add a zoom control panel
            var zoomController = anychart.ui.zoom();
            zoomController.target(chart);
            zoomController.render();


            // set the container id
            chart.container("container");

            // initiate drawing the chart
            chart.draw();
        });
        `.trim();
    }

    // TODO: refactor escaping the moment titles into separate function
    // TODO: all "big" ranges should have titles, right? Implement that.

    formatRangeAnyChart(range: DateRange): string {
        return `["${
            range.title ? range.title.replace(/"/g, "'") : ''
        }", new Date('${range.start.toISOString()}'), new Date('${this.getDateOffset(range.end, 1).toISOString()}')]`;
    }

    formatMomentAnyChart(moment: DateRange): string {
        if (!!moment.title) {
            return `[new Date('${moment.start.toISOString()}'), "${moment.title.replace(/"/g, "'")}"]`;
        } else {
            return null;
        }
    }

    existingGoogleJS(ranges: DateRange[]): string {
        return `
google.charts.load('current', { packages: ['timeline'] });
google.charts.setOnLoadCallback(drawChart);
function drawChart() {
    var container = document.getElementById('timeline');
    var chart = new google.visualization.Timeline(container);
    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'dummy' });
    dataTable.addColumn({ type: 'string', id: 'label' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });
    dataTable.addRows([
        ${ranges.map((range) => this.formatRangeGoogle(range)).join(',\n')}
    ]);

    chart.draw(dataTable);
}
        `.trim();
    }

    formatRangeGoogle(range: DateRange): string {
        return `['', "${
            range.title ? range.title.replace(/"/g, "'") : ''
        }", new Date('${range.start.toISOString()}'), new Date('${this.getDateOffset(range.end, 1).toISOString()}')]`;
    }

    async onDate(request: Request, response: Response, next: NextFunction) {
        return [];
    }

    // TODO: Consolidate w/ the same method in EntryController
    getDateOffset(date: Date, days: number) {
        const offsetDate = new Date(date);
        offsetDate.setDate(offsetDate.getDate() + days);
        return offsetDate;
    }
}
