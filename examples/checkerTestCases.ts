import { ServiceBroker } from 'moleculer';
import loggerWrapper from './bin/logger';
import { ModuleChecker } from './checker';

const logger = loggerWrapper(module);

export function testCasesFiller(broker: ServiceBroker, checker: ModuleChecker) {
    let id: any = [];
    checker.add('COUNT', () => broker.call('posts.count'), (res: any) => {
        logger.info('', res);
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
        logger.info('Saved: ', doc);
        return doc.id && doc.title === 'Hello' &&
                doc.content === 'Post content' && doc.votes === 2 && doc.status === true;
    });

// List posts
    checker.add('--- FIND ---', () => broker.call('posts.find'), (res: any) => {
        logger.info(res);
        return res.length === 1 && res[0].id === id;
    });

// Get a post
    checker.add('--- GET ---', () => {
        return broker.call('posts.get', {id});
    }, (res: any) => {
        logger.info(res);
        return res.id === id;
    });

// Vote a post
    checker.add('--- VOTE ---', () => broker.call('posts.vote', {
        id
    }), (res: any) => {
        logger.info(res);
        return res.id === id && res.votes === 3;
    });

// Update a posts
    checker.add('--- UPDATE ---', () => broker.call('posts.update', {
        content: 'Post content 2',
        id,
        title: 'Hello 2',
        updatedAt: new Date()
    }), (doc: any) => {
        logger.info(doc);
        return doc.id && doc.title === 'Hello 2' && doc.content === 'Post content 2' &&
                doc.votes === 3 && doc.status === true && doc.updatedAt;
    });

// Get a post
    checker.add('--- GET ---', () => broker.call('posts.get', {id}), (doc: any) => {
        logger.info(doc);
        return doc.id === id && doc.title === 'Hello 2' && doc.votes === 3;
    });

// Unvote a post
    checker.add('--- UNVOTE ---', () => broker.call('posts.unvote', {
        id
    }), (res: any) => {
        logger.info(res);
        return res.id === id && res.votes === 2;
    });

// Count of posts
    checker.add('--- COUNT ---', () => broker.call('posts.count'), (res: any) => {
        logger.info(res);
        return res === 1;
    });

// Remove a post
    checker.add('--- REMOVE ---', () => broker.call('posts.remove', {id}), (res: any) => {
        logger.info(res);
        return res.id === id;
    });

// Count of posts
    checker.add('--- COUNT ---', () => broker.call('posts.count'), (res: any) => {
        logger.info(res);
        return res === 0;
    });
}
