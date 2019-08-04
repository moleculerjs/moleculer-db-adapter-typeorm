import { sleep } from './utils';

// @ts-ignore
import * as  storeService from 'moleculer-db';
import * as  moleculer from 'moleculer';
const {ServiceBroker} = moleculer;
import { Post } from './Post';
import { TypeOrmDbAdapter } from '../src';

/* tslint:disable no-console*/
import { ModuleChecker as moduleChecker } from './checker';

const broker = new ServiceBroker({
    logLevel: 'debug'
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

const checker = new moduleChecker(11);

async function start() {
    try {
        await broker.start();
        await sleep();
        await checker.execute();
    }
    catch(e){
        console.error(e);
    }
    finally{
        await broker.stop();
        checker.printTotal();
    }
}

// --- TEST CASES ---

let id: any = [];

// Count of posts
checker.add('COUNT', () => broker.call('posts.count'), (res: any) => {
    console.log(res);
    return res === 0;
});

// Create new Posts
checker.add('--- CREATE ---', () => broker.call('posts.create', {
    content: 'Post content',
    status: true,
    title: 'Hello',
    votes: 2
}), (doc: any) => {
    id = doc.id;
    console.log('Saved: ', doc);
    return doc.id && doc.title === 'Hello' && doc.content === 'Post content' && doc.votes === 2 && doc.status === true;
});

// List posts
checker.add('--- FIND ---', () => broker.call('posts.find'), (res: any) => {
    console.log(res);
    return res.length === 1 && res[0].id === id;
});

// Get a post
checker.add('--- GET ---', () => {
    return broker.call('posts.get', {id});
}, (res: any) => {
    console.log(res);
    return res.id === id;
});

// Vote a post
checker.add('--- VOTE ---', () => broker.call('posts.vote', {
    id
}), (res: any) => {
    console.log(res);
    return res.id === id && res.votes === 3;
});

// Update a posts
checker.add('--- UPDATE ---', () => broker.call('posts.update', {
    content: 'Post content 2',
    id,
    title: 'Hello 2',
    updatedAt: new Date()
}), (doc: any) => {
    console.log(doc);
    return doc.id && doc.title === 'Hello 2' && doc.content === 'Post content 2' &&
        doc.votes === 3 && doc.status === true && doc.updatedAt;
});

// Get a post
checker.add('--- GET ---', () => broker.call('posts.get', {id}), (doc: any) => {
    console.log(doc);
    return doc.id === id && doc.title === 'Hello 2' && doc.votes === 3;
});

// Unvote a post
checker.add('--- UNVOTE ---', () => broker.call('posts.unvote', {
    id
}), (res: any) => {
    console.log(res);
    return res.id === id && res.votes === 2;
});

// Count of posts
checker.add('--- COUNT ---', () => broker.call('posts.count'), (res: any) => {
    console.log(res);
    return res === 1;
});

// Remove a post
checker.add('--- REMOVE ---', () => broker.call('posts.remove', {id}), (res: any) => {
    console.log(res);
    return res.id === id;
});

// Count of posts
checker.add('--- COUNT ---', () => broker.call('posts.count'), (res: any) => {
    console.log(res);
    return res === 0;
});

start();
