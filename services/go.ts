import { filetrFileType, convertType, filterEmptyName, filterIgnoreName, getHeaderConfig, readCsv, upperCaseFirstW, getIgnores } from "../lib/func";
import Variables from "../lib/variables";
import Coder from "../lib/coder";
import fs from "fs";
import path from "path";
import { Application } from "../types";

export default class GernerateGoService {
    private app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    generateFromDir(dir: string, outFile: string, ignores: string) {
        fs.readdirSync(dir)
            .filter((v) => filetrFileType(v, "csv"))
            .map((v) => {
                return v;
            })
            .map((v) => {
                return path.join(dir, v);
            })
            .map((filePath: string) => {
                const catName = path.parse(filePath).name;
                this.generate(filePath, path.join(outFile, catName + ".go"), getIgnores(ignores, catName));
            });
    }

    generate(inFile: string, outFile: string, ignores: string[]) {
        const variables = new Variables();

        if (ignores.length) console.log("忽略的字段", ignores);

        readCsv(inFile).then((list) => {
            const catName = path.parse(inFile).name;

            const prototypeStr = getHeaderConfig(list)
                .filter(filterEmptyName)
                .filter((v) => filterIgnoreName(v, ignores))
                .map((v) => {
                    return "    " + upperCaseFirstW(v.name) + "  " + convertType(v.type);
                })
                .join("\n");

            variables.set("name", catName);
            variables.set("prototype", prototypeStr);

            const coderHandle = new Coder();

            const goStructContent = coderHandle.generate(this.app.path.goTemplatePath(), variables);

            fs.writeFileSync(outFile, goStructContent);

            console.log(catName + " OK");
        });
    }
}
