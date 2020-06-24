import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Tag } from '../entity/Tag';

export class TagController {
    private repo = getRepository(Tag);

    // link to entries, and link to range view
    async find(request: Request, response: Response, next: NextFunction) {
        const tags = await this.repo.find();
        return response.render('tag', {
            tags: tags.map((tag) => {
                return {
                    name: tag.name,
                    entriesLink: `/entries?tags=${encodeURI(tag.name)}`,
                    datesLink: `/dates?tags=${encodeURI(tag.name)}`,
                };
            }),
            ...request.query,
        });
    }
}
