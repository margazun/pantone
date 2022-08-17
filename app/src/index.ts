import { Grabber } from './types/grabber';
import { PantoneI, } from './types/pantone.type';
import * as fs from 'fs';
import { getConfig } from './config';


const main = async () => {
    const grabber = new Grabber();
    await grabber.start();
    await grabber.update();
    grabber.stop();
}

// main();

(async () => {
    const config = getConfig('env_');
    console.log(JSON.stringify(config, null, 2));
})()