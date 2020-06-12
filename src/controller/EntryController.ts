import { getRepository, Like, DefaultNamingStrategy } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Entry } from '../entity/Entry';
import { Impression } from '../entity/Impression';
import { ContentType } from '../enums';
import { getOffsetDate, dateToSqliteTimestamp, arrayify } from '../utils';

export class EntryController {
    private repo = getRepository(Entry);

    // Totally arbitrary
    private MIN_YEAR = '1000';
    private MAX_YEAR = '3000';

    async on(request: Request, response: Response, next: NextFunction) {
        request.query.start = request.params.subjectDate;
        request.query.end = request.params.subjectDate;
        return this.find(request, response, next);
    }

    async find(request: Request, response: Response, next: NextFunction) {
        const start = dateToSqliteTimestamp(new Date((request.query.start as string) || this.MIN_YEAR));
        const end = dateToSqliteTimestamp(new Date((request.query.end as string) || this.MAX_YEAR));

        let query = this.repo
            .createQueryBuilder('entry')
            .where('entry.subjectDate >= :start AND entry.subjectDate <= :end', { start: start, end: end })
            .leftJoinAndSelect('entry.dateRanges', 'dateRanges')
            .leftJoinAndSelect('dateRanges.impression', 'impression')
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
                writeDate: this.formatShortDate(entry.writeDate),
                parentRanges: entry.dateRanges.map((range) => {
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
        });
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
            default:
                return `<p>Content type ${contentType} not currently supported. Raw content: <code>${content}</code>`;
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

    private dateToSlug(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}
