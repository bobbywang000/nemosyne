import 'reflect-metadata';
import { createConnection } from 'typeorm';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Request, Response } from 'express';
import { Routes } from './routes';
import { join } from 'path';

const SRC_ROOT = 'src';

createConnection()
    .then(async (connection) => {
        // TODO: this is a dirty shameful hack to get around deleting items. I should fix this ASAP.
        await connection.query('PRAGMA foreign_keys=OFF');

        // create express app
        const app = express();
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(express.static(join(__dirname, '..', 'public')));

        // register express routes from defined application routes
        Routes.forEach((route) => {
            // eslint-disable-next-line @typescript-eslint/ban-types
            (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
                const result = new (route.controller as any)()[route.action](req, res, next).catch((error) => {
                    console.log(error);
                    res.status(404).send(res.render('error', { error: JSON.stringify(error, null, 2) }));
                });
                if (result instanceof Promise) {
                    result.then((result) => (result !== null && result !== undefined ? res.send(result) : undefined));
                } else if (result !== null && result !== undefined) {
                    res.json(result);
                }
            });
        });

        //The 404 Route (ALWAYS Keep this as the last route)
        app.all('*', (req, res, next) => {
            res.status(404).send(
                `Error:
                    Body:${JSON.stringify(req.body)}
                    Params:${JSON.stringify(req.params)}
                    Query Params:${JSON.stringify(req.query)}
                `,
            );
        });

        app.set('view engine', 'pug');
        app.set('views', join(SRC_ROOT, 'views'));

        // start express server
        app.listen(3000, '127.0.0.1');

        console.log('Express server has started on port 3000. Open http://localhost:3000/entries/new to start writing');
    })
    .catch((error) => console.log(error));
