import * as puppeteer from 'puppeteer';
import * as fs from 'fs';

import { PantoneI } from './pantone.type';
import { getConfig } from '../config';
import { ConfigT } from './config';
import { loadJson, saveJson } from '../helpers';

export class Grabber {
    private brouser: any;
    private page: any;
    private baseUrl = "https://www.e-paint.co.uk/lab-hlc-rgb-lrv-values.asp?cRange=Pantone+U&cRef="

    async start() {
        try {
            this.brouser = await puppeteer.launch({headless: true}) as puppeteer.Browser;
            this.page = await this.brouser.newPage() as puppeteer.Page;
            await this.page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1});    
        } catch (err) {
            console.error(err);
        }
    }

    async stop() {
        try {
            await this.brouser.close();
        } catch (err) {
            console.error(err);
        }
    }

    async gotoPage(url: string) {
        try {
            await this.page.goto(url, {waitUntil: 'networkidle2'});
            this.sleepFor(this.page as puppeteer.Page, 1000, 2000);    
        } catch (err) {
            console.error(err);
        }
    }

    async getPageText(): Promise<string> {
        return await this.page.content() as string;
    }

    async getColor(color: string, pallete: string = 'C'): Promise<PantoneI> {
        let url = this.baseUrl;
        url = url.replace(/cRange=Pantone\+U/, `cRange=Pantone+${pallete}`)

        let colorName: string = `${color} ${pallete}`;
        url = url + color + '+' + pallete;
        url = url.replace(/ /, '+');
        console.log(url);
        await this.gotoPage(url);
        
        let text: string = await this.getPageText();
        let result_rgb = await this.parseRgb(text);
        let result_lab = await this.parseLab(text);
        let result_hex = await this.parseHex(text);
        let result_cmyk = await this.parseCmyk(text);
        let result_hlc = await this.parseHlc(text);

        return {
            colorName,
            [pallete.toLowerCase()]: {
                pallete,
                lab: result_lab,
                rgb: result_rgb,
                hex: result_hex,
                cmyk: result_cmyk,
                hlc: result_hlc,
            }
        }
    }
    
    private randomIntFromInterval(min: number, max: number) {
        return Math.floor(Math.random() * (max - min) + min);
    }
    
    private async sleepFor(page: puppeteer.Page, min: number, max: number) {
        let sleepDuration = this.randomIntFromInterval(min, max);
        await page.waitForTimeout(sleepDuration);
    }

    private async parseRgb(html: string | undefined): Promise<number[]> {
        if (html) {
            try {
                let begins = '<span>sRGB:</span>';
                let ends = '</p>';
                let start = html.indexOf('<span>sRGB:</span>');
                html = html.slice(start + begins.length + 1, start + 100);
                let end = html.indexOf(ends);
                html = html.slice(0, end);
                html = html.replace(/<span>sRGB:<\/span> /, '').replace(/;/g, '');
                
                const values: any[] = html.split(' ') as any[];
                const result: number[] = values.map(el => (Number(el)));
                return result;
            } catch (err) {
                console.error(err);
            }
        }
        return [];
    }

    private async parseLab(text: string): Promise<number[]> {
        let html: string[] = [];
        let begins = '<div class="lab">';
        let ends = '</p></div>\n</div>';
        
        let start = text.indexOf(begins);
        let textLab: any = text.slice(start + begins.length + 1, start + 300);
        let end  = textLab.indexOf(ends);

        textLab = textLab.slice(0, end);
        html=textLab.split('\n') as string[];

        for (let i = 0; i < html.length; i++) {
            let element = html[i];
            element = element.slice(element.indexOf('\">') + 2);
            let pos = element.indexOf('<');
            element = pos <= 0 ?
            element : element.slice(0, (-1) * (element.length - pos));
            html[i] = element;
        }
        html =  html as any[];

        const result: number[] = html.map(el => (Number(el)));

        if(result.length === 3) {
            return result;
        }
        return [];
    }

    async getPantoneList(save: boolean=false, path: string = 'assets/data/pantone_list.json'): Promise<string[]> {
        const url='https://www.e-paint.co.uk/lab-hlc-rgb-lrv-values.asp?cRange=Pantone+U&cRef=Yellow+U'
        await this.gotoPage(url);
        const body: string = await this.getPageText();
        let begins = '<option>Choose colour reference</option>';
        let ends = '</option>\n\n</select>';
        let start = body.indexOf(begins);
        let text = body.slice(start);
        let end = text.indexOf(ends);
        end = end>0 ? end + 9 : end
        text = text.slice(0, end);
        text = text.replace(/\n\n/g, '\n');
        let array: string[] = text.split('\n');
        array = array.map(el => {
            let beg = 'value="'
            let s = el.indexOf(beg);
            let value = el.slice(s + beg.length);
            value = value.slice(0, value.indexOf('">') - 2);
            return value;
        });
        array = array.slice(1);
        if (save) {
            fs.writeFileSync(path, JSON.stringify(array));
        }
        return array;
    }

    async parseCmyk(body: string): Promise<number[]> {
        let begins = '<span>CMYK:';
        let text = body.slice(body.indexOf(begins));
        begins = '</script>'
        text = text.slice(text.indexOf(begins) + begins.length);
        const ends = '</p>';
        text = text.slice(0, text.indexOf(ends));
        text = text.replace(/ /g, '');
        return text.split(';').map(el => (Number(el)));
    }

    parseHex(body: string): string {
        let begins = '"=""><span>Hex:</span> #';
        let text = body.slice(body.indexOf(begins) + begins.length);
        const ends = '</p>';
        text = text.slice(0, text.indexOf(ends));
        return text;
    }

    parseHlc(body: string): number[] {
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

    async hasUpdate(): Promise<{hasUpdate: boolean, result: string[]}> {
        const config: ConfigT = getConfig('env_');
        const grabber = new Grabber();
        const result: string[] = [];
        await grabber.start();
        const pantoneList = await grabber.getPantoneList();
        let list: PantoneI[] = JSON.parse(fs.readFileSync(config.files.pantones, { encoding: 'utf-8'}));
        pantoneList.forEach(color => {
            let findColor = list.filter(el => (el.colorName === color));
            if (findColor.length === 0) {
                result.push(color);
            }
        });
        return {
            hasUpdate: result.length !== 0,
            result
        };
    }

    private async _update(list: string[]): Promise<boolean> {
        let updatedColors: PantoneI[] = [];
        for (let i = 0; i < list.length; i++) {
            const color = list[i];
            const newColor = await this.getColor(color);
            updatedColors.push(newColor);
        }
        const config = getConfig('_env');
        const pantones = loadJson<PantoneI[]>(config.files.pantones);
        const newPantones = [
            ...pantones,
            ...updatedColors
        ];
        saveJson(newPantones, config.files.pantones);
        return true;
    }

    async update(): Promise<void> {
        const result = await this.hasUpdate();
        if (result.hasUpdate) {
            await this._update(result.result)
        }
        return;
    } 
}