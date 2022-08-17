import { Grabber } from './types/grabber';
import { PantoneI, } from './types/pantone.type';
import * as fs from 'fs';
import { getConfig } from './config';
import { ConfigT } from './types';


const main = async () => {
    const grabber = new Grabber();
    await grabber.start();
    const p: string[] = await grabber.getPantoneList();
    let pantone: PantoneI[] = [];
    let _color: PantoneI
    for (let i = 0; i <  p.length; i++) {
        const element: string = p[i];
        _color = { colorName: element };
        const { u } = await grabber.getColor(element, "U");
        _color = { ..._color, u };
        const { c } = await grabber.getColor(element, "C");
        _color = { ..._color, c }
        pantone.push(_color);
    }
    await grabber.stop();
    fs.writeFileSync('assets/data/pantones.json', JSON.stringify(pantone,null, 2));
    console.log('Done');
}

// main();


// async function hasUpdate(): Promise<{hasUpdate: boolean, result: string[]}> {
//     const config: ConfigT = getConfig('env_');
//     const grabber = new Grabber();
//     const result: string[] = [];
//     await grabber.start();
//     const pantoneList = await grabber.getPantoneList();
//     let list: PantoneI[] = JSON.parse(fs.readFileSync(config.files.pantones, { encoding: 'utf-8'}));
//     pantoneList.forEach(color => {
//         let findColor = list.filter(el => (el.colorName === color));
//         if (findColor.length === 0) {
//             result.push(color);
//         }
//     });
//     return {
//         hasUpdate: result.length !== 0,
//         result
//     };
// }

(async () => {
    const grabber = new Grabber();
    await grabber.start();
    const newColors = await grabber.hasUpdate();
    await grabber.stop();
    console.log(newColors);
})()