import { readFileSync, writeFileSync } from "fs";

export function loadJson<T>(path: string): Array<T> {
    try {
        const text = readFileSync(path, {encoding:'utf8', flag:'r'});
        return (JSON.parse(text)) as Array<T>;
    } catch (err) {
        console.error(err);
        return [] as Array<T>;
    }
}

export function saveJson(object: Object, path: string) {
    try {
        writeFileSync(path, JSON.stringify(object, null, 2), {encoding: 'utf-8'});
    } catch (err) {
        console.error(err);
    }
}