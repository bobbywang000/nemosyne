import { getRepository } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import { DateRange } from '../entity/DateRange';

export class DateRangeController {
    private repo = getRepository(DateRange);

    async allGoogleCharts(request: Request, response: Response, next: NextFunction) {
        const ranges = await this.repo.createQueryBuilder('range').where('range.start != range.end').getMany();
        return response.render('range_google', {
            existingJS: this.existingGoogleJS(ranges),
        });
    }

    existingGoogleJS(ranges: DateRange[]): string {
        return `
google.charts.load('current', { packages: ['timeline'] });
google.charts.setOnLoadCallback(drawChart);
function drawChart() {
    var container = document.getElementById('timeline');
    var chart = new google.visualization.Timeline(container);
    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'dummy' });
    dataTable.addColumn({ type: 'string', id: 'label' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });
    dataTable.addRows([
        ${ranges.map((range) => this.formatRange(range)).join(',\n')}
    ]);

    chart.draw(dataTable);
}
        `.trim();
    }

    formatRange(range: DateRange): string {
        return `['', "${
            range.title ? range.title.replace(/"/g, "'") : ''
        }", new Date('${range.start.toISOString()}'), new Date('${this.getDateOffset(range.end, 1).toISOString()}')]`;
    }

    async onDate(request: Request, response: Response, next: NextFunction) {
        return [];
    }

    // TODO: Consolidate w/ the same method in EntryController
    getDateOffset(date: Date, days: number) {
        const offsetDate = new Date(date);
        offsetDate.setDate(offsetDate.getDate() + days);
        return offsetDate;
    }
}
