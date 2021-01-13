import HanldeAbstract from "../lib/handle";
import path from "path";
import fs from "fs";
import { isDir, filetrFileType, readXlsx, xlsxWorkbookWriteCsv } from "../lib/func";

export default class Conv extends HanldeAbstract {
    private isSignle(inFile: string) {
        return path.parse(inFile).ext != "";
    }

    handle() {
        const inFile = path.resolve(this.input.get("i") || "");
        const outFile = path.resolve(this.input.get("o") || "");
        let total = 0;

        if (this.isSignle(inFile)) {
            const workbook = readXlsx(inFile);
            let targetFile = outFile;

            if (isDir(outFile)) {
                targetFile = path.join(outFile, path.parse(inFile).name + ".csv");
            }

            xlsxWorkbookWriteCsv(workbook, targetFile);

            total++;
        } else {
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
                    const xlsxFile = path.join(inFile, v.base);
                    const workbook = readXlsx(xlsxFile);

                    xlsxWorkbookWriteCsv(workbook, path.join(outFile, v.name + ".csv"));
                });
        }

        console.log(`转换成功!共处理${total}个文件`);
    }
}
