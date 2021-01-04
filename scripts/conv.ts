import HanldeAbstract from "../lib/handle";
import path from "path";
import fs from "fs";
import { isDir, convExcelToCsv, filetrFileType } from "../lib/func";

export default class Conv extends HanldeAbstract {
    handle() {
        const inFile = path.resolve(this.input.get("i") || "");
        const outFile = path.resolve(this.input.get("o") || "");

        if (isDir(inFile)) {
            fs.readdirSync(inFile)
                .filter((v) => filetrFileType(v, "xlsx"))
                .map((v: string) => {
                    return path.parse(v);
                })
                .map((v) => {
                    convExcelToCsv(path.join(inFile, v.base), path.join(outFile, v.name + ".csv"));
                });
        } else {
            convExcelToCsv(inFile, outFile);
        }

        console.log("转换成功");
    }
}
