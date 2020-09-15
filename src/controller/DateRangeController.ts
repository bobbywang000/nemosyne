import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { DateRange } from '../entity/DateRange';
import { Entry } from '../entity/Entry';
import { Impression } from '../entity/Impression';
import { Tag } from '../entity/Tag';
import { arrayify } from '../utils/arrayUtils';
import { getOffsetDate, startDateOrDefault, endDateOrDefault, formatRange, dateToSlug } from '../utils/dateUtils';
import { getImpressionOpts, IMPRESSION_QUERY, hasImpressionOpts } from '../utils/impressionUtils';

export class DateRangeController {
    private repo = getRepository(DateRange);
    private impressionRepo = getRepository(Impression);
    private tagRepo = getRepository(Tag);

    async find(request: Request, response: Response, next: NextFunction) {
        const query = request.query;
        const start = startDateOrDefault(query.start as string);
        const end = endDateOrDefault(query.end as string);

        const omitNullTitles = !query.tags;

        const ranges = await this.baseSqlQuery(start, end, query, omitNullTitles)
            .andWhere('range.start != range.end')
            .getMany();
        const moments = await this.baseSqlQuery(start, end, query, omitNullTitles)
            .andWhere('range.start == range.end')
            .getMany();

        return response.render('viewRangeGraph', {
            existingJS: this.existingJS(ranges, moments),
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
            ...query,
        });
    }

    async list(request: Request, response: Response, next: NextFunction) {
        const query = request.query;
        const start = startDateOrDefault(query.start as string);
        const end = endDateOrDefault(query.end as string);

        const ranges = await this.baseSqlQuery(start, end, query, false).getMany();

        return response.render('viewRangeList', {
            ranges: ranges.map((range) => {
                return {
                    name: formatRange(range.start, range.end, range.impression, range.title || 'Untitled'),
                    editLink: this.formatEditLink(range.id),
                    deleteLink: this.formatDeleteLink(range.id),
                    entryLink: this.formatLinkToEntries(range),
                };
            }),
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
            ...query,
        });
    }

    async edit(request: Request, response: Response, next: NextFunction) {
        const range = await this.repo.findOne({
            where: {
                id: request.params.id,
            },
            relations: ['impression', 'tags'],
        });
        const impression = range.impression || ({} as any);

        return response.render('editRange', {
            title: range.title,
            rangeStart: dateToSlug(range.start),
            rangeEnd: dateToSlug(range.end),
            positivity: impression.positivity,
            negativity: impression.negativity,
            tags: range.tags,
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
        });
    }

    async createOrUpdate(request: Request, response: Response, next: NextFunction) {
        const id = request.params.id;
        const body = request.body;

        let range;
        if (id) {
            range = await this.repo.findOne({
                where: {
                    id: id,
                },
                relations: ['impression'],
            });
        } else {
            range = new DateRange();
        }

        range.start = new Date(body.start);
        range.end = new Date(body.end);
        range.title = body.title;

        const tags = await this.tagRepo
            .createQueryBuilder('tag')
            .where('tag.name IN (:...tags)', {
                tags: arrayify(body.tags),
            })
            .getMany();
        range.tags = tags;

        await this.repo.save(range);

        if (body.positivity && body.negativity) {
            const impression = range.impression || new Impression();
            range.impression = impression;
            impression.positivity = parseFloat(body.positivity);
            impression.negativity = parseFloat(body.negativity);
            impression.written = new Date(dateToSlug(new Date()));
            await this.impressionRepo.save(impression);
        }

        return response.redirect(`/dates/list?start=${dateToSlug(range.start)}&end=${dateToSlug(range.end)}`);
    }

    async delete(request: Request, response: Response, next: NextFunction) {
        await this.repo.delete(request.params.id);
        return response.redirect('back');
    }

    // Need to create a new queryBuilder for every query, so abstract this out into a new method
    private baseSqlQuery(start: string, end: string, httpQuery: any, omitNullTitles: boolean) {
        let sqlQuery = this.repo
            .createQueryBuilder('range')
            .where('range.start >= :start AND range.end <= :end', { start: start, end: end })
            .orderBy('range.start');

        if (hasImpressionOpts(httpQuery)) {
            sqlQuery = sqlQuery.innerJoinAndMapOne(
                'range.impression',
                Impression,
                'impression',
                `impression.id = range.impressionId AND ${IMPRESSION_QUERY}`,
                getImpressionOpts(httpQuery),
            );
        }

        const content = httpQuery.content;
        if (content) {
            sqlQuery = sqlQuery.innerJoin(
                Entry,
                'entry',
                'entry.subjectDate >= range.start AND entry.subjectDate <= range.end AND entry.content LIKE :content',
                {
                    content: `%${content}%`,
                },
            );
        }

        const tags = httpQuery.tags;
        if (tags) {
            sqlQuery = sqlQuery.innerJoin('range.tags', 'tag', 'tag.name IN (:...tags)', {
                // TODO: figure out why TypeScript isn't catching that tags isn't a string and failing earlier
                tags: arrayify(tags),
            });
        }

        if (omitNullTitles) {
            sqlQuery = sqlQuery.andWhere('range.title IS NOT NULL');
        }

        return sqlQuery;
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

    private formatLinkToEntries(range: DateRange): string {
        if (range.start.getTime() == range.end.getTime()) {
            return `/entries/on/${dateToSlug(range.start)}`;
        } else {
            return `/entries?start=${dateToSlug(range.start)}&end=${dateToSlug(range.end)}`;
        }
    }

    private formatEditLink(id: number): string {
        return `/dates/edit/${id}`;
    }

    private formatDeleteLink(id: number): string {
        return `/dates/delete/${id}`;
    }
}
