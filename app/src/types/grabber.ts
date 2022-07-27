import * as puppeteer from 'puppeteer';

export class Grabber {
    private brouser: any;
    private page: any;
    private baseUrl = "https://www.e-paint.co.uk/lab-hlc-rgb-lrv-values.asp?cRange=Pantone+C&cRef="

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

    async getColor(color: string): Promise<{ Lab: Array<number>}> {
        await this.gotoPage(this.baseUrl + color.split(' ').join('+'));
        return this.parseLab(await this.page.evaluate(() => document.querySelector(".lab")?.innerHTML))
    }
    private randomIntFromInterval(min: number, max: number) {
        return Math.floor(Math.random() * (max - min) + min);
    }
    
    private async sleepFor(page: puppeteer.Page, min: number, max: number) {
        let sleepDuration = this.randomIntFromInterval(min, max);
        await page.waitForTimeout(sleepDuration);
    }

    private parseLab(html: string | undefined): { Lab: Array<number>} {
        if (html) {
            let text = html.split('\n');
            text = text.filter(el => el != '');
            text = text.map(el => {
                const buffer = el.substring(0, el.length - 10).split('>');
                el = buffer[buffer.length -1];
                // console.log(el);
                return el;
            });
            console.log(text)
            return { Lab: text.map(el => +el) as Array<number> };
        } else {
            return { Lab: [] as Array<number> }
        }
    }
}