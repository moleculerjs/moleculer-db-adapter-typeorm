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

    public find(filters: any) {
        return this.createCursor(filters, false);
    }

    public findOne(query: FindOneOptions) {
        return this.repository.findOne(query);
    }

    public findById(id: number) {
        return this.repository.findByIds([id]).then((result) => Promise.resolve(result[0]));
    }

    public findByIds(idList: any[]) {
        return this.repository.findByIds(idList);
    }

    public count(filters = {}) {
        return this.createCursor(filters, true);
    }

    public insert(entity: any) {
        return this.repository.save(entity);
    }

    public create(entity: any) {
        return this.insert(entity);
    }

    public insertMany(entities: any[]) {
        return Promise.all(entities.map((e) => this.repository.create(e)));
    }

    public beforeSaveTransformID(entity: T, idField: string) {
        return entity;
    }

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

    public updateMany(where: FindConditions<T>, update: DeepPartial<T>) {
        const criteria: FindConditions<T> = {where} as any;
        return this.repository.update(criteria, update);
    }

    public updateById(id: number, update: { $set: DeepPartial<T> }) {
        return this.repository.update(id, update.$set);
    }

    public removeMany(where: FindConditions<T>) {
        return this.repository.delete(where);
    }

    public removeById(id: number) {
        const result = this.repository.delete(id);
        return result.then((res) => {
            return {id};
        });
    }

    public clear() {
        return this.repository.clear();
    }

    public entityToObject(entity: T) {
        return entity;
    }

    public createCursor(params: any, isCounting: boolean = false) {
        if (params) {
            const query: FindManyOptions<T> = {
                where: params.query || {}
            };
            this._enrichWithOptionalParameters(params, query);

            return this._runQuery(isCounting, query);
        }

        return this._runQuery(isCounting);
    }

    private _runQuery(isCounting: boolean, query?: FindManyOptions<T>) {
        if (isCounting) {
            return this.repository.count(query);
        }
        else {
            return this.repository.find(query);
        }
    }

    private _enrichWithOptionalParameters(params: any, query: FindManyOptions<T>) {
        if (params.search) {
            throw new Error('Not supported because of missing or clause meanwhile in typeorm');
        }

        if (params.sort) {
            const sort = this.transformSort(params.sort);
            if (sort) {
                query.order = sort as any;
            }
        }

        if (Number.isInteger(params.offset) && params.offset > 0) {
            query.skip = params.offset;
        }

        if (Number.isInteger(params.limit) && params.limit > 0) {
            query.take = params.limit;
        }
    }

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
