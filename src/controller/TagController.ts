import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Tag } from '../entity/Tag';
import { dateToSlug } from '../utils/dateUtils';
import { ContentFormatter } from '../utils/ContentFormatter';
import { arrayify } from '../utils/arrayUtils';

export class TagController {
    private repo = getRepository(Tag);
    private contentFormatter = new ContentFormatter();

    async find(request: Request, response: Response, next: NextFunction) {
        let tags;
        const selectedTags = request.query.tags;
        if (selectedTags) {
            tags = await this.repo
                .createQueryBuilder('tag')
                .where('tag.name in (:...selectedTags)', { selectedTags: arrayify(selectedTags) })
                .getMany();
        } else {
            tags = await this.repo.find();
        }

        return response.render('tag', {
            tags: tags.map((tag) => {
                return {
                    name: tag.name,
                    entriesLink: `/entries?tags=${encodeURI(tag.name)}`,
                    datesLink: `/dates?tags=${encodeURI(tag.name)}`,
                    deleteLink: `/tags/delete/${tag.id}`,
                };
            }),
            tagNames: (await this.repo.find()).map((tag) => tag.name),
        });
    }

    async create(request: Request, response: Response, next: NextFunction) {
        const tag = new Tag();
        tag.name = request.body.name;
        await this.repo.save(tag);
        response.redirect('back');
    }

    async delete(request: Request, response: Response, next: NextFunction) {
        const tag = await this.repo.findOne(request.params.id);
        this.repo.delete(tag);
        response.redirect('back');
    }
}
