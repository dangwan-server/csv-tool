import HanldeAbstract from "../lib/handle";
import path from "path";
import fs from "fs";
import { isDir, convExcelToCsv, filetrFileType } from "../lib/func";

export default class Conv extends HanldeAbstract {
    handle() {
        const inFile = path.resolve(this.input.get("i") || "");
        const outFile = path.resolve(this.input.get("o") || "");
        let total = 0;

        if (isDir(inFile)) {
            if (!isDir(outFile)) {
                throw new Error("out必须是目录");
            }

            fs.readdirSync(inFile)
                .filter((v) => filetrFileType(v, "xlsx"))
                .map((v: string) => {
                    return path.parse(v);
                })
                .map((v) => {
                    total++;
                    return v;
                })
                .map((v) => {
                    convExcelToCsv(path.join(inFile, v.base), path.join(outFile, v.name + ".csv"));
                });
        } else {
            convExcelToCsv(inFile, outFile);
        }

        console.log(`转换成功!共处理${total}个文件`);
    }
}
