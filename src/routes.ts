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
        method: 'post',
        route: '/entries',
        controller: EntryController,
        action: 'save',
    },
    {
        method: 'get',
        route: '/datesGoogle',
        controller: DateRangeController,
        action: 'allGoogleCharts',
    },
    // {
    //     method: 'get',
    //     route: '/dates/:date',
    //     controller: DateRangeController,
    //     action: 'onDate',
    // },
    // For now no one needs to delete an entry.
    // {
    //     method: 'delete',
    //     route: '/entries/:id',
    //     controller: EntryController,
    //     action: 'remove',
    // },
];
