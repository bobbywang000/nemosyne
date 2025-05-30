import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Entry } from '../entity/Entry';
import { Impression } from '../entity/Impression';
import { DateRange } from '../entity/DateRange';
import { Tag } from '../entity/Tag';
import { ContentType } from '../enums';
import { SQLITE_MAXIMUM_VARIABLE_NUMBER } from '../constants';
import { arrayify, splitArray } from '../utils/arrayUtils';
import {
    getOffsetDate,
    dateToSqliteTimestamp,
    startDateOrDefault,
    endDateOrDefault,
    formatRange,
    formatShortDate,
    dateToSlug,
    parseDateOrDefault,
} from '../utils/dateUtils';
import { getImpressionOpts, IMPRESSION_QUERY, hasImpressionOpts } from '../utils/impressionUtils';
import { ContentFormatter } from '../utils/ContentFormatter';
import { nullifyIfBlank } from '../utils/stringUtils';

type longDateRange = {
    name: string;
    isRange: boolean;
    epochTime: number;
};

export class EntryController {
    private entryRepo = getRepository(Entry);
    private impressionRepo = getRepository(Impression);
    private dateRangeRepo = getRepository(DateRange);
    private tagRepo = getRepository(Tag);
    private contentFormatter = new ContentFormatter();

    async on(request: Request, response: Response, next: NextFunction): Promise<void> {
        request.query.start = request.params.subjectDate;
        request.query.end = request.params.subjectDate;
        return this.find(request, response, next);
    }

    // oh BOY does this need a refactor.
    async find(request: Request, response: Response, next: NextFunction): Promise<void> {
        const httpQuery = request.query;

        const start = startDateOrDefault(httpQuery.start as string);
        const end = endDateOrDefault(httpQuery.end as string);
        const tags = httpQuery.tags;

        let initialSqlQuery = this.entryRepo
            .createQueryBuilder('entry')
            .where('entry.subjectDate >= :start AND entry.subjectDate <= :end', { start: start, end: end })
            .innerJoinAndMapOne(
                'entry.dateRanges',
                DateRange,
                'dateRanges',
                'entry.subjectDate = dateRanges.start AND entry.subjectDate = dateRanges.end',
            );

        if (hasImpressionOpts(httpQuery)) {
            initialSqlQuery = initialSqlQuery.innerJoinAndMapOne(
                'dateRanges.impression',
                Impression,
                'impression',
                `impression.id = dateRanges.impressionId AND ${IMPRESSION_QUERY}`,
                getImpressionOpts(httpQuery),
            );
        }

        const content = httpQuery.content;
        if (content) {
            initialSqlQuery = initialSqlQuery.andWhere('entry.content LIKE :content', { content: `%${content}%` });
        }

        const initialEntries = await initialSqlQuery.getMany();

        const filteredEntries = (
            await Promise.all(
                splitArray(
                    initialEntries.map((entry) => entry.id),
                    // We subtract 50 because we may need to add tags too, so we add some headroom.
                    SQLITE_MAXIMUM_VARIABLE_NUMBER - 50,
                ).map(async (ids) => {
                    return await this.buildEntrySubquery(tags, ids).getMany();
                }),
            )
        ).reduce((acc, chunk) => acc.concat(chunk), []);

        const formattedEntries = filteredEntries.map((entry) => {
            return {
                // TODO: add the title to the formatting somewhere along here
                content: this.contentFormatter.format(entry.content, entry.contentType),
                subjectDate: this.formatLongDate(entry.subjectDate),
                epochTime: entry.subjectDate.getTime(),
                link: this.formatLinkDate(entry.subjectDate),
                editLink: `/entries/edit/${entry.id}`,
                deleteLink: `/entries/delete/${entry.id}`,
                writeDate: formatShortDate(entry.writeDate),
                parentRanges: entry.dateRanges
                    .sort((range1, range2) => range1.length() - range2.length())
                    .map((range) => {
                        return {
                            name: formatRange(range.start, range.end, range.impression, range.title),
                            isMultiDay: range.start.getTime() !== range.end.getTime() ? 'true' : 'false',
                            linkParams: this.formatRangeLinkParams(range.start, range.end),
                            start: range.start,
                            end: range.end,
                        };
                    }),
            };
        });

        const longDateRanges = filteredEntries.flatMap((entry) => {
            return entry.dateRanges
                .filter(
                    (range) =>
                        range.start.getTime() != range.end.getTime() &&
                        dateToSqliteTimestamp(range.start) >= start &&
                        dateToSqliteTimestamp(range.end) <= end,
                )
                .map((range) => {
                    return {
                        name: formatRange(range.start, range.end, range.impression, range.title),
                        isRange: true,
                        epochTime: range.start.getTime(),
                    };
                });
        });

        return response.render('viewEntry', {
            prevYear: this.formatLinkDate(getOffsetDate(new Date(start), -365)),
            prevMonth: this.formatLinkDate(getOffsetDate(new Date(start), -30)),
            prevWeek: this.formatLinkDate(getOffsetDate(new Date(start), -7)),
            prevDay: this.formatLinkDate(getOffsetDate(new Date(start), -1)),
            nextDay: this.formatLinkDate(getOffsetDate(new Date(end), 1)),
            nextWeek: this.formatLinkDate(getOffsetDate(new Date(end), 7)),
            nextMonth: this.formatLinkDate(getOffsetDate(new Date(end), 30)),
            nextYear: this.formatLinkDate(getOffsetDate(new Date(end), 365)),
            elements: formattedEntries
                // Extremely unsafe here, but I don't really want to fix the logic here.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .concat(this.unique(longDateRanges) as any[])
                .sort((e1, e2) => e1.epochTime - e2.epochTime + (e1['isRange'] ? -1 : 1)),
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
            tags: tags,
            numEntries: formattedEntries.length,
            numRanges: this.unique(longDateRanges).length,
            ...request.query,
        });
    }

    async latest(request: Request, response: Response, next: NextFunction): Promise<void> {
        const entry = await this.entryRepo.createQueryBuilder().orderBy('entry.subjectDate', 'DESC').limit(1).getOne();
        return response.redirect(`/entries/on/${dateToSlug(entry.subjectDate)}`);
    }

    async random(request: Request, response: Response, next: NextFunction): Promise<void> {
        const entry = await this.entryRepo.createQueryBuilder().orderBy('RANDOM()').limit(1).getOne();
        return response.redirect(`/entries/on/${dateToSlug(entry.subjectDate)}`);
    }

    async new(request: Request, response: Response, next: NextFunction): Promise<void> {
        return response.render('editEntry', {
            contentType: ContentType.MARKDOWN,
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
            today: dateToSlug(parseDateOrDefault()),
        });
    }

    async edit(request: Request, response: Response, next: NextFunction): Promise<void> {
        const id = request.params.id;
        let opts = {};
        const entry = await this.entryRepo
            .createQueryBuilder('entry')
            .where('entry.id = :id', { id: id })
            .leftJoinAndMapMany(
                'entry.dateRanges',
                DateRange,
                'range',
                'entry.subjectDate == range.start AND entry.subjectDate == range.end',
            )
            .leftJoinAndSelect('range.impression', 'impression')
            .leftJoinAndSelect('range.tags', 'tags')
            .getOne();

        const range = entry.dateRanges[0];

        let impressionOpts = {};
        if (range && range.impression) {
            impressionOpts = {
                positivity: range.impression.positivity,
                negativity: range.impression.negativity,
            };
        }

        let tags = [];
        if (range && range.tags) {
            tags = arrayify(range.tags.map((tag) => tag.name));
        }

        opts = {
            title: range.title,
            writeDate: dateToSlug(entry.writeDate),
            subjectDate: dateToSlug(entry.subjectDate),
            existingContent: entry.content,
            contentType: entry.contentType,
            lockedSubjectDate: true,
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
            tags: tags,
            today: dateToSlug(parseDateOrDefault()),
            ...impressionOpts,
        };
        return response.render('editEntry', opts);
    }

    async create(request: Request, response: Response, next: NextFunction): Promise<void> {
        const body = request.body;
        const entry = new Entry();
        entry.content = this.getBodyContent(body.doubleNewlines, body.content);
        // TODO: check if it's more idiomatic to have an "enum constructor" here.
        entry.contentType = body.contentType;
        entry.subjectDate = parseDateOrDefault(body.subjectDate);
        entry.writeDate = parseDateOrDefault(body.writeDate);
        await this.entryRepo.save(entry);

        let range;
        const ranges = await this.dateRangeRepo.find({
            where: {
                start: dateToSqliteTimestamp(entry.subjectDate),
                end: dateToSqliteTimestamp(entry.subjectDate),
            },
            relations: ['impression'],
        });

        if (ranges.length === 0) {
            range = new DateRange();
            range.start = entry.subjectDate;
            range.end = entry.subjectDate;
        } else {
            range = ranges[0];
        }

        const tags = await this.tagRepo
            .createQueryBuilder('tag')
            .where('tag.name IN (:...tags)', {
                tags: arrayify(body.tags),
            })
            .getMany();

        range.tags = tags;
        range.title = nullifyIfBlank(body.title);

        const impression = range.impression || new Impression();
        impression.positivity = parseFloat(body.positivity || 0);
        impression.negativity = parseFloat(body.negativity || 0);
        impression.written = entry.writeDate;

        range.impression = impression;
        impression.dateRange = range;

        await this.impressionRepo.save(impression);

        await this.dateRangeRepo.save(range);

        return response.redirect(`/entries/on/${dateToSlug(entry.subjectDate)}`);
    }

    getBodyContent(doubleNewlines: string, content: string): string {
        if (doubleNewlines === 'on') {
            return content.replace(/\n/g, '\n\n');
        } else {
            return content;
        }
    }

    async update(request: Request, response: Response, next: NextFunction): Promise<void> {
        const id = request.params.id;
        const body = request.body;

        const entry = await this.entryRepo
            .createQueryBuilder('entry')
            .where('entry.id = :id', { id: id })
            .leftJoinAndMapMany(
                'entry.dateRanges',
                DateRange,
                'range',
                'entry.subjectDate == range.start AND entry.subjectDate == range.end',
            )
            .leftJoinAndSelect('range.impression', 'impression')
            .getOne();

        const updatedDate = parseDateOrDefault(body.writeDate);

        entry.content = this.getBodyContent(body.doubleNewlines, body.content);
        entry.contentType = body.contentType;
        entry.writeDate = updatedDate;

        await this.entryRepo.save(entry);

        let range;
        if (entry.dateRanges && entry.dateRanges.length == 1) {
            range = entry.dateRanges[0];
        } else {
            range = new DateRange();
            range.start = entry.subjectDate;
            range.end = entry.subjectDate;
        }

        const impression = range.impression || new Impression();
        impression.positivity = parseFloat(body.positivity || 0);
        impression.negativity = parseFloat(body.negativity || 0);
        impression.written = updatedDate;

        const tags = await this.tagRepo
            .createQueryBuilder('tag')
            .where('tag.name IN (:...tags)', {
                tags: arrayify(body.tags),
            })
            .getMany();

        range.tags = tags;
        range.title = nullifyIfBlank(body.title);

        range.impression = impression;
        impression.dateRange = range;

        await this.impressionRepo.save(impression);

        await this.dateRangeRepo.save(range);

        return response.redirect(`/entries/on/${dateToSlug(entry.subjectDate)}`);
    }

    async delete(request: Request, response: Response, next: NextFunction): Promise<void> {
        const id = request.params.id;
        const entry = await this.entryRepo.findOne(id);
        const subjectDate = dateToSqliteTimestamp(entry.subjectDate);

        const entriesOnDate = await this.entryRepo.find({
            where: {
                subjectDate: subjectDate,
            },
        });

        if (entriesOnDate.length == 1) {
            const range = await this.dateRangeRepo.findOne({
                where: {
                    start: subjectDate,
                    end: subjectDate,
                },
                relations: ['impression'],
            });

            if (range.impression) {
                await this.impressionRepo.delete(range.impression.id);
            }
            await this.dateRangeRepo.delete(range.id);
        }

        await this.entryRepo.delete(entry.id);
        return response.redirect('back');
    }

    private formatRangeLinkParams(start: Date, end: Date): string {
        if (start.getTime() === end.getTime()) {
            return null;
        } else {
            return `?start=${dateToSlug(start)}&end=${dateToSlug(end)}`;
        }
    }

    private formatLongDate(date: Date): string {
        const options = {
            timeZone: 'Etc/UTC',
            weekday: 'long' as const,
            year: 'numeric' as const,
            month: 'long' as const,
            day: 'numeric' as const,
        };

        return date.toLocaleDateString('en-US', options);
    }

    private formatLinkDate(date: Date): string {
        return `/entries/on/${dateToSlug(date)}`;
    }

    private unique(inputArr: longDateRange[]): longDateRange[] {
        return inputArr.filter((value, index, array) => {
            return array.findIndex((other) => value.name == other.name) === index;
        });
    }

    private buildEntrySubquery(tags, ids: number[]) {
        let sqlQuery = this.entryRepo
            .createQueryBuilder('entry')
            .where('entry.id IN (:...ids)', { ids: ids })
            .leftJoinAndMapMany(
                'entry.dateRanges',
                DateRange,
                'dateRanges',
                'entry.subjectDate >= dateRanges.start AND entry.subjectDate <= dateRanges.end',
            )
            .leftJoinAndMapOne(
                'dateRanges.impression',
                Impression,
                'impression',
                `impression.id = dateRanges.impressionId`,
            )
            .orderBy('entry.subjectDate')
            .orderBy('entry.writeDate');

        if (tags) {
            sqlQuery = sqlQuery.innerJoinAndSelect('dateRanges.tags', 'tag', 'tag.name IN (:...tags)', {
                tags: arrayify(tags),
            });
        }

        return sqlQuery;
    }
}
