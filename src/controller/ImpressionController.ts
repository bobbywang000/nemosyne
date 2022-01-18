import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { DateRange } from '../entity/DateRange';
import { Tag } from '../entity/Tag';
import { dateToSlug, dateToSqliteTimestamp } from '../utils/dateUtils';
import { toExecutableJSArray } from '../utils/stringUtils';
import { Impression } from '../entity/Impression';

type SimpleImpression = {
    positivity: number;
    negativity: number;
};
export class ImpressionController {
    private repo = getRepository(Impression);
    private dateRepo = getRepository(DateRange);
    private tagRepo = getRepository(Tag);

    async showAll(request: Request, response: Response, next: NextFunction): Promise<void> {
        const rangesWithImpressions = await this.dateRepo
            .createQueryBuilder('range')
            .innerJoinAndSelect('range.impression', 'impression')
            .getMany();

        return response.render('impression', {
            existingJS: this.existingJS(rangesWithImpressions),
            tagNames: (await this.tagRepo.find()).map((tag) => tag.name),
            ...request.query,
        });
    }

    async find(request: Request, _response: Response, next: NextFunction): Promise<SimpleImpression> {
        try {
            const impression = (
                await this.dateRepo
                    .createQueryBuilder('range')
                    .where(`range.start = :date AND range.end = :date`, {
                        date: dateToSqliteTimestamp(new Date(request.params.date)),
                    })
                    .innerJoinAndSelect('range.impression', 'impression')
                    .getOne()
            ).impression;
            return {
                positivity: impression.positivity,
                negativity: impression.negativity,
            };
        } catch {
            return {
                positivity: 0,
                negativity: 0,
            };
        }
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
