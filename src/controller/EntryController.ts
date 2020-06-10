import { getRepository, Like } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Entry } from '../entity/Entry';
import { ContentType } from '../enums';
import { getOffsetDate, dateToSqliteTimestamp } from '../utils';

export class EntryController {
    private repo = getRepository(Entry);

    // Totally arbitrary
    private MIN_YEAR = '1000';
    private MAX_YEAR = '3000';

    async all(request: Request, response: Response, next: NextFunction) {
        request.params.start = this.MIN_YEAR;
        request.params.end = this.MAX_YEAR;
        return this.between(request, response, next);
    }

    async on(request: Request, response: Response, next: NextFunction) {
        request.params.start = request.params.subjectDate;
        request.params.end = request.params.subjectDate;
        return this.between(request, response, next);
    }

    async between(request: Request, response: Response, next: NextFunction) {
        const start = dateToSqliteTimestamp(new Date(request.params.start));
        const end = dateToSqliteTimestamp(new Date(request.params.end));

        const entries = await this.repo
            .createQueryBuilder('entry')
            .where('entry.subjectDate >= :start AND entry.subjectDate <= :end', { start: start, end: end })
            .leftJoinAndSelect('entry.dateRanges', 'dateRanges')
            .orderBy('entry.subjectDate')
            .getMany();

        const formattedEntries = entries.map((entry) => {
            return {
                content: this.formatContent(entry.content, entry.contentType),
                subjectDate: this.formatLongDate(entry.subjectDate),
                link: this.formatLinkDate(entry.subjectDate),
                writeDate: this.formatShortDate(entry.writeDate),
                parentRanges: entry.dateRanges.map((range) => {
                    if (range.start.getTime() === range.end.getTime()) {
                        return this.formatShortDate(range.start);
                    } else {
                        return `${this.formatShortDate(range.start)} - ${this.formatShortDate(range.end)}`;
                    }
                }),
            };
        });

        return response.render('entry', {
            prev: this.formatLinkDate(getOffsetDate(new Date(start), -1)),
            next: this.formatLinkDate(getOffsetDate(new Date(end), 1)),
            entries: formattedEntries,
        });
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
        return `/entries/on/${date.toISOString().split('T')[0]}`;
    }
}
