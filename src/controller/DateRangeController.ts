import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { DateRange } from '../entity/DateRange';
import { getOffsetDate, dateToSqliteTimestamp } from '../utils';

export class DateRangeController {
    private repo = getRepository(DateRange);

    // Totally arbitrary
    private MIN_YEAR = '1000';
    private MAX_YEAR = '3000';

    async all(request: Request, response: Response, next: NextFunction) {
        request.params.start = this.MIN_YEAR;
        request.params.end = this.MAX_YEAR;
        return this.between(request, response, next);
    }

    async between(request: Request, response: Response, next: NextFunction) {
        const start = dateToSqliteTimestamp(new Date(request.params.start));
        const end = dateToSqliteTimestamp(new Date(request.params.end));

        const ranges = await this.baseFilter(start, end).andWhere('range.start != range.end').getMany();
        const moments = await this.baseFilter(start, end).andWhere('range.start == range.end').getMany();

        return response.render('range', {
            existingJS: this.existingJS(ranges, moments),
        });
    }

    // Need to create a new queryBuilder for every query, so abstract this out into a new method
    private baseFilter(start: string, end: string) {
        return this.repo
            .createQueryBuilder('range')
            .where('range.start >= :start AND range.end <= :end', { start: start, end: end });
    }

    private existingJS(ranges: DateRange[], moments: DateRange[]): string {
        return `
        anychart.onDocumentReady(function () {

            // create data

            var rangeData = [
                ${ranges.map((range) => this.rangeToJSArray(range)).join(',\n')}
            ];

            var momentData = [
                ${moments
                    .map((moment) => this.momentToJSArray(moment))
                    .filter((moment) => !!moment)
                    .join(',\n')}
            ]

            // create a chart
            var chart = anychart.timeline();

            var rangeSeries = chart.range(rangeData);
            rangeSeries.name("Ranges");

            var momentSeries = chart.moment(momentData);
            momentSeries.name("Moments");

            // set the chart title
            chart.title("Timeline");

            // Scroll settings
            chart.scroller(true);

            // Zoom settings
            chart.interactivity().zoomOnMouseWheel(false);
            chart.scale().zoomLevels([
                [
                    {"unit": "week", count: 1},
                    {"unit": "month", count: 1},
                    {"unit": "year", count: 1}
                ]
            ]);

            // add a zoom control panel
            var zoomController = anychart.ui.zoom();
            zoomController.target(chart);
            zoomController.render();

            // link settings
            chart.listen("pointDblClick", function(event){
                var point = event.point;
                if (!!point.get('end')) {
                    var start = new Date(point.get('start')).toISOString().split('T')[0];
                    var end = new Date(point.get('end')).toISOString().split('T')[0];
                    window.location = '/entries/from/' + start + '/to/' + end;
                } else {
                    var singleDate = new Date(point.get('x')).toISOString().split('T')[0]
                    window.location = '/entries/on/' + singleDate;
                }
            });

            // set the container id
            chart.container("container");

            // initiate drawing the chart
            chart.draw();
        });
        `.trim();
    }

    private rangeToJSArray(range: DateRange): string {
        return this.escapeStringArrayToExecutableJSArray([
            this.escapeTitleToExecutableJSLiteral(range.title),
            this.escapeDateToExecutableJSLiteral(range.start),
            this.escapeDateToExecutableJSLiteral(getOffsetDate(range.end, 1)),
        ]);
    }

    private momentToJSArray(moment: DateRange): string {
        if (!!moment.title) {
            return this.escapeStringArrayToExecutableJSArray([
                this.escapeDateToExecutableJSLiteral(moment.start),
                this.escapeTitleToExecutableJSLiteral(moment.title),
            ]);
        } else {
            return null;
        }
    }

    private escapeStringArrayToExecutableJSArray(arr: string[]): string {
        return `[
            ${arr.join(',\n')}
        ]`;
    }

    private escapeTitleToExecutableJSLiteral(title: string): string {
        return title ? `"${title.replace(/"/g, "'")}"` : '';
    }

    private escapeDateToExecutableJSLiteral(date: Date): string {
        return `new Date('${date.toISOString()}')`;
    }
}
