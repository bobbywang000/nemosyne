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
        action: 'new',
    },
    {
        method: 'post',
        route: '/entries/new',
        controller: EntryController,
        action: 'create',
    },
    {
        method: 'get',
        route: '/entries/edit/:id',
        controller: EntryController,
        action: 'edit',
    },
    {
        method: 'post',
        route: '/entries/edit/:id',
        controller: EntryController,
        action: 'update',
    },
    // TODO: this is pretty ugly and not standard. Figure out how to add a delete using the proper
    // HTTP verb here.
    {
        method: 'get',
        route: '/entries/delete/:id',
        controller: EntryController,
        action: 'delete',
    },
    {
        method: 'get',
        route: '/dates',
        controller: DateRangeController,
        action: 'find',
    },
    {
        method: 'get',
        route: '/dates/list',
        controller: DateRangeController,
        action: 'list',
    },
    {
        method: 'post',
        route: '/dates/new',
        controller: DateRangeController,
        action: 'createOrUpdate',
    },
    {
        method: 'get',
        route: '/dates/edit/:id',
        controller: DateRangeController,
        action: 'edit',
    },
    {
        method: 'post',
        route: '/dates/edit/:id',
        controller: DateRangeController,
        action: 'createOrUpdate',
    },
    // TODO: this is pretty ugly and not standard. Figure out how to add a delete using the proper
    // HTTP verb here.
    {
        method: 'get',
        route: '/dates/delete/:id',
        controller: DateRangeController,
        action: 'delete',
    },
    {
        method: 'get',
        route: '/tags',
        controller: TagController,
        action: 'find',
    },
    {
        method: 'post',
        route: '/tags/new',
        controller: TagController,
        action: 'create',
    },
    // TODO: this is pretty ugly and not standard. Figure out how to add a delete using the proper
    // HTTP verb here.
    {
        method: 'get',
        route: '/tags/delete/:id',
        controller: TagController,
        action: 'delete',
    },
    {
        method: 'get',
        route: '/impressions',
        controller: ImpressionController,
        action: 'find',
    },
];
