import { filetrFileType, filterIgnoreName, filterInValidName, getHeaderConfig, getIgnores, isDir, objValues, readXlsxToJson } from "../lib/func";
import Variables from "../lib/variables";
import Coder from "../lib/coder";
import fs from "fs";
import path from "path";
import { Application } from "../types/index.d";
import { checkType } from "../lib/check";

type typeListData = {
    name: string;
    type: string;
    value: string | number;
};

export default class GernerateLuaService {
    private app: Application;
    private variables: Variables;

    constructor(app: Application, variables: Variables) {
        this.app = app;
        this.variables = variables;
    }

    private getList(list: any[]): typeListData[][] {
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

    generateFromDir(dir: string, outFile: string, ignores: string) {
        const files = fs.readdirSync(dir).filter((v) => filetrFileType(v, "csv"));
        const total = files.length;
        let redisCommandList: string[] = [];
        let counter = 0;

        files
            .map((v) => {
                return path.join(dir, v);
            })
            .map((filePath: string) => {
                const catName = path.parse(filePath).name;

                this.readAsRedisCommand(filePath, getIgnores(ignores, catName)).then((list) => {
                    counter++;
                    redisCommandList = redisCommandList.concat(list);

                    if (counter < total) {
                        return;
                    }

                    this.write(redisCommandList, outFile);

                    console.log(`生成成功，共处理了${total}个文件`);
                });
            });
    }

    write(redisCommandList: string[], outFile: string) {
        if (redisCommandList.length == 0) {
            console.log("没有找到可以生成lua脚本的csv文件");
            return;
        }

        this.variables.set("list", redisCommandList.join("\n"));

        const targetFile = isDir(outFile) ? path.join(outFile, "redis.lua") : outFile;
        const coderHandle = new Coder();
        const resultContent = coderHandle.generate("lua", this.variables);

        fs.writeFileSync(targetFile, resultContent);
    }

    private readAsRedisCommand(filePath: string, ignores: string[]) {
        const redisCommandList: string[] = [];
        const catName = path.parse(filePath).name;

        if (ignores.length) {
            console.log(`${catName}被忽略的字段`, ignores);
        }

        return readXlsxToJson(filePath).then((list) => {
            const header = getHeaderConfig(list);
            const firstField = header.shift();

            if (!firstField) {
                console.log("检测到csv头部第一列空");
                return [];
            }

            header.map((v, i) => {
                checkType(this.app.typeManager.getType(v), `${catName}第${i}列类型错误:${v.type}`);
            });

            const allLines = this.getList(list)
                .map((v) => {
                    return v
                        .filter(filterInValidName)
                        .filter((v) => filterIgnoreName(v, ignores))
                        .reduce((accumulator, v) => {
                            return Object.assign(accumulator, { [v.name]: this.app.typeManager.getType(v).toValue("json", v.value + "") });
                        }, {});
                })
                .filter((v: any) => {
                    const delVal = v.del;
                    if (typeof v.del != "undefined") {
                        delete v.del;
                    }
                    return delVal != 1;
                });

            allLines.map((v: any) => {
                redisCommandList.push(`redis.call('set', key .. ':${catName}:${v[firstField?.name]}', '${JSON.stringify(v)}')`);
            });

            redisCommandList.push(`redis.call('set', key .. ':${catName}', '${JSON.stringify(allLines)}')`);

            return redisCommandList;
        });
    }

    generate(filePath: string, outFile: string, ignores: string[]) {
        this.readAsRedisCommand(filePath, ignores).then((redisCommandList) => {
            this.write(redisCommandList, outFile);

            console.log(`生成成功，共处理了1个文件`);
        });
    }
}
