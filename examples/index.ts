// @ts-ignore
import * as storeService from 'moleculer-db';
import * as moleculer from 'moleculer';
const { ServiceBroker } = moleculer;
import { Post } from './Post';
import { TypeOrmDbAdapter } from '../src';

import { ModuleChecker } from './checker';
import { start } from './utils';
import { testCasesFiller } from './checkerTestCases';
const broker = new ServiceBroker({
    logLevel: 'debug'
});

interface PostPayload {
    id: any;
}
broker.createService({ ...storeService, name: 'store' }, {
    adapter: new TypeOrmDbAdapter({
        database: 'memory',
        name: 'memory',
        type: 'sqlite'
    }),
    name: 'posts',

    model: Post,
    settings: {
        fields: ['id', 'title', 'content', 'votes', 'status', 'author'],
        idField: 'id'
    },

    actions: {
        vote(ctx: moleculer.Context<PostPayload>) {
            return this.adapter.findById(ctx.params.id)
                .then((post: Post) => {
                    post.votes++;
                    return this.adapter.repository.save(post);
                })
                .then(() => this.adapter.findById(ctx.params.id))
                .then((doc: any) => this.transformDocuments(ctx, ctx.params, doc));
        },

        unvote(ctx: moleculer.Context<PostPayload>) {
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
