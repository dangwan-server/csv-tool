import fs from "fs";
import xlsx from "xlsx";
import path from "path";
import csv from "csvtojson";

export function isFile(filePath: string) {
    return isFileExists(filePath) && fs.statSync(filePath).isFile();
}

export function isDir(filePath: string) {
    return isFileExists(filePath) && fs.statSync(filePath).isDirectory();
}

export function isFileExists(filePath: string) {
    return fs.existsSync(filePath);
}

export function readXlsxToJson(inFile: string): Promise<any[]> {
    const workbook = readXlsx(inFile);
    let sheetNames = workbook.SheetNames; //获取表明

    return new Promise((r) => {
        let sheet = workbook.Sheets[sheetNames[0]]; //通过表明得到表对象
        let list: any[] = xlsx.utils.sheet_to_json(sheet);

        r(list);
    });
}

export function readXlsx(inFile: string) {
    if (!isFile(inFile)) {
        throw new Error("文件不存在:" + inFile);
    }

    return xlsx.readFile(inFile);
}

export function xlsxWorkbookWriteCsv(workbook: xlsx.WorkBook, outFile: string) {
    const result = xlsx.write(workbook, {
        bookType: "csv",
        compression: true,
        type: "string",
    });

    fs.writeFileSync(outFile, result);
}

export function convExcelToCsv(inFile: string, outFile: string) {
    if (!isFile(inFile)) {
        console.warn("文件不存在:" + inFile);
        return;
    }

    const workbook = xlsx.readFile(inFile);
    const targetPath = outFile;

    const result = xlsx.write(workbook, {
        bookType: "csv",
        compression: true,
        type: "string",
    });

    fs.writeFileSync(targetPath, result);
}

export function filetrFileType(filePath: string, ext: "csv" | "xlsx") {
    return path.parse(filePath).ext == "." + ext;
}

export function filetrSufixName(filePath: string, ext: string) {
    ext = "." + ext;
    return filePath.substring(filePath.length - ext.length) == ext;
}

export function upperCaseFirstW(str: string) {
    return str[0].toUpperCase() + str.substr(1);
}

export function objValues(obj: { [key: string]: any }) {
    return Object.keys(obj).map((k) => {
        return obj[k];
    });
}

export async function readCsv(filePath: string) {
    return csv().fromFile(filePath, {
        encoding: "utf-8",
    });
}

export function filterEmptyName(v: { name: string }) {
    return v.name != "";
}

export function filterInValidName(v: { name: string }) {
    return /^\w+$/i.test(v.name) && filterEmptyName(v);
}

export function filterIgnoreName(v: { name: string }, ignores: string[]) {
    return ignores.indexOf(v.name) == -1;
}

export function getHeaderConfig(list: any[]) {
    const names = objValues(list[0]);
    const types = objValues(list[1]);
    return names.map((v, i) => {
        return {
            name: v.replace(/\s+/g, ""),
            type: types[i],
            value: "",
        };
    });
}

export function getIgnores(ignorePath: string, itemName: string): string[] {
    if (!ignorePath) {
        return [];
    }

    const filePath = path.resolve(ignorePath);

    if (!isFile(filePath)) {
        throw new Error(`配置文件${ignorePath}不存在`);
    }

    const config = JSON.parse(
        fs.readFileSync(ignorePath, {
            encoding: "utf-8",
        })
    );

    if (!config) {
        return [];
    }

    return config[itemName] || [];
}

export function isSystemDirName(fileName: string) {
    return fileName == "." || fileName == "..";
}

export function isComment(val: string) {
    return val.trim().substring(0, 2) == "//";
}

export function mapCount(count: { total: number }) {
    return (v: any) => {
        count.total++;
        return v;
    };
}
