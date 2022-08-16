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
import { Pantone, PantoneI, PantoneSI } from './types/pantone.type';
import * as fs from 'fs';
import { loadJson, saveJson } from './helpers';


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
        // const url = 'https://www.e-paint.co.uk/lab-hlc-rgb-lrv-values.asp?cRange=Pantone+C&cRef=2299+C';
        const url = 'https://www.e-paint.co.uk/lab-hlc-rgb-lrv-values.asp?cRange=Pantone+U&cRef=102+U';
        
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
    // const p: Array<any> = loadJson<any>('assets/data/pantone-list.json');
    const p: string[] = await grabber.getPantoneList();
    let pantone: PantoneI[] = [];
    console.log('Lenght: ', p.length);
    // for (let i = 0; i <  p.length; i++) {
    for (let i = 0; i <  10; i++) {
        const element: string = p[i];
        console.log(element);
        const color = await grabber.getColor(element, "U");
        pantone.push(color);
    }
    grabber.stop();
    fs.writeFileSync('assets/data/pantone_u.json', JSON.stringify(pantone,null, 2));
    console.log('Done');
}

main();

async function getBody(save: boolean = false) {
    const url='https://www.e-paint.co.uk/lab-hlc-rgb-lrv-values.asp?cRange=Pantone+U&cRef=Yellow+U'
    const grabber = new Grabber();
    await grabber.start();
    await grabber.gotoPage(url);
    const body = await grabber.getPageText();
    if (save) {
        fs.writeFileSync('assets/data/body.txt', body);
    }
    await grabber.stop();
    return body;
}

// getBody();

async function getPantoneList() {
    const grabber = new Grabber();
    await grabber.start();
    console.log(await grabber.getPantoneList(true));
}

// getPantoneList();


function comparePantones() {
    const pantone = loadJson<PantoneI>('assets/data/pantone.json');
    console.log(pantone.length);
    pantone.forEach(color => console.log(color.colorName))
}

// comparePantones();

function exportPantone() {
    const pantone = loadJson<PantoneI>('assets/data/pantone.json');
    const pantoneS: PantoneSI[] = [];
    for (let color = 0; color < pantone.length; color++) {
        const c = pantone[color];
        const p = new Pantone(c)
        pantoneS.push(p.color);
        console.log(p.name);
    }
    saveJson(pantoneS, 'assets/data/pantone.json');
    console.log('Done.');
}

// exportPantone();

async function parseCmyk() {
    const body = await getBody();
    let begins = '<span>CMYK:';
    let text = body.slice(body.indexOf(begins));
    begins = '</script>'
    text = text.slice(text.indexOf(begins) + begins.length);
    const ends = '</p>';
    text = text.slice(0, text.indexOf(ends));
    text = text.replace(/ /g, '');

    console.log(text.split(';').map(el => (Number(el))));
}

// parseCmyk();

async function parseHex() {
    const body = await getBody();
    let begins = '"=""><span>Hex:</span> #';
    let text = body.slice(body.indexOf(begins) + begins.length);
    const ends = '</p>';
    text = text.slice(0, text.indexOf(ends));
    console.log(text);
}

// parseHex();

async function parseHcl() {
    const body = await getBody();
    const result: number[] = []
    // H
    let begins = '<span>H</span>';
    let text = body.slice(body.indexOf(begins) + begins.length);
    begins = '">';
    text = text.slice(body.indexOf(begins));
    let ends = '</p>';
    text = text.slice(0, text.indexOf(ends));
    text = text.replace(/&nbsp;/g, '').replace(/\n/g, '');
    result.push(parseFloat(text));


    //L
    begins = '</p>\n\n</div>\n<div>\n<span>L</span>';
    text = body.slice(body.indexOf(begins) + begins.length);
    begins = '">';
    text = text.slice(body.indexOf(begins));
    ends = '</p>';
    text = text.slice(0, text.indexOf(ends));
    text = text.replace(/&nbsp;/g, '').replace(/\n/g, '');
    result.push(parseFloat(text));

    //C
    begins = '</p>\n\n</div>\n<div>\n<span>L</span>';
    text = body.slice(body.indexOf(begins) + begins.length);
    begins = '<span>C</span>';
    text = body.slice(body.indexOf(begins) + begins.length);
    ends = '</p>';
    begins = '">';
    text = text.slice(body.indexOf(begins));
    text = text.slice(0, text.indexOf(ends));
    text = text.replace(/&nbsp;/g, '').replace(/\n/g, '');
    result.push(parseFloat(text));

    return result;
}

// parseHcl();