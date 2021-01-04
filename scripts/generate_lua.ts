import HanldeAbstract from "../lib/handle";
import { convertTypeValue, filetrFileType, filterIgnoreName, filterInValidName, getHeaderConfig, isDir, objValues, readCsv } from "../lib/func";
import Variables from "../lib/variables";
import Coder from "../lib/coder";
import fs from "fs";
import path from "path";

export default class GeneralLuaHandle extends HanldeAbstract {
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

    private checkInFile(inFile: string) {
        if (!isDir(inFile)) {
            throw new Error(`目录${inFile}不存在`);
        }
    }

    private checkOutFile(outFile: string) {
        const targetIsDir = (pathName: string) => {
            return path.parse(pathName).ext == "";
        };

        if (targetIsDir(outFile) && !isDir(outFile)) {
            throw new Error(`目录${outFile}不存在`);
        }

        if (!targetIsDir(outFile)) {
            if (!isDir(path.dirname(outFile))) {
                throw new Error(`${path.dirname(outFile)}目录不存在`);
            }
        }
    }

    handle() {
        const inFile = path.resolve(this.input.get("i") || "");
        const outFile = path.resolve(this.input.get("o") || "");
        const ignores = this.input.get("ignore", "").split(",");
        const variables = new Variables();
        let redisCommandList: string[] = [];
        let total = 0;

        this.checkInFile(inFile);
        this.checkOutFile(outFile);

        const getWatcher = (total: number) => {
            let counter = 0;

            return () => {
                counter++;

                if (counter < total) {
                    return;
                }

                if (redisCommandList.length == 0) {
                    console.log("没有找到可以生成lua脚本的csv文件");
                    return;
                }

                variables.set("list", redisCommandList.join("\n"));

                const targetFile = isDir(outFile) ? path.join(outFile, "redis.lua") : outFile;
                const coderHandle = new Coder();
                const resultContent = coderHandle.generate(this.app.path.luaTemplatePath(), variables);

                fs.writeFileSync(targetFile, resultContent);

                console.log(`生成成功，共处理了${total}个文件`);
            };
        };

        const files = fs.readdirSync(inFile);

        const watchCommandBuild = getWatcher(files.length);

        files
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

                    watchCommandBuild();
                });
            });
    }
}
