import { EntryController } from './controller/EntryController';
import { DateRangeController } from './controller/DateRangeController';
import { TagController } from './controller/TagController';

export const Routes = [
    {
        method: 'get',
        route: '/entries',
        controller: EntryController,
        action: 'all',
    },
    {
        method: 'get',
        route: '/entries/on/:subjectDate',
        controller: EntryController,
        action: 'on',
    },
    {
        method: 'get',
        route: '/entries/from/:start/to/:end',
        controller: EntryController,
        action: 'between',
    },
    {
        method: 'get',
        route: '/dates',
        controller: DateRangeController,
        action: 'all',
    },
    {
        method: 'get',
        route: '/dates/from/:start/to/:end',
        controller: DateRangeController,
        action: 'between',
    },
    {
        method: 'get',
        route: '/tags',
        controller: TagController,
        action: 'all',
    },
];
