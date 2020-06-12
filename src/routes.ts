import { EntryController } from './controller/EntryController';
import { DateRangeController } from './controller/DateRangeController';
import { TagController } from './controller/TagController';
import { ImpressionController } from './controller/ImpressionController';

export const Routes = [
    {
        method: 'get',
        route: '/entries',
        controller: EntryController,
        action: 'find',
    },
    {
        method: 'get',
        route: '/entries/on/:subjectDate',
        controller: EntryController,
        action: 'on',
    },
    {
        method: 'get',
        route: '/entries/new',
        controller: EntryController,
        action: 'edit',
    },
    {
        method: 'post',
        route: '/entries/new',
        controller: EntryController,
        action: 'create',
    },
    {
        method: 'get',
        route: '/dates',
        controller: DateRangeController,
        action: 'find',
    },
    {
        method: 'get',
        route: '/tags',
        controller: TagController,
        action: 'find',
    },
    {
        method: 'get',
        route: '/impressions',
        controller: ImpressionController,
        action: 'find',
    },
];
