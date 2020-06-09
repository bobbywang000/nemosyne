import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Entry } from '../entity/Entry';
import { ContentType } from '../enums';

export class EntryController {
    private repo = getRepository(Entry);

    async all(request: Request, response: Response, next: NextFunction) {
        return this.repo.find();
    }

    async one(request: Request, response: Response, next: NextFunction) {
        const entry = await this.repo.findOne(request.params.id, { relations: ['dateRanges'] });
        console.log(entry);
        return response.render('entry', {
            content: this.formatContent(entry.content, entry.contentType),
            date: entry.subjectDate.toDateString(),
            writeDate: entry.writeDate.toDateString(),
            parentRanges: entry.dateRanges.map(
                (range) => `${range.start.toDateString()} - ${range.end.toDateString()}`,
            ),
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
}
