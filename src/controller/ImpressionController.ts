import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { DateRange } from '../entity/DateRange';
import { Tag } from '../entity/Tag';

export class ImpressionController {
    private repo = getRepository(DateRange);
    private tagRepo = getRepository(Tag);

    async find(request: Request, response: Response, next: NextFunction): Promise<void> {
        const rangesWithImpressions = await this.repo
            .createQueryBuilder('range')
            .innerJoinAndSelect('range.impression', 'impression')
            .getMany();

        return response.render('impression', {
            existingJS: this.existingJS(rangesWithImpressions),
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
            ...request.query,
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

            var rangePlot = chart.plot(0);

            var series = rangePlot.hilo(mapping);
            series.name("Daily Hi-lo");

            // rangePlot.priceChannels(mapping, 10);

            // rangePlot.yScale().minimum(-8);
            // rangePlot.yScale().maximum(8);

            var trendPlot = chart.plot(1);

            var ema3 = trendPlot.ema(mapping, 3).series();
            ema3.name("3-day weighted avg");

            var ema10 = trendPlot.ema(mapping, 10).series();
            ema10.name("10-day weighted avg");

            var ema30 = trendPlot.ema(mapping, 30).series();
            ema30.name("30-day weighted avg");

            var ema90 = trendPlot.ema(mapping, 90).series();
            ema90.name("90-day weighted avg");

            // trendPlot.yScale().minimum(-4);
            // trendPlot.yScale().maximum(4);

            // Set up vertical gridlines
            rangePlot.yMinorGrid().palette(["White", null]);
            trendPlot.yMinorGrid().palette(["White", null]);

            chart.title('Mood');

            chart.background().fill("#EEE");
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
                    'count': 490,
                },
                {
                    'text': 'All',
                    'type': 'max',
                },
            ];

            rangeSelector.ranges(customRanges);

            rangePicker.render(chart);
            rangeSelector.render(chart);

            chart.listen("pointDblClick", function(event){
                var point = event.point;
                alert(point);
                if (!!point.get('end')) {
                    var start = new Date(point.get('start')).toISOString().split('T')[0];
                    var rawEnd = new Date(point.get('end'));
                    rawEnd.setDate(rawEnd.getDate() - 1);
                    var end = rawEnd.toISOString().split('T')[0]
                    window.location = '/entries/from/' + start + '/to/' + end;
                } else {
                    var singleDate = new Date(point.get('x')).toISOString().split('T')[0]
                    window.location = '/entries/on/' + singleDate;
                }
            });
          });
        `.trim();
    }

    private rangeToJSArray(range: DateRange): string {
        return this.escapeArrayToExecutableJSArray([
            this.escapeDateToStringLiteral(range.start),
            range.impression.positivity,
            range.impression.negativity,
            range.impression.positivity + range.impression.negativity,
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
