import Coder from "../lib/coder";
import { upperCaseFirstW } from "../lib/funcs";
import Variables from "../lib/variables";
import { App } from "../types/handle";
import CsvService from "./csv";

function convertType(customType: string) {
    switch (customType) {
        case "int":
            return "int32";
        default:
            return "string";
    }
}

function convertTypeValue(v: { type: string; value: string }) {
    switch (v.type) {
        case "int":
            return isNaN(parseInt(v.value)) ? v.value : parseInt(v.value);
        case "float":
            return isNaN(parseFloat(v.value)) ? v.value : parseFloat(v.value);
        default:
            return v.value;
    }
}

function filterIgnore(config: { [key: string]: any[] }, cat: string) {
    return function (v: { name: string }) {
        const find = config[cat].find((con) => con.name == v.name);
        if (!find) {
            return true;
        }
        return find.ignore != 1;
    };
}

export default class GeneratorService {
    private app: App;
    constructor(app: App) {
        this.app = app;
    }

    toStruct(catName: string, config: { name: string; type: string; ignore: number }[]) {
        const variables = new Variables();

        const prototypeStr = config
            .filter((v) => v.ignore != 1)
            .map((v) => {
                return "    " + upperCaseFirstW(v.name) + "  " + convertType(v.type);
            })
            .join("\n");

        variables.set("name", catName);
        variables.set("prototype", prototypeStr);

        const coderHandle = new Coder();

        return {
            data: coderHandle.generate(this.app.path.goTemplatePath(), variables),
        };
    }

    toLua() {
        const csvService = new CsvService(this.app);
        const variables = new Variables();
        const config: { [key: string]: any[] } = csvService.getConfig();
        const list: string[] = [];

        // 先读取所有要加载的文件
        csvService.getAllCsvs().map((cat) => {
            const filterIgnoreCol = filterIgnore(config, cat);
            csvService
                .getItemList(cat)
                .map((v: any[]) => {
                    return v.filter(filterIgnoreCol).reduce((accumulator, v) => Object.assign(accumulator, { [v.name]: convertTypeValue(v) }), {});
                })
                .map((v) => {
                    list.push(`redis.call('set', key .. '${cat}_${v.id}', '${JSON.stringify(v)}')`);
                });
        });

        const coderHandle = new Coder();

        variables.set("list", list.join("\n"));

        //console.log(list);

        return coderHandle.generate(this.app.path.luaTemplatePath(), variables);
    }
}
