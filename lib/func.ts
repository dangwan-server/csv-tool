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
            name: v,
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

export function filterDefaultPointDirName(fileName: string) {
    return fileName == "." || fileName == "..";
}
