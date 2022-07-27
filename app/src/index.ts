// import { getConfig } from "./config/config";

// console.log('Hi! It\'s me!\nAre you here?\nDo you hear?');
// const config = getConfig('env_');
// console.log(config.bot);

// import { URL } from "url";
// import { mkdirSync, existsSync } from "fs";
import puppeteer from 'puppeteer';
import { Grabber } from './types/grabber';
import * as PANTONE from '../../assets/data/pantone-list.json';
import { PantoneInitialI } from './types/pantone-initial.type';
import { PantoneI } from './types/pantone.type';
import * as fs from 'fs';
import { loadJson } from './helpers';


// const PANTONE = 'https://www.e-paint.co.uk/lab-hlc-rgb-lrv-values.asp?cRange=Pantone+C&cRef='

const randomIntFromInterval = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min) + min);
}

const sleepFor = async (page: puppeteer.Page, min: number, max: number) => {
    let sleepDuration = randomIntFromInterval(min, max);
    console.log(`waiting for ${sleepDuration /1000} seconds...`);
    await page.waitForTimeout(sleepDuration);
}

const main_actual = async () => {
    try {
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1});
        const url = 'https://www.e-paint.co.uk/lab-hlc-rgb-lrv-values.asp?cRange=Pantone+C&cRef=2299+C';
        
        await page.goto(url, {waitUntil: 'networkidle2'});
        // await page.$$eval("document", el => console.log(`element: ${el}`));
        const text = await page.evaluate(() => document.querySelector(".lab")?.innerHTML);
        console.log(parseLab(text));
        await sleepFor(page, 1000, 2000);

    } catch (err) {
        console.log(err)
    }
}

const parseLab = (html: string | undefined) => {
    if (html) {
        let text = html.split('\n');
        text = text.filter(el => el != '');
        text = text.map(el => {
            const buffer = el.substring(0, el.length - 10).split('>');
            el = buffer[buffer.length -1];
            console.log(el);
            return el;
        });
        return { Lab: text.map(el => +el) }
    }
}

const main = async () => {
    const grabber = new Grabber();
    await grabber.start();
    const p: Array<any> = PANTONE;
    let pantone: PantoneI[] = [];
    for (let i = 0; i < Object.keys(p).length - 1; i++) {
        const element: PantoneInitialI = p[i];
        const color = await grabber.getColor(element.colorName);
        pantone.push({
            ...element,
            lab: color.Lab
        });
    }
    fs.writeFileSync('assets/data/pantone.json', JSON.stringify(pantone,null, 2));
    grabber.stop();
}

// main();


function comparePantones() {
    const pantone = loadJson<PantoneI>('assets/data/pantone.json');
    console.log(pantone.length);
    pantone.forEach(color => console.log(color.colorName))
}

comparePantones();