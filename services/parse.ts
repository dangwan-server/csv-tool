import csv from "csvtojson";
import fs from "fs";
import path from "path";
import { App } from "../types/handle";
import CsvService from "./csv";

function values(obj: { [key: string]: any }) {
    return Object.keys(obj).map((k) => {
        return obj[k];
    });
}

function filterName(_: any, k: number) {
    return k == 0;
}

function filterType(_: any, k: number) {
    return k == 1;
}

function filterValues(_: any, k: number) {
    return k > 1;
}

function filterEmptyRow(v: any, _: number) {
    return v.name != "";
}

function paseCsvToJson(list: any[]) {
    const names = values(list.filter(filterName).pop());
    const types = values(list.filter(filterType).pop());
    const result = list.filter(filterValues).map((line) => {
        return values(line)
            .map((value, i) => {
                return {
                    name: names[i],
                    type: types[i],
                    value: value,
                };
            })
            .filter(filterEmptyRow);
    });

    return result;
}

async function readCsv(path: string) {
    return csv()
        .fromFile(path)
        .then((list) => {
            return list;
        });
}

export default class CsvParserService {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    getConfig() {
        const service = new CsvService(this.app);

        return service.getConfig();
    }

    writeConfig(csvName: string, list: any[]) {
        const keyName = path.parse(csvName).name;
        const configPath = this.app.path.configPath();
        const oldConfig = this.getConfig();
        list.filter((_, k) => k == 0).map((v) => {
            oldConfig[keyName] = v;
            fs.writeFileSync(configPath, JSON.stringify(oldConfig, null, 2));
        });
    }

    writeCsvJson(jsonPath: string, list: any[]) {
        fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2));
    }

    async parse(csvName: string) {
        const csvPath = this.app.path.csvPath(csvName);
        const jsonPath = this.app.path.jsonPath(csvName);

        return readCsv(csvPath)
            .then(paseCsvToJson)
            .then((list) => {
                this.writeConfig(csvName, list);
                this.writeCsvJson(jsonPath, list);
                return list;
            });
    }
}
