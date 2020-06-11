import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { DateRange } from '../entity/DateRange';
import { getOffsetDate, dateToSqliteTimestamp, arrayify } from '../utils';
// import { Impression } from '../entity/Impression';

export class ImpressionController {
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

        const rangesWithImpressions = await this.repo
            .createQueryBuilder('range')
            .where('range.start >= :start AND range.end <= :end', { start: start, end: end })
            .innerJoinAndSelect('range.impression', 'impression')
            .getMany();

        return response.render('impression', {
            existingJS: this.existingJS(rangesWithImpressions),
        });
    }

    private existingJS(ranges: DateRange[]): string {
        return `
        var table, mapping, chart, yScale;
        anychart.onDocumentReady(function () {

            // set the data
            table = anychart.data.table();
            table.addData(${this.escapeArrayToExecutableJSArray(ranges.map((range) => this.rangeToJSArray(range)))});

            // map the data
            mapping = table.mapAs({
                high: 1,
                low: 2,
                value: 3,
                // close: 3,
            });

            // chart type
            var chart = anychart.stock();

            var plot = chart.plot(0);

            // set the series
            var series = plot.hilo(mapping);
            // series.name("ACME Corp. stock prices");

            // set the indicators
            var mma10 = plot.mma(mapping, 10).series();
            mma10.stroke('#bf360c');

            // get a plot scale
            yScale = plot.yScale();

            // set minimum/maximum and inversion
            yScale.minimum(-10);
            yScale.maximum(10);

            // Set up vertical gridlines
            plot.yMinorGrid().palette(["LightGrey", null]);

            chart.title('Mood');

            chart.container('container');
            chart.draw();

            var rangeSelector = anychart.ui.rangeSelector();
            var rangePicker = anychart.ui.rangePicker();

            var customRanges = [
                {
                    'text': 'Quarter',
                    'type': 'unit',
                    'unit': 'quarter',
                    'count': 1,
                },
                {
                    'text': 'Half',
                    'type': 'unit',
                    'unit': 'semester',
                    'count': 1,
                },
                {
                    'text': 'Year',
                    'type': 'unit',
                    'unit': 'year',
                    'count': 1,
                },
                {
                    'text': '500 Days',
                    'type': 'points',
                    'count': 500,
                },
                {
                    'text': 'All',
                    'type': 'all',
                },
            ];

            rangeSelector.ranges(customRanges);

            rangePicker.render(chart);
            rangeSelector.render(chart);
          });
        `.trim();
    }

    private rangeToJSArray(range: DateRange): string {
        return this.escapeArrayToExecutableJSArray([
            this.escapeDateToStringLiteral(range.start),
            range.impression.positivity,
            range.impression.negativity,
            range.impression.total,
        ]);
    }

    private escapeArrayToExecutableJSArray(arr: unknown[]): string {
        return `[
            ${arr.join(',\n')}
        ]`;
    }

    private escapeDateToStringLiteral(date: Date): string {
        return `"${date.toISOString().split('T')[0]}"`;
    }
}
