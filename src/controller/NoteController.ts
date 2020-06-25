import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { Note } from '../entity/Note';
import { Tag } from '../entity/Tag';
import { ContentType } from '../enums';
import { parseDateOrDefault } from '../utils/dateUtils';

export class NoteController {
    private repo = getRepository(Note);
    private tagRepo = getRepository(Tag);

    async edit(request: Request, response: Response, next: NextFunction) {
        return response.render('editNote', {
            contentType: ContentType.MARKDOWN,
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
        });
    }

    async create(request: Request, response: Response, next: NextFunction) {
        const note = new Note();
        const body = request.body;

        note.content = body.content;
        note.contentType = body.contentType;

        const tag = await this.tagRepo.findOne({
            where: {
                name: body.tags,
            },
        });
        note.tag = tag;

        if (body.importance) {
            note.importance = body.importance;
        }

        note.writeDate = parseDateOrDefault(body.writeDate);

        await this.repo.save(note);
        response.redirect(`/tags/name/${encodeURIComponent(tag.name)}`);
    }

    async delete(request: Request, response: Response, next: NextFunction) {
        await this.repo.delete(request.params.id);
        response.redirect('back');
    }
}
