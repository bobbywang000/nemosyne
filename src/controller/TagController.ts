import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Tag } from '../entity/Tag';

export class TagController {
    private repo = getRepository(Tag);

    async all(request: Request, response: Response, next: NextFunction) {
        return this.repo.find({ relations: ['dateRanges', 'dateRanges.entries'] });
    }

    async one(request: Request, response: Response, next: NextFunction) {
        return this.all(request, response, next);
    }
}
