/* tslint:disable no-var-requires*/
/* tslint:disable no-console*/
import 'reflect-metadata';
import {ModuleChecker as moduleChecker} from './checker';
// Create broker

const {ServiceBroker} = require('moleculer');
const broker = new ServiceBroker({
    logLevel: 'debug',
    logger: console
});
import posts from './posts.service';
// Load my service
broker.createService(posts);

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
