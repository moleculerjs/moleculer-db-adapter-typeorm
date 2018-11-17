import 'reflect-metadata';
import {

    createConnection,
    ConnectionOptions,
    Connection,
    EntitySchema,
    Repository,
    FindOneOptions,
    DeepPartial, FindConditions, FindManyOptions
} from 'typeorm';
import * as Moleculer from 'moleculer';
/* tslint:disable-next-line */
import {Service, ServiceBroker} from 'moleculer';

interface IndexMap {
    [key: string]: string;
}

export class TypeOrmDbAdapter<T> {
    public broker: Moleculer.ServiceBroker;
    public service: Moleculer.Service;
    public repository: Repository<T>;
    public connection: Connection;
    private opts: ConnectionOptions;
    private entity: EntitySchema<T>;

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
    public findOne(query: FindOneOptions) {
        return this.repository.findOne(query);
    }

    /**
     * Find an entities by ID
     *
     * @param {any} id
     * @returns {Promise}
     *
     * @memberof SequelizeDbAdapter
     */
    public findById(id: number) {
        return this.repository.findByIds([id]).then((result) => Promise.resolve(result[0]));
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

    public insert(entity: any) {
        return this.repository.save(entity);
    }

    public create(entity: any) {
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
    public insertMany(entities: any[]) {
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
    public updateMany(where: FindConditions<T>, update: DeepPartial<T>) {
        const criteria: FindConditions<T> = {where} as any;
        return this.repository.update(criteria, update);
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
    public updateById(id: number, update: { $set: DeepPartial<T> }) {
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
    public removeMany(where: FindConditions<T>) {
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

    public entityToObject(entity: T) {
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
    public createCursor(params: any, isCounting: boolean = false) {
        if (params) {
            const query: FindManyOptions<T> = {
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
                    query.order = sort as any;
                }
            }

            // Offset
            if (Number.isInteger(params.offset) && params.offset > 0) {
                query.skip = params.offset;
            }

            // Limit
            if (Number.isInteger(params.limit) && params.limit > 0) {
                query.take = params.limit;
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
    public beforeSaveTransformID(entity: T, idField: string) {
        return entity;
    }

    /**
     * For compatibility only.
     * @param {Object} entity
     * @param {String} idField
     * @memberof SequelizeDbAdapter
     * @returns {Object} Entity
     */
    public afterRetrieveTransformID(entity: T, idField: string) {
        return entity;
    }

    public init(broker: ServiceBroker, service: Service) {
        this.broker = broker;
        this.service = service;
        const entityFromService = this.service.schema.model;
        const isValid = !!entityFromService.constructor;
        if (!isValid) {
            throw new Error('if model provided - it should a typeorm repository');
        }
        this.entity = entityFromService;

    }

    public connect() {
        const connectionPromise = createConnection({
            ...this.opts,
            entities: [this.entity],
            synchronize: true
        });
        return connectionPromise.then((connection) => {
            this.connection = connection;
            this.repository = this.connection
                .getRepository(this.entity);
        });
    }

    public disconnect() {
        if (this.connection) {
            return this.connection.close();
        }
        return Promise.resolve();
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
            // @ts-ignore
            return sortObj;
        }

        if (typeof sort === 'object') {
            return sort;
        }
        return {};
    }

}
