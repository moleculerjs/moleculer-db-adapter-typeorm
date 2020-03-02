import 'reflect-metadata';
import { ModuleChecker } from './checker';

import * as  moleculer from 'moleculer';
import posts from './posts.service';
import { start } from './utils';
import { testCasesFiller } from './checkerTestCases';

const { ServiceBroker } = moleculer;
const broker = new ServiceBroker({
    logLevel: 'debug',
});

broker.createService(posts);

const checker = new ModuleChecker(11);

testCasesFiller(broker, checker);
start(broker, checker);
