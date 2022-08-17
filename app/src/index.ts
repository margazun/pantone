import { Grabber } from './types/grabber';
import { PantoneI, } from './types/pantone.type';
import * as fs from 'fs';


const main = async () => {
    const grabber = new Grabber();
    await grabber.start();
    await grabber.update();
    grabber.stop();
}

main();

// (async () => {
//     const grabber = new Grabber();
//     await grabber.start();
//     const newColors = await grabber.hasUpdate();
//     await grabber.stop();
//     console.log(newColors);
// })()