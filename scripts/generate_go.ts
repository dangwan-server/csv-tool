import HanldeAbstract from "../lib/handle";
import { convertType, filetrFileType, isDir, objValues, readCsv, upperCaseFirstW } from "../lib/func";
import Variables from "../lib/variables";
import Coder from "../lib/coder";
import fs from "fs";
import path from "path";

function filterEmptyName(v: { name: string }) {
    return v.name != "";
}

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
                    const names = objValues(list[0]);
                    const types = objValues(list[1]);
                    const catName = path.parse(filePath).name;

                    const prototypeStr = names
                        .map((v, i) => {
                            return {
                                name: v,
                                type: types[i],
                                val: "",
                            };
                        })
                        .filter(filterEmptyName)
                        .filter((v) => ignores.indexOf(v.name) == -1)
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
