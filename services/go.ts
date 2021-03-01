import { filetrFileType, filterIgnoreName, getHeaderConfig, upperCaseFirstW, getIgnores, filterInValidName, readXlsxToJson } from "../lib/func";
import Variables from "../lib/variables";
import Coder from "../lib/coder";
import fs from "fs";
import path from "path";
import { Application } from "../types";
import { checkType } from "../lib/check";

export default class GernerateGoService {
    private app: Application;
    private variables: Variables;

    constructor(app: Application, varialbes: Variables) {
        this.app = app;
        this.variables = varialbes;
    }

    generateFromDir(dir: string, outFile: string, ignores: string) {
        const catNames: string[] = [];

        fs.readdirSync(dir)
            .filter((v) => filetrFileType(v, "csv"))
            .map((v) => {
                return path.join(dir, v);
            })
            .map((filePath: string) => {
                const catName = path.parse(filePath).name;

                catNames.push(catName);

                this.generate(filePath, path.join(outFile, catName + ".go"), getIgnores(ignores, catName));
            });

        this.generateGetterFunction(catNames, outFile);
    }

    generateGetterFunction(catNames: string[], dir: string) {
        const coderHandle = new Coder();
        const variables = this.variables;

        const funcs = catNames.map((catName) => {
            this.variables.set("name", upperCaseFirstW(catName));
            this.variables.set("cat_name", catName);

            return coderHandle.generate("gofunbody", variables);
        });

        variables.set("funcs", funcs.join("\n"));

        const content = coderHandle.generate("gogetter", variables);

        fs.writeFileSync(path.join(dir, "getter.go"), content);
    }

    generate(inFile: string, outFile: string, ignores: string[]) {
        if (ignores.length) console.log("忽略的字段", ignores);

        readXlsxToJson(inFile).then((list) => {
            const catName = path.parse(inFile).name;
            const header = getHeaderConfig(list);
            header.map((v, i) => {
                checkType(this.app.typeManager.getType(v), `${catName}第${i}列类型错误:${v.type}`);
            });
            const fieldNames: string[] = [];

            const validFieldsList = header
                .filter(filterInValidName)
                .filter((v) => filterIgnoreName(v, ignores) && v.name != "del")
                .filter((v) => {
                    // 字段去重
                    const isNotExist = fieldNames.indexOf(v.name) == -1;

                    fieldNames.push(v.name);

                    return isNotExist;
                });

            const prototypeStr = validFieldsList
                .map((v) => {
                    return "    " + upperCaseFirstW(v.name) + "  " + this.app.typeManager.getType(v).toValue("gostruct", v.value) + ` \`json:"${v.name}"\``;
                })
                .join("\n");

            this.variables.set("name", upperCaseFirstW(catName));
            this.variables.set("prototype", prototypeStr);

            const coderHandle = new Coder();

            const goStructContent = coderHandle.generate("go", this.variables);

            fs.writeFileSync(outFile, goStructContent);

            console.log(catName + " OK");
        });
    }
}
