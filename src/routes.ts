import { EntryController } from './controller/EntryController';
import { DateRangeController } from './controller/DateRangeController';

export const Routes = [
    {
        method: 'get',
        route: '/entries',
        controller: EntryController,
        action: 'all',
    },
    {
        method: 'get',
        route: '/entries/:subjectDate',
        controller: EntryController,
        action: 'onDate',
    },
    {
        method: 'get',
        route: '/dates',
        controller: DateRangeController,
        action: 'all',
    },
];
