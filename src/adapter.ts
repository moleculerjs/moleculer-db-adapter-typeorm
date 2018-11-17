import 'reflect-metadata';
import {

    createConnection,
    ConnectionOptions,
    Connection, EntitySchema, Not, Any, createQueryBuilder, Entity, Repository, Like
} from 'typeorm';
import * as Moleculer from 'moleculer';
import {Service, ServiceBroker} from 'moleculer';

interface IndexMap {
    [key: string]: string;
}

export class TypeOrmDbAdapter {
    private broker: Moleculer.ServiceBroker;
    private service: Moleculer.Service;
    private opts: ConnectionOptions;
    private connection: Connection;
    private repository: Repository<any>;
    private entity: EntitySchema;

    constructor(opts: ConnectionOptions) {
        this.opts = opts;
    }

    /**
     * Find all entities by filters.
     *
     * Available filter props:
     *    - limit
     *  - offset
     *  - sort
     *  - search
     *  - searchFields
     *  - query
     *
     * @param {any} filters
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public find(filters: any) {
        return this.createCursor(filters, false);
    }

    /**
     * Find an repository by query
     *
     * @param {Object} query
     * @returns {Promise}
     * @memberof MemoryDbAdapter
     */
    public findOne(query) {
        return this.repository.findOne(query);
    }

    /**
     * Find an entities by ID
     *
     * @param {any} _id
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public findById(_id) {
        return this.repository.findByIds([_id]).then((result) => Promise.resolve(result[0]));
    }

    /**
     * Find any entities by IDs
     *
     * @param {Array} idList
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public findByIds(idList: any[]) {
        return this.repository.findByIds(idList);
    }

    /**
     * Get count of filtered entites
     *
     * Available filter props:
     *  - search
     *  - searchFields
     *  - query
     *
     * @param {Object} [filters={}]
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public count(filters = {}) {
        return this.createCursor(filters, true);
    }

    /**
     * Insert an repository
     *
     * @param {Object} repository
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public insert(entity) {
        return this.repository.save(entity);
    }

    public create(entity) {
        return this.insert(entity);
    }

    /**
     * Insert many entities
     *
     * @param {Array} entities
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public insertMany(entities) {
        return Promise.all(entities.map((e) => this.repository.create(e)));
    }

    /**
     * Update many entities by `where` and `update`
     *
     * @param {Object} where
     * @param {Object} update
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public updateMany(where, update) {
        return this.repository.update({where}, update);
    }

    /**
     * Update an repository by ID and `update`
     *
     * @param {any} id
     * @param {Object} update
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public updateById(id: number, update) {
        return this.repository.update(id, update.$set);
    }

    /**
     * Remove entities which are matched by `where`
     *
     * @param {Object} where
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public removeMany(where) {
        return this.repository.delete(where);
    }

    /**
     * Remove an repository by ID
     *
     * @param {any} id
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public removeById(id: number) {
        const result = this.repository.delete(id);
        return result.then((res) => {
            return {id};
        });
    }

    /**
     * Clear all entities from collection
     *
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public clear() {
        return this.repository.clear();
    }

    /**
     * Convert DB repository to JSON object
     *
     * @param {any} repository
     * @returns {Object}
     * @memberof SequelizeDbAdapter
     */
    public entityToObject(entity) {
        return entity;
    }

    /**
     * Create a filtered query
     * Available filters in `params`:
     *  - search
     *    - sort
     *    - limit
     *    - offset
     *  - query
     *
     * @param {Object} params
     * @param {Boolean} isCounting
     * @returns {Promise}
     */
    public createCursor(params, isCounting: boolean) {
        if (params) {
            const query = {
                where: params.query || {}
            };

            // Text search
            if (typeof params.search === 'string' && params.search !== '') {
                throw new Error('Not supported because of missing or clause meanwhile in typeorm');
            }

            // Sort
            if (params.sort) {
                const sort = this.transformSort(params.sort);
                if (sort) {
                    query.order = sort;
                }
            }

            // Offset
            if (Number.isInteger(params.offset) && params.offset > 0) {
                query.offset = params.offset;
            }

            // Limit
            if (Number.isInteger(params.limit) && params.limit > 0) {
                query.limit = params.limit;
            }

            if (isCounting) {
                return this.repository.count(query);
            }
            else {
                return this.repository.find(query);
            }
        }

        if (isCounting) {
            return this.repository.count();
        }
        else {
            return this.repository.find();
        }
    }

    /**
     * For compatibility only.
     * @param {Object} entity
     * @param {String} idField
     * @memberof SequelizeDbAdapter
     * @returns {Object} Entity
     */
    public beforeSaveTransformID(entity, idField) {
        return entity;
    }

    /**
     * For compatibility only.
     * @param {Object} entity
     * @param {String} idField
     * @memberof SequelizeDbAdapter
     * @returns {Object} Entity
     */
    public afterRetrieveTransformID(entity, idField) {
        return entity;
    }

    /**
     * Convert the `sort` param to a `sort` object to Sequelize queries.
     *
     * @param {String|Array<String>|Object} paramSort
     * @returns {Object} Return with a sort object like `[["votes", "ASC"], ["title", "DESC"]]`
     * @memberof SequelizeDbAdapter
     */
    private transformSort(paramSort: string | string[]): { [columnName: string]: ('ASC' | 'DESC') } {
        let sort = paramSort;
        if (typeof sort === 'string') {
            sort = sort.replace(/,/, ' ').split(' ');
        }
        if (Array.isArray(sort)) {
            const sortObj: IndexMap = {};
            sort.forEach((s) => {
                if (s.startsWith('-')) {
                    sortObj[s.slice(1)] = 'DESC';
                }
                else {
                    sortObj[s] = 'ASC';
                }
            });
            return sortObj;
        }

        if (typeof sort === 'object') {
            return sort;
        }
        return {};
    }

    private init(broker: ServiceBroker, service: Service) {
        this.broker = broker;
        this.service = service;
        const entityFromService = this.service.schema.model;
        const isValid = !!entityFromService.constructor;
        if (!isValid) {
            throw new Error('if model provided - it should a typeorm repository');
        }
        this.entity = entityFromService;

    }

    private connect() {
        return createConnection({
            ...this.opts,
            entities: [this.entity],
            synchronize: true
        }).then((connection) => {
            this.connection = connection;
            this.repository = this.connection
                .getRepository(this.entity);
            this.service.schema.model = this.repository;
        });
    }

    private disconnect() {
        if (this.connection) {
            return this.connection.close();
        }
        return Promise.resolve();
    }

}
