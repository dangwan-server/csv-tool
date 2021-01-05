import { convertTypeValue, filetrFileType, filterIgnoreName, filterInValidName, getHeaderConfig, getIgnores, isDir, objValues, readCsv } from "../lib/func";
import Variables from "../lib/variables";
import Coder from "../lib/coder";
import fs from "fs";
import path from "path";
import { Application } from "../types/index.d";

export default class GernerateLuaService {
    private app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    private getList(list: any[]) {
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
        const files = fs.readdirSync(dir);
        const total = files.length;
        let redisCommandList: string[] = [];
        let counter = 0;

        files
            .filter((v) => filetrFileType(v, "csv"))
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

        const variables = new Variables();

        variables.set("list", redisCommandList.join("\n"));

        const targetFile = isDir(outFile) ? path.join(outFile, "redis.lua") : outFile;
        const coderHandle = new Coder();
        const resultContent = coderHandle.generate("lua", variables);

        fs.writeFileSync(targetFile, resultContent);
    }

    private readAsRedisCommand(filePath: string, ignores: string[]) {
        const redisCommandList: string[] = [];
        const catName = path.parse(filePath).name;

        if (ignores.length) {
            console.log(`${catName}被忽略的字段`, ignores);
        }

        return readCsv(filePath).then((list) => {
            this.getList(list)
                .map((v: any[]) => {
                    return v
                        .filter(filterInValidName)
                        .filter((v) => filterIgnoreName(v, ignores))
                        .reduce((accumulator, v) => Object.assign(accumulator, { [v.name]: convertTypeValue(v) }), {});
                })
                .map((v) => {
                    redisCommandList.push(`redis.call('set', key .. '${catName}_${v.id}', '${JSON.stringify(v)}')`);
                });

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
