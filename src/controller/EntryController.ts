import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Entry } from '../entity/Entry';
import { Impression } from '../entity/Impression';
import { DateRange } from '../entity/DateRange';
import { Tag } from '../entity/Tag';
import { ContentType } from '../enums';
import {
    getOffsetDate,
    dateToSqliteTimestamp,
    arrayify,
    startDateOrDefault,
    endDateOrDefault,
    getImpressionOpts,
    IMPRESSION_QUERY,
} from '../utils';
import * as MarkdownIt from 'markdown-it';

export class EntryController {
    private entryRepo = getRepository(Entry);
    private impressionRepo = getRepository(Impression);
    private dateRangeRepo = getRepository(DateRange);
    private tagRepo = getRepository(Tag);
    private md = new MarkdownIt();

    async on(request: Request, response: Response, next: NextFunction) {
        request.query.start = request.params.subjectDate;
        request.query.end = request.params.subjectDate;
        return this.find(request, response, next);
    }

    async find(request: Request, response: Response, next: NextFunction) {
        const start = startDateOrDefault(request.query.start as string);
        const end = endDateOrDefault(request.query.end as string);

        let query = this.entryRepo
            .createQueryBuilder('entry')
            .where('entry.subjectDate >= :start AND entry.subjectDate <= :end', { start: start, end: end })
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
                `impression.id = dateRanges.impressionId AND ${IMPRESSION_QUERY}`,
                getImpressionOpts(request.query),
            )
            .orderBy('entry.subjectDate');

        const tags = request.query.tags;
        if (tags) {
            query = query.innerJoinAndSelect('dateRanges.tags', 'tag', 'tag.name IN (:...tags)', {
                tags: arrayify(tags),
            });
        }

        const content = request.query.content;
        if (content) {
            query = query.andWhere('entry.content LIKE :content', { content: `%${content}%` });
        }

        const entries = await query.getMany();

        const formattedEntries = entries.map((entry) => {
            return {
                // TODO: add the title to the formatting somewhere along here
                content: this.formatContent(entry.content, entry.contentType),
                subjectDate: this.formatLongDate(entry.subjectDate),
                link: this.formatLinkDate(entry.subjectDate),
                editLink: this.formatEditLink(entry.id),
                deleteLink: this.formatDeleteLink(entry.id),
                writeDate: this.formatShortDate(entry.writeDate),
                parentRanges: entry.dateRanges
                    .sort((range1, range2) => range1.length() - range2.length())
                    .map((range) => {
                        return {
                            name: this.formatParentRange(range.start, range.end, range.impression),
                            linkParams: this.formatRangeLinkParams(range.start, range.end),
                        };
                    }),
            };
        });

        return response.render('entry', {
            prev: this.formatLinkDate(getOffsetDate(new Date(start), -1)),
            next: this.formatLinkDate(getOffsetDate(new Date(end), 1)),
            entries: formattedEntries,
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
            tags: tags,
            ...request.query,
        });
    }

    async new(request: Request, response: Response, next: NextFunction) {
        return response.render('edit', {
            contentType: ContentType.MARKDOWN,
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
        });
    }

    async edit(request: Request, response: Response, next: NextFunction) {
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

        let impressionOpts = {};
        const range = entry.dateRanges[0];
        if (range && range.impression) {
            impressionOpts = {
                positivity: range.impression.positivity,
                negativity: range.impression.negativity,
            };
        }
        opts = {
            writeDate: this.dateToSlug(new Date()),
            subjectDate: this.dateToSlug(entry.subjectDate),
            content: entry.content,
            contentType: entry.contentType,
            lockedSubjectDate: true,
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
            tags: arrayify(range.tags.map((tag) => tag.name)),
            ...impressionOpts,
        };
        return response.render('edit', opts);
    }

    async create(request: Request, response: Response, next: NextFunction) {
        const body = request.body;
        const entry = new Entry();
        entry.content = body.content;
        // TODO: check if it's more idiomatic to have an "enum constructor" here.
        entry.contentType = body.contentType;
        entry.subjectDate = this.parseDateOrDefault(body.subjectDate);
        entry.writeDate = this.parseDateOrDefault(body.writeDate);
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

        const impression = range.impression || new Impression();
        impression.positivity = parseFloat(body.positivity);
        impression.negativity = parseFloat(body.negativity);
        impression.written = entry.writeDate;

        range.impression = impression;
        impression.dateRange = range;

        await this.impressionRepo.save(impression);

        await this.dateRangeRepo.save(range);

        return response.redirect(`/entries/on/${this.dateToSlug(entry.subjectDate)}`);
    }

    async update(request: Request, response: Response, next: NextFunction) {
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

        const updatedDate = this.parseDateOrDefault(body.writeDate);

        entry.content = body.content;
        entry.contentType = body.contentType;
        entry.writeDate = updatedDate;

        await this.entryRepo.save(entry);

        const range = entry.dateRanges[0];
        const impression = range.impression || new Impression();
        impression.positivity = parseFloat(body.positivity);
        impression.negativity = parseFloat(body.negativity);
        impression.written = updatedDate;

        const tags = await this.tagRepo
            .createQueryBuilder('tag')
            .where('tag.name IN (:...tags)', {
                tags: arrayify(body.tags),
            })
            .getMany();

        range.tags = tags;

        range.impression = impression;
        impression.dateRange = range;

        await this.impressionRepo.save(impression);

        await this.dateRangeRepo.save(range);

        return response.redirect(`/entries/on/${this.dateToSlug(entry.subjectDate)}`);
    }

    async delete(request: Request, response: Response, next: NextFunction) {
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

    private parseDateOrDefault(dateSlug: string): Date {
        if (dateSlug) {
            return new Date(dateSlug);
        } else {
            return new Date(this.dateToSlug(new Date()));
        }
    }

    private formatParentRange(start: Date, end: Date, impression: Impression): string {
        let formattedDate;
        if (start.getTime() === end.getTime()) {
            formattedDate = this.formatShortDate(start);
        } else {
            // TODO: just give the title of the range here
            formattedDate = `${this.formatShortDate(start)} - ${this.formatShortDate(end)}`;
        }

        if (impression) {
            return `${formattedDate} (+${impression.positivity}/${impression.negativity})`;
        } else {
            return formattedDate;
        }
    }

    private formatRangeLinkParams(start: Date, end: Date): string {
        if (start.getTime() === end.getTime()) {
            return null;
        } else {
            return `?start=${this.dateToSlug(start)}&end=${this.dateToSlug(end)}`;
        }
    }

    private formatContent(content: string, contentType: ContentType) {
        switch (contentType) {
            case ContentType.HTML:
                return content;
            case ContentType.MARKDOWN:
                return this.md.render(content);
            case ContentType.PLAINTEXT:
                return `<code>${content}</code>`;
        }
    }

    private formatLongDate(date: Date): string {
        const options = {
            timeZone: 'Etc/UTC',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };

        return date.toLocaleDateString('en-US', options);
    }

    private formatShortDate(date: Date): string {
        const options = {
            timeZone: 'Etc/UTC',
        };
        return date.toLocaleDateString('en-US', options);
    }

    private formatLinkDate(date: Date): string {
        return `/entries/on/${this.dateToSlug(date)}`;
    }

    private formatEditLink(id: number): string {
        return `/entries/edit/${id}`;
    }

    private formatDeleteLink(id: number): string {
        return `/entries/delete/${id}`;
    }

    private dateToSlug(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}
