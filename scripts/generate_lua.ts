import HanldeAbstract from "../lib/handle";
import { convertTypeValue, filetrFileType, filterEmptyName, filterIgnoreName, getHeaderConfig, isDir, objValues, readCsv } from "../lib/func";
import Variables from "../lib/variables";
import Coder from "../lib/coder";
import fs from "fs";
import path from "path";

function getList(list: any[]) {
    const header = getHeaderConfig(list);

    return list
        .filter((_, k) => k > 1)
        .map((line) => {
            return objValues(line).map((value, i) => {
                return {
                    name: header[i].name,
                    type: header[i].type,
                    value: value,
                };
            });
        });
}

export default class GeneralLuaHandle extends HanldeAbstract {
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
                const catName = path.parse(filePath).name;

                readCsv(filePath).then((list) => {
                    const redisCommandList: string[] = [];

                    getList(list)
                        .map((v: any[]) => {
                            return v
                                .filter(filterEmptyName)
                                .filter((v) => filterIgnoreName(v, ignores))
                                .reduce((accumulator, v) => Object.assign(accumulator, { [v.name]: convertTypeValue(v) }), {});
                        })
                        .map((v) => {
                            redisCommandList.push(`redis.call('set', key .. '${catName}_${v.id}', '${JSON.stringify(v)}')`);
                        });

                    variables.set("list", redisCommandList.join("\n"));

                    const coderHandle = new Coder();
                    const resultContent = coderHandle.generate(this.app.path.luaTemplatePath(), variables);

                    fs.writeFileSync(path.join(outFile, catName + ".lua"), resultContent);
                });
            });

        console.log(`生成成功，共处理了${total}个文件`);
    }
}
