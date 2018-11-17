import {ServiceBroker} from 'moleculer';

jest.mock('typeorm');
import {createConnection} from 'typeorm';

import {TypeOrmDbAdapter} from '../../src/adapter';

const fakeModel = jest.fn();

describe('Test TypeOrmAdapter', () => {
    const repository = {
        clear: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        delete: jest.fn().mockResolvedValue(Promise.resolve()),
        find: jest.fn(),
        findByIds: jest.fn().mockResolvedValue([5]),
        findOne: jest.fn(),
        insert: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    };

    describe('model definition as description', () => {
        const adapter = new TypeOrmDbAdapter({type: 'sqlite', database: 'test'});

        const broker = new ServiceBroker({logger: false});
        const service = broker.createService({
            adapter,
            model: fakeModel,
            name: 'store'
        });
        beforeEach(async () => {
            repository.clear.mockClear();
            repository.find.mockClear();
            repository.count.mockClear();
            repository.findByIds.mockClear();
            repository.findOne.mockClear();
            repository.save.mockClear();
            repository.update.mockClear();
            repository.delete.mockClear();
            (createConnection as jest.Mock).mockResolvedValue({getRepository: () => repository});
            await adapter.init(broker, service);
        });

        describe('init', () => {
            it('should be created', () => {
                expect(adapter).toBeDefined();
                expect(adapter.init).toBeDefined();
                expect(adapter.connect).toBeDefined();
                expect(adapter.disconnect).toBeDefined();
                expect(adapter.find).toBeDefined();
                expect(adapter.findOne).toBeDefined();
                expect(adapter.findById).toBeDefined();
                expect(adapter.findByIds).toBeDefined();
                expect(adapter.count).toBeDefined();
                expect(adapter.insert).toBeDefined();
                expect(adapter.insertMany).toBeDefined();
                expect(adapter.updateMany).toBeDefined();
                expect(adapter.updateById).toBeDefined();
                expect(adapter.removeMany).toBeDefined();
                expect(adapter.removeById).toBeDefined();
                expect(adapter.clear).toBeDefined();
                expect(adapter.beforeSaveTransformID).toBeInstanceOf(Function);
                expect(adapter.afterRetrieveTransformID).toBeInstanceOf(Function);
            });

            it('call init', () => {
                adapter.init(broker, service);
                expect(adapter.broker).toBe(broker);
                expect(adapter.service).toBe(service);
            });

            it('call connect with uri', async () => {
                await adapter.connect();
                expect(createConnection).toHaveBeenCalledTimes(1);
                expect(createConnection).toHaveBeenCalledWith(expect.objectContaining({
                    database: 'test',
                    type: 'sqlite'
                }));
                expect(createConnection).toHaveBeenCalledWith(
                    expect.objectContaining({entities: expect.arrayContaining([fakeModel])}));

                expect(adapter.repository).toBe(repository);
            });

            it('call disconnect', () => {
                adapter.connection = {close: jest.fn().mockResolvedValue(null)} as any;

                return adapter.disconnect().then(() => {
                    expect(adapter.connection.close).toHaveBeenCalledTimes(1);
                });
            });
        });
        describe('Test createCursor', () => {

            it('call without params', () => {

                adapter.createCursor({query: {}}, false);
                expect(adapter.repository.find).toHaveBeenCalledTimes(1);
                expect(adapter.repository.find).toHaveBeenCalledWith({where: {}});
            });

            it('call without params as counting', () => {
                adapter.createCursor(null, true);
                expect(adapter.repository.count).toHaveBeenCalledTimes(1);
                expect(adapter.repository.count).toHaveBeenCalledWith();
            });

            it('call with query', () => {
                const query = {};
                adapter.createCursor({query});
                expect(adapter.repository.find).toHaveBeenCalledTimes(1);
                expect(adapter.repository.find).toHaveBeenCalledWith({where: query});
            });

            it('call with query & counting', () => {
                const query = {};
                adapter.createCursor({query}, true);
                expect(adapter.repository.count).toHaveBeenCalledTimes(1);
                expect(adapter.repository.count).toHaveBeenCalledWith({where: query});
            });

            it('call with sort string', () => {
                const query = {};
                adapter.createCursor({query, sort: '-votes title'});
                expect(adapter.repository.find).toHaveBeenCalledTimes(1);
                expect(adapter.repository.find).toHaveBeenCalledWith({
                    order: {votes: 'DESC', title: 'ASC'},
                    where: query
                });
            });

            it('call with sort array', () => {
                const query = {};
                adapter.createCursor({query, sort: ['createdAt', 'title']});
                expect(adapter.repository.find).toHaveBeenCalledTimes(1);
                expect(adapter.repository.find).toHaveBeenCalledWith({
                    order: {createdAt: 'ASC', title: 'ASC'},
                    where: query
                });
            });

            it('call with limit & offset', () => {
                adapter.createCursor({limit: 5, offset: 10});
                expect(adapter.repository.find).toHaveBeenCalledTimes(1);
                expect(adapter.repository.find).toHaveBeenCalledWith({
                    skip: 10,
                    take: 5,
                    where: {}
                });
            });

            it('call find', () => {
                adapter.createCursor = jest.fn(() => Promise.resolve());

                const params = {};
                const find = adapter.find(params);
                expect(adapter.createCursor).toHaveBeenCalledTimes(1);
                expect(adapter.createCursor).toHaveBeenCalledWith(params, false);
            });

            it('call findOne', async () => {
                const age: any = {age: 25};
                await adapter.findOne(age);
                expect(adapter.repository.findOne).toHaveBeenCalledTimes(1);
                expect(adapter.repository.findOne).toHaveBeenCalledWith(age);
            });

            it('call findByPk', async () => {
                await adapter.findById(5);
                expect(adapter.repository.findByIds).toHaveBeenCalledTimes(1);
                expect(adapter.repository.findByIds).toHaveBeenCalledWith([5]);
            });

            it('call findByIds', async () => {
                await adapter.findByIds([5]);
                expect(adapter.repository.findByIds).toHaveBeenCalledTimes(1);
                expect(adapter.repository.findByIds).toHaveBeenCalledWith([5]);
            });

            it('call count', () => {
                adapter.createCursor = jest.fn(() => Promise.resolve());
                const params = {};
                adapter.count(params);
                expect(adapter.createCursor).toHaveBeenCalledTimes(1);
                expect(adapter.createCursor).toHaveBeenCalledWith(params, true);
            });

            it('call insert', () => {
                const entity = {};
                adapter.insert(entity);
                expect(adapter.repository.save).toHaveBeenCalledTimes(1);
                expect(adapter.repository.save).toHaveBeenCalledWith(entity);
            });

            it('call inserts', () => {
                const entities = [{name: 'John'}, {name: 'Jane'}];

                adapter.insertMany(entities);
                expect(adapter.repository.create).toHaveBeenCalledTimes(2);
                expect(adapter.repository.create).toHaveBeenCalledWith(entities[0]);
                expect(adapter.repository.create).toHaveBeenCalledWith(entities[1]);

            });

            it('call updateMany', () => {
                const where = {};
                const update = {};
                adapter.updateMany(where, update);
                expect(adapter.repository.update).toHaveBeenCalledTimes(1);
                expect(adapter.repository.update).toHaveBeenCalledWith({where}, update);
            });

            it('call updateById', () => {
                const update = {
                    $set: {title: 'Test'}
                };

                adapter.updateById(5, update);
                expect(adapter.repository.update).toHaveBeenCalledTimes(1);
                expect(adapter.repository.update).toHaveBeenCalledWith(5, update.$set);

            });

            it('call destroy', () => {
                const where = {};
                adapter.removeMany(where);
                expect(adapter.repository.delete).toHaveBeenCalledTimes(1);
                expect(adapter.repository.delete).toHaveBeenCalledWith(where);
            });

            it('call entity.destroy', async () => {
                const {id} = await adapter.removeById(5);
                expect(id).toBe(5);
                expect(adapter.repository.delete).toHaveBeenCalledTimes(1);
                expect(adapter.repository.delete).toHaveBeenCalledWith(5);
            });

            it('call clear', () => {
                adapter.clear();
                expect(adapter.repository.clear).toHaveBeenCalledTimes(1);
            });
        });
    });
});
