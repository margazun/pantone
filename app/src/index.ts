import { Grabber } from './types/grabber';
import { PantoneI, } from './types/pantone.type';
import * as fs from 'fs';


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

main();
