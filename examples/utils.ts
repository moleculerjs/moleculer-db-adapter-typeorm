/* tslint:disable:no-console */
import { ServiceBroker } from 'moleculer';
import { ModuleChecker } from './checker';

const ONE_SECOND = 1000;
export function sleep(defaultSleep = 0.5) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, defaultSleep * ONE_SECOND);
    });
}

export async function batchRunner(items: any[], action: any, batchSize: number) {
    let result: any[] = [];
    const itemsCount = items.length;
    for (let from = 0, to = batchSize; from < itemsCount; from += batchSize, to += batchSize) {
        to = to < itemsCount ? to : itemsCount;
        const batch = items.slice(from, to);
        const batchResult = await Promise.all(batch.map((item) => action(item)));
        result = result.concat(batchResult);
        await sleep();
    }
    return result;
}

export async function start(broker: ServiceBroker, checker: ModuleChecker) {
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
