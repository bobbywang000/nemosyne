import { EntryController } from './controller/EntryController';

export const Routes = [
    {
        method: 'get',
        route: '/entries',
        controller: EntryController,
        action: 'all',
    },
    {
        method: 'get',
        route: '/entries/:id',
        controller: EntryController,
        action: 'onDate',
    },
    {
        method: 'post',
        route: '/entries',
        controller: EntryController,
        action: 'save',
    },
    // For now no one needs to delete an entry.
    // {
    //     method: 'delete',
    //     route: '/entries/:id',
    //     controller: EntryController,
    //     action: 'remove',
    // },
];
