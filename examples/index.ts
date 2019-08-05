import loggerWrapper from './bin/logger';
// @ts-ignore
import * as  storeService from 'moleculer-db';
import * as  moleculer from 'moleculer';
const {ServiceBroker} = moleculer;
import { Post } from './Post';
import { TypeOrmDbAdapter } from '../src';

import { ModuleChecker } from './checker';
import { start } from './utils';
import { testCasesFiller } from './checkerTestCases';
const {extend} = moleculer.Logger;
const broker = new ServiceBroker({
    logLevel: 'debug',
    logger: (bindings: any) => extend(loggerWrapper(bindings)),
});

broker.createService(storeService, {
    adapter: new TypeOrmDbAdapter({
        database: 'memory',
        name: 'memory',
        type: 'sqlite',
    }),
    name: 'posts',

    model: Post,
    settings: {
        fields: ['id', 'title', 'content', 'votes', 'status', 'author'],
        idField: 'id'
    },

    actions: {
        vote(ctx: moleculer.Context) {
            return this.adapter.findById(ctx.params.id)
                .then((post: Post) => {
                    post.votes++;
                    return this.adapter.repository.save(post);
                })
                .then(() => this.adapter.findById(ctx.params.id))
                .then((doc: any) => this.transformDocuments(ctx, ctx.params, doc));
        },

        unvote(ctx: moleculer.Context) {
            return this.adapter.findById(ctx.params.id)
                .then((post: Post) => {
                    post.votes--;
                    return this.adapter.repository.save(post);
                })
                .then(() => this.adapter.findById(ctx.params.id))
                .then((doc: any) => this.transformDocuments(ctx, ctx.params, doc));
        }
    },

    afterConnected() {
        this.logger.info('Connected successfully');
        return this.adapter.clear();
    }
});

const checker = new ModuleChecker(11);
testCasesFiller(broker, checker);

start(broker, checker);
