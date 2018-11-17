'use strict';

import {Post} from './Post';

const {ServiceBroker} = require('moleculer');
const storeService = require('moleculer-db');
import {TypeOrmDbAdapter} from '../../src/adapter';
import {Entity} from 'typeorm';
import {Context} from 'moleculer';

const moduleChecker = require('../checker');

// Create broker
const broker = new ServiceBroker({
    logger: console,
    logLevel: 'debug'
});

// Load my service
broker.createService(storeService, {
    adapter: new TypeOrmDbAdapter({
        database: 'test',
        logging: true,
        name: 'memory',
        type: 'postgres',
        username: 'postgres',
        password: 'vGoXfybivg',
        port: 31161
    }),
    name: 'posts',

    model: Post,
    settings: {
        fields: ['id', 'title', 'content', 'votes', 'status', 'author'],
        idField: 'id'
    },

    actions: {
        vote(ctx: Context) {
            return this.adapter.findById(ctx.params.id)
                .then((post: Post) => {
                    post.votes++;
                    return this.adapter.repository.save(post);
                })
                .then(() => this.adapter.findById(ctx.params.id))
                .then((doc) => this.transformDocuments(ctx, ctx.params, doc));
        },

        unvote(ctx: Context) {
            return this.adapter.findById(ctx.params.id)
                .then((post: Post) => {
                    post.votes--;
                    return this.adapter.repository.save(post);
                })
                .then(() => this.adapter.findById(ctx.params.id))
                .then((doc) => this.transformDocuments(ctx, ctx.params, doc));
        }
    },

    afterConnected() {
        this.logger.info('Connected successfully');
        return this.adapter.clear();
    }
});

const checker = new moduleChecker(11);

// Start checks
function start() {
    broker.start()
        .delay(500)
        .then(() => checker.execute())
        .catch(console.error)
        .then(() => broker.stop())
        .then(() => checker.printTotal());
}

// --- TEST CASES ---

let id = [];

// Count of posts
checker.add('COUNT', () => broker.call('posts.count'), (res) => {
    console.log(res);
    return res === 0;
});

// Create new Posts
checker.add('--- CREATE ---', () => broker.call('posts.create', {
    content: 'Post content',
    status: true,
    title: 'Hello',
    votes: 2
}), (doc) => {
    id = doc.id;
    console.log('Saved: ', doc);
    return doc.id && doc.title === 'Hello' && doc.content === 'Post content' && doc.votes === 2 && doc.status === true;
});

// List posts
checker.add('--- FIND ---', () => broker.call('posts.find'), (res) => {
    console.log(res);
    return res.length === 1 && res[0].id === id;
});

// Get a post
checker.add('--- GET ---', () => {
    return broker.call('posts.get', {id});
}, (res) => {
    console.log(res);
    return res.id === id;
});

// Vote a post
checker.add('--- VOTE ---', () => broker.call('posts.vote', {
    id
}), (res) => {
    console.log(res);
    return res.id === id && res.votes === 3;
});

// Update a posts
checker.add('--- UPDATE ---', () => broker.call('posts.update', {
    id,
    title: 'Hello 2',
    content: 'Post content 2',
    updatedAt: new Date()
}), (doc) => {
    console.log(doc);
    return doc.id && doc.title === 'Hello 2' && doc.content === 'Post content 2' && doc.votes === 3 && doc.status === true && doc.updatedAt;
});

// Get a post
checker.add('--- GET ---', () => broker.call('posts.get', {id}), (doc) => {
    console.log(doc);
    return doc.id === id && doc.title === 'Hello 2' && doc.votes === 3;
});

// Get a post
checker.add('--- SEARCH ---', () => broker.call('posts.find', {search: 'o', searchFields: 'title content'}), (doc) => {
    console.log(doc);
    return doc.length === 2;
});


// Unvote a post
checker.add('--- UNVOTE ---', () => broker.call('posts.unvote', {
    id
}), (res) => {
    console.log(res);
    return res.id === id && res.votes === 2;
});

// Count of posts
checker.add('--- COUNT ---', () => broker.call('posts.count'), (res) => {
    console.log(res);
    return res === 1;
});

// Remove a post
checker.add('--- REMOVE ---', () => broker.call('posts.remove', {id}), (res) => {
    console.log(res);
    return res.id === id;
});

// Count of posts
checker.add('--- COUNT ---', () => broker.call('posts.count'), (res) => {
    console.log(res);
    return res === 0;
});

start();
