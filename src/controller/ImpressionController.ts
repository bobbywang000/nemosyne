import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { DateRange } from '../entity/DateRange';
import { Tag } from '../entity/Tag';
import { dateToSlug } from '../utils/dateUtils';
import { toExecutableJSArray } from '../utils/stringUtils';

export class ImpressionController {
    private repo = getRepository(DateRange);
    private tagRepo = getRepository(Tag);

    async find(request: Request, response: Response, next: NextFunction): Promise<void> {
        const rangesWithImpressions = await this.repo
            .createQueryBuilder('range')
            .innerJoinAndSelect('range.impression', 'impression')
            .getMany();

        return response.render('impression', {
            existingJS: this.existingJS(rangesWithImpressions),
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
            ...request.query,
        });
    }

    private existingJS(ranges: DateRange[]): string {
        return `anychart.onDocumentReady(function () {
            render(${toExecutableJSArray(ranges.map((range) => this.rangeToJSArray(range)))})
        })`;
    }

    private rangeToJSArray(range: DateRange): string {
        return toExecutableJSArray([
            "'" + dateToSlug(range.start) + "'",
            range.impression.positivity,
            range.impression.negativity,
            range.impression.positivity + range.impression.negativity,
        ]);
    }
}
