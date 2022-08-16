import { LabI, RgbI } from "./color.type";

export interface PantoneI {
    colorName: string;
    pallete: string;
    rgb: Array<number>;
    lab: Array<number>,
    hex: string,
    cmyk: Array<number>,
    hlc: Array<number>,
}

export interface PantoneSI {
    rgb_r: number,
    rgb_g: number,
    rgb_b: number,
    name: string,
    pallete: string,
    lab_l: number
    lab_a: number
    lab_b: number
}

export class Pantone {
    private _color: PantoneSI;

    constructor(color: PantoneI) {
        this._color = {
            rgb_r: color.rgb[0],
            rgb_b: color.rgb[1],
            rgb_g: color.rgb[2],
            lab_l: color.lab[0],
            lab_a: color.lab[1],
            lab_b: color.lab[2],
            name: color.colorName.slice(0, -2),
            pallete: color.colorName[color.colorName.length - 1]
        }
    }

    get color(): PantoneSI {
        return this._color;
    }

    get rgb(): RgbI {
        return {
            r: this._color.rgb_r,
            g: this._color.rgb_g,
            b: this._color.rgb_b
        }
    }

    get lab(): LabI {
        return {
            l: this._color.lab_l,
            a: this._color.lab_a,
            b: this._color.lab_b
        }
    }

    get name(): string {
        return `${this._color.name} ${this._color.pallete}`;
    }
}