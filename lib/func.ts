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

export function formatType(typeName: string): string {
    return typeName.trim();
}

export function isFileExists(filePath: string) {
    return fs.existsSync(filePath);
}

export type TypeRowValue = {
    isServer: boolean;
    comment: string;
    name: string;
    value: string | number;
    type: string;
};

export type XlsxJsonResult = {
    header: TypeRowValue[];
    list: TypeRowValue[][];
};

export function readXlsxToJson(inFile: string): Promise<XlsxJsonResult> {
    return new Promise((r) => {
        return r(readXlsxToJsonSync(inFile));
    });
}

export function readXlsxToJsonSync(inFile: string): XlsxJsonResult {
    const workbook = readXlsx(inFile);
    let sheetNames = workbook.SheetNames; //获取表明
    const result: XlsxJsonResult = {
        header: [],
        list: [],
    };
    let sheet = workbook.Sheets[sheetNames[0]]; //通过表明得到表对象
    const sheetNameRowNumber = 2; // 作为key的行号

    let sheetJsonHeader: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    if (sheetJsonHeader.length < 4) {
        console.error(inFile + "内容行数不够");
        return result;
    }

    // 去掉没有name字段的列
    let commentRow = sheetJsonHeader[0].filter((_: any, i: number) => {
        return sheetJsonHeader[sheetNameRowNumber][i];
    });

    let serverRow = sheetJsonHeader[1].filter((_: any, i: number) => {
        return sheetJsonHeader[sheetNameRowNumber][i];
    });

    let sheetJson: any[] = xlsx.utils.sheet_to_json(sheet, {
        range: sheetNameRowNumber,
    });

    const valueTypeRow = sheetJson[0];

    result.header = Object.keys(valueTypeRow).map((name, i) => {
        return {
            comment: commentRow[i],
            isServer: serverRow[i] == "common" || serverRow[i] == "server",
            name: name,
            type: formatType(valueTypeRow[name]),
            value: "",
        };
    });

    const headerMap: { [key: string]: TypeRowValue } = result.header.reduce((prev: any, v) => {
        prev[v.name] = v;

        return prev;
    }, {});

    result.list = sheetJson
        .filter((_, k) => k > 0)
        .map((v) => {
            const currentRow: TypeRowValue[] = [];

            for (let i in v) {
                // 过滤类型为空的值
                if (!valueTypeRow[i]) {
                    continue;
                }

                currentRow.push({
                    comment: headerMap[i].comment,
                    isServer: headerMap[i].isServer,
                    name: i,
                    type: formatType(valueTypeRow[i]),
                    value: v[i],
                });
            }

            return currentRow;
        });

    return result;
}

export function readXlsx(inFile: string) {
    if (!isFile(inFile)) {
        throw new Error("文件不存在:" + inFile);
    }

    return xlsx.readFile(inFile, {});
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
