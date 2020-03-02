import {
    createConnection,
    ConnectionOptions,
    Connection,
    EntitySchema,
    Repository,
    FindOneOptions,
    DeepPartial, FindConditions, SelectQueryBuilder
} from 'typeorm';
import * as Moleculer from 'moleculer';
/* tslint:disable-next-line */
import { Service, ServiceBroker } from 'moleculer';

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

    public beforeSaveTransformID(entity: T, _idField: string) {
        return entity;
    }

    public afterRetrieveTransformID(entity: T, _idField: string) {
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
            entities: [this.entity],
            synchronize: true,
            ...this.opts
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
        const criteria: FindConditions<T> = { where } as any;
        return this.repository.update(criteria, <any> update);
    }

    public updateById(id: number, update: { $set: DeepPartial<T> }) {
        return this.repository.update(id, <any> update.$set);
    }

    public removeMany(where: FindConditions<T>) {
        return this.repository.delete(where);
    }

    public removeById(id: number) {
        const result = this.repository.delete(id);
        return result.then(() => {
            return { id };
        });
    }

    public clear() {
        return this.repository.clear();
    }

    public entityToObject(entity: T) {
        return entity;
    }

    public createCursor(_params: any, isCounting: boolean = false) {
        const queryBuilder = this.repository.createQueryBuilder('entity');

        const params = this._enrichWithCustomParameters(_params, queryBuilder);

        if (params) {
            this._enrichWithOptionalParameters(params, queryBuilder);

            if (params.query) {
                queryBuilder.where(params.query);
            }
        }

        return this._runQuery(isCounting, queryBuilder);
    }

    private async _runQuery(isCounting: boolean, queryBuilder: SelectQueryBuilder<T>) {
        if (isCounting) {
            queryBuilder.select('COUNT(*)', 'total').orderBy().offset(0).limit(1);
            const { total } = await queryBuilder.getRawOne();
            return parseInt(total, 10) || 0;
        }
        else {
            return queryBuilder.getMany();
        }
    }

    private _enrichWithOptionalParameters(params: any, queryBuilder: SelectQueryBuilder<T>) {
        if (params.search) {
            throw new Error('Not supported because of missing or clause meanwhile in typeorm');
        }

        if (params.sort) {
            const sort = this._transformSort(params.sort);
            if (sort) {
                Object.entries(sort).map(([field, order]) => {
                    queryBuilder.orderBy(`entity.${field}`, order);
                });
            }
        }

        if (Number.isInteger(params.offset) && params.offset > 0) {
            queryBuilder.offset(params.offset);
        }

        if (Number.isInteger(params.limit) && params.limit > 0) {
            queryBuilder.limit(params.limit);

        }
    }

    private _enrichWithCustomParameters(params: any, queryBuilder: SelectQueryBuilder<T>) {
        if (this.service.schema.cursorOptions != null) {
            return this.service.schema.cursorOptions.call(this.service, params, queryBuilder) || params;
        }
        return params;
    }

    private _transformSort(paramSort: string | string[]): { [columnName: string]: ('ASC' | 'DESC') } {
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
