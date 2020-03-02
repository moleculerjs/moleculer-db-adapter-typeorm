
import { Post } from './Post';

// @ts-ignore
import * as storeService from 'moleculer-db';
import { Action, Service } from 'moleculer-decorators';

import { TypeOrmDbAdapter } from '../src/adapter/adapter';

import * as moleculer from 'moleculer';

const voteSchema = { id: { type: 'number' } };
interface VotePayload {
    id: number;
}
@Service({
    adapter: new TypeOrmDbAdapter({
        database: 'memory',
        name: 'memory',
        type: 'sqlite'
    }),
    mixins: [{ ...storeService, name: 'store' }],
    model: Post,
    name: 'posts',
    settings: {
        fields: ['id', 'title', 'content', 'votes', 'status', 'author'],
        idField: 'id'
    }
})
export default class PostsService extends moleculer.Service {
    @Action({
        params: voteSchema
    })
    public async vote(ctx: moleculer.Context<VotePayload>) {
        return this.adapter.findById(ctx.params.id)
            .then((post: any) => {
                post.votes++;
                return this.adapter.repository.save(post);
            })
            .then(() => this.adapter.findById(ctx.params.id))
            .then((doc: any) => this.transformDocuments(ctx, ctx.params, doc));
    }

    @Action({
        params: voteSchema
    })
    public async unvote(ctx: moleculer.Context<VotePayload>) {
        return this.adapter.findById(ctx.params.id)
            .then((post: any) => {
                post.votes--;
                return this.adapter.repository.save(post);
            })
            .then(() => this.adapter.findById(ctx.params.id))
            .then((doc: any) => this.transformDocuments(ctx, ctx.params, doc));
    }

    public afterConnected() {
        this.logger.info('Connected successfully');
        return this.adapter.clear();
    }
}
