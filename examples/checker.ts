/* tslint:disable no-console*/
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

        console.log();
        console.log(chalk.yellow.bold(`--- ${text} ---`));
    }

    public checkValid(cond: any) {
        let res = cond;
        if (typeof cond === 'function') {
            res = cond();
        }

        if (res) {
            this.ok++;
            console.log(chalk.bgGreen.yellow.bold('--- OK ---'));
        } else {
            this.fail++;
            console.log(chalk.bgRed.yellow.bold('!!! FAIL !!!'));
        }
    }

    public printTotal() {
        console.log();
        console.log(chalk.bgGreen.yellow.bold(`--- OK: ${this.ok} of ${this.okCount} ---`),
            this.fail > 0 ? ' | ' + chalk.bgRed.yellow.bold(`!!! FAIL: ${this.fail} !!!`) : '');
        console.log();
    }
}
