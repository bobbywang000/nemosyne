import { getRepository, Like } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Entry } from '../entity/Entry';
import { ContentType } from '../enums';
import { getOffsetDate } from '../utils';

export class EntryController {
    private repo = getRepository(Entry);

    async all(request: Request, response: Response, next: NextFunction) {
        // Hacky way to get all dates starting w/ 2, AKA all dates starting from 2000-01-01.
        request.params.subjectDate = '2';
        return this.onDate(request, response, next);
    }

    async onDate(request: Request, response: Response, next: NextFunction) {
        const givenSubjectDate = request.params.subjectDate;

        const entries = await this.repo.find({
            where: {
                subjectDate: Like(`${givenSubjectDate}%`),
            },
            order: {
                subjectDate: 'ASC',
            },
            relations: ['dateRanges'],
        });

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

        const currDate = new Date(givenSubjectDate);

        return response.render('entry', {
            prev: this.formatLinkDate(getOffsetDate(new Date(currDate), -1)),
            next: this.formatLinkDate(getOffsetDate(new Date(currDate), 1)),
            date: givenSubjectDate,
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
        return date.toISOString().split('T')[0];
    }
}
