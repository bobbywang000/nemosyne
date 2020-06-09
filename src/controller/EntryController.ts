import { getRepository, Like } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Entry } from '../entity/Entry';
import { ContentType } from '../enums';

export class EntryController {
    private repo = getRepository(Entry);

    async all(request: Request, response: Response, next: NextFunction) {
        return this.repo.find();
    }

    async onDate(request: Request, response: Response, next: NextFunction) {
        const entries = await this.repo.find({
            where: {
                subjectDate: Like(`${request.params.subjectDate}%`),
            },
            relations: ['dateRanges'],
        });

        const formattedEntries = entries.map((entry) => {
            return {
                content: this.formatContent(entry.content, entry.contentType),
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

        const currDate = new Date(request.params.subjectDate);

        return response.render('entry', {
            prev: this.formatLinkDate(this.getDateOffset(new Date(currDate), -1)),
            next: this.formatLinkDate(this.getDateOffset(new Date(currDate), 1)),
            date: this.formatLongDate(currDate),
            entries: formattedEntries,
        });
    }

    async save(request: Request, response: Response, next: NextFunction) {
        return this.repo.save(request.body);
    }

    formatContent(content: string, contentType: ContentType) {
        switch (contentType) {
            case ContentType.HTML:
                return content;
            default:
                return `<p>Content type ${contentType} not currently supported. Raw content: <code>${content}</code>`;
        }
    }

    getDateOffset(date: Date, days: number) {
        const offsetDate = new Date(date);
        offsetDate.setDate(offsetDate.getDate() + days);
        return offsetDate;
    }

    formatLongDate(date: Date): string {
        const options = {
            timeZone: 'Etc/UTC',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };

        return date.toLocaleDateString('en-US', options);
    }

    formatShortDate(date: Date): string {
        const options = {
            timeZone: 'Etc/UTC',
        };
        return date.toLocaleDateString('en-US', options);
    }

    formatLinkDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}
