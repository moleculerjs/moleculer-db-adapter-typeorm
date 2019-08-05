import loggerWrapper from './bin/logger';
const logger = loggerWrapper(module);
import chalk from 'chalk';

import * as Promise from 'bluebird';

export class ModuleChecker {
    private tests: any[];
    private okCount: any;
    private ok: number;
    private fail: number;

    constructor(okCount: number) {
        this.tests = [];
        this.okCount = okCount;
        this.ok = 0;
        this.fail = 0;
    }

    public add(title: string, fn: any, cb: any) {
        this.tests.push(() => Promise.resolve(this.printTitle(title)).then(() => fn()).then((rsp: any) => {
            const res = cb(rsp);
            if (Array.isArray(res)) {
                res.map((r) => this.checkValid(r));
            }
            else if (res != null) {
                this.checkValid(res);
            }
        }));
    }

    public execute() {
        return Promise.each(this.tests, (fn: any) => fn());
    }

    public printTitle(text: string) {

        logger.info(chalk.yellow.bold(`\n--- ${text} ---`));
    }

    public checkValid(cond: any) {
        let res = cond;
        if (typeof cond === 'function') {
            res = cond();
        }

        if (res) {
            this.ok++;
            logger.info(chalk.bgGreen.yellow.bold('--- OK ---'));
        } else {
            this.fail++;
            logger.error(chalk.bgRed.yellow.bold('!!! FAIL !!!'));
        }
    }

    public printTotal() {
        const optionalParams = this.fail > 0 ? ' | ' + chalk.bgRed.yellow.bold(`!!! FAIL: ${this.fail} !!!`) : '';
        logger.info(chalk.bgGreen.yellow.bold(`--- OK: ${this.ok} of ${this.okCount} ---`),
            optionalParams + '\n');

    }
}
