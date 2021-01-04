import HanldeAbstract from "../lib/handle";
import { convertType, filetrFileType, filterEmptyName, filterIgnoreName, getHeaderConfig, isDir, readCsv, upperCaseFirstW } from "../lib/func";
import Variables from "../lib/variables";
import Coder from "../lib/coder";
import fs from "fs";
import path from "path";

export default class GeneralGoHandle extends HanldeAbstract {
    handle() {
        const inFile = path.resolve(this.input.get("i") || "");
        const outFile = path.resolve(this.input.get("o") || "");
        const ignores = this.input.get("ignore", "").split(",");

        if (!isDir(outFile)) {
            throw new Error(`目录${outFile}不存在`);
        }

        if (!isDir(inFile)) {
            throw new Error(`目录${inFile}不存在`);
        }

        const variables = new Variables();
        let total = 0;

        fs.readdirSync(inFile)
            .filter((v) => filetrFileType(v, "csv"))
            .map((v) => {
                total++;
                return v;
            })
            .map((v) => {
                return path.join(inFile, v);
            })
            .map((filePath: string) => {
                readCsv(filePath).then((list) => {
                    const catName = path.parse(filePath).name;

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

                    fs.writeFileSync(path.join(outFile, catName + ".go"), goStructContent);
                });
            });

        console.log(`生成成功，共处理了${total}个文件`);
    }
}
