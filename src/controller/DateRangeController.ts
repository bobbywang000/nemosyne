import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { DateRange } from '../entity/DateRange';
import { getOffsetDate, arrayify, startDateOrDefault, endDateOrDefault } from '../utils';

export class DateRangeController {
    private repo = getRepository(DateRange);

    async find(request: Request, response: Response, next: NextFunction) {
        const start = startDateOrDefault(request.query.start as string);
        const end = endDateOrDefault(request.query.end as string);
        const tags = request.query.tags as string[];

        const ranges = await this.baseQuery(start, end, tags).andWhere('range.start != range.end').getMany();
        const moments = await this.baseQuery(start, end, tags).andWhere('range.start == range.end').getMany();

        return response.render('range', {
            existingJS: this.existingJS(ranges, moments),
        });
    }

    // Need to create a new queryBuilder for every query, so abstract this out into a new method
    private baseQuery(start: string, end: string, tags: string[]) {
        const query = this.repo
            .createQueryBuilder('range')
            .where('range.start >= :start AND range.end <= :end', { start: start, end: end });

        // Relatively few ranges are tagged, and not all those days have titles, so we should show
        // all days when tags are given. Otherwise, every single range has a tag, which we obvs
        // shouldn't show.
        if (tags) {
            return query.innerJoinAndSelect('range.tags', 'tag', 'tag.name IN (:...tags)', {
                // TODO: figure out why TypeScript isn't catching that tags isn't a string and failing earlier
                tags: arrayify(tags),
            });
        } else {
            return query.andWhere('range.title IS NOT NULL');
        }
    }

    private existingJS(ranges: DateRange[], moments: DateRange[]): string {
        return `
        anychart.onDocumentReady(function () {

            // create data

            var rangeData = ${this.escapeStringArrayToExecutableJSArray(
                ranges.map((range) => this.rangeToJSArray(range)),
            )}

            var momentData = ${this.escapeStringArrayToExecutableJSArray(
                moments.map((moment) => this.momentToJSArray(moment)),
            )}

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
                    var rawEnd = new Date(point.get('end'));
                    rawEnd.setDate(rawEnd.getDate() - 1);
                    var end = rawEnd.toISOString().split('T')[0]
                    window.location = '/entries?start=' + start + '&end=' + end;
                } else {
                    var singleDate = new Date(point.get('x')).toISOString().split('T')[0]
                    window.location = '/entries/on/' + singleDate;
                }
            });

            chart.container("container");
            chart.background().fill("#EEE");

            // initiate drawing the chart
            chart.draw();
        });
        `.trim();
    }

    private rangeToJSArray(range: DateRange): string {
        return this.escapeStringArrayToExecutableJSArray([
            this.escapeTitleToExecutableJSLiteral(range.title || ''),
            this.escapeDateToExecutableJSLiteral(range.start),
            this.escapeDateToExecutableJSLiteral(getOffsetDate(range.end, 1)),
        ]);
    }

    private momentToJSArray(moment: DateRange): string {
        return this.escapeStringArrayToExecutableJSArray([
            this.escapeDateToExecutableJSLiteral(moment.start),
            this.escapeTitleToExecutableJSLiteral(moment.title || moment.start.toISOString().split('T')[0]),
        ]);
    }

    private escapeStringArrayToExecutableJSArray(arr: string[]): string {
        return `[
            ${arr.join(',\n')}
        ]`;
    }

    private escapeTitleToExecutableJSLiteral(title: string): string {
        return `"${title.replace(/"/g, "'")}"`;
    }

    private escapeDateToExecutableJSLiteral(date: Date): string {
        return `new Date('${date.toISOString()}')`;
    }
}
