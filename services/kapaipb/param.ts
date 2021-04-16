import fs from "fs";
import { isGoSystemType } from "@/utils/go";
import { VarHeapManage } from "@/utils/heap";
import { TypeStructInfo, TypeServiceInfo, MessageStructType, MessageStructProperty } from "../component/type.d";
import path from "path";

export default class ParamScan {
    getType(sType: string): MessageStructType {
        if (isGoSystemType(sType)) {
            return {
                name: sType,
                isRecomb: false,
            };
        }

        const isMap = (sType: string) => {
            return /^map/.test(sType);
        };

        const isArray = (sType: string) => {
            return /^\[\]/.test(sType);
        };

        if (isMap(sType)) {
            // 去除map,获得后面自定义的类型名
            const mapReg = /map\[(\w+)\](.+)/;
            return {
                name: sType.replace(mapReg, "map_$1"),
                isRecomb: true,
                son: sType.replace(mapReg, "$2"),
            };
        }

        if (isArray(sType)) {
            // 去除[],获得后面自定义的类型名
            return {
                name: "array",
                isRecomb: true,
                son: sType.replace(/\[\](.+)/, "$1"),
            };
        }

        return {
            name: sType,
            isRecomb: false,
        };
    }

    getPropertys(body: string) {
        const nameReg = /(\w+)\s+(.*?)(\s|$)/;
        const commentReg = /\/\/(.*?)$/;
        const varHeap = new VarHeapManage();
        const lines = body.split("\n");

        lines.map((v) => {
            varHeap.push(v);
        });

        let lineResult;

        const result: MessageStructProperty[] = [];

        while (!varHeap.isEmpty()) {
            lineResult = varHeap.pop();
            const matchedVar = lineResult.varLine.match(nameReg);

            if (!matchedVar) {
                continue;
            }

            const matchedComment = lineResult.varLine.match(commentReg);
            const commentContent = matchedComment ? matchedComment[1] : lineResult.commentLine;

            result.push({
                name: matchedVar[1],
                type: this.getType(matchedVar[2]),
                comment: commentContent,
            });
        }

        return result;
    }

    private parseSructList(fileName: string) {
        const structReg = new RegExp(`type (\\w+) struct {\\n(.*?)\\n?}`, "msg");
        const structArr: TypeStructInfo[] = [];
        const content = fs.readFileSync(fileName, {
            encoding: "utf-8",
        });

        var structMatched: any;

        while ((structMatched = structReg.exec(content)) != null) {
            const structName = structMatched[1];

            const commentReg = new RegExp(`//(.*?)\ntype ${structName} struct`);
            const commentMatched = content.match(commentReg);

            structArr.push({
                comment: commentMatched ? commentMatched[1] : "",
                name: structName,
                body: structMatched[2],
                propertys: [],
            });
        }

        structArr.map((v) => {
            v.propertys = this.getPropertys(v.body);
        });

        return structArr;
    }

    getStructList(fileName: string, hasCommon: boolean = true) {
        if (hasCommon) {
            return [...this.parseSructList(path.join(path.dirname(fileName), "common.go")), ...this.parseSructList(fileName)];
        }

        return this.parseSructList(fileName);
    }

    private findS2c(list: TypeStructInfo[], expectName: string) {
        return list
            .filter((v) => {
                return v.name == expectName;
            })
            .pop();
    }

    getServiceList(fileName: string): TypeServiceInfo[] {
        const isC2s = (reqName: string) => {
            return /C2S$/.test(reqName);
        };

        const list = this.getStructList(fileName);

        return list
            .filter((v) => isC2s(v.name))
            .map((v) => {
                const serviceName = v.name.replace(/C2S$/, "");
                const s2c: any = this.findS2c(list, serviceName + "S2C");

                return {
                    name: serviceName,
                    c2s: v,
                    s2c: s2c,
                };
            })
            .filter((v) => v.s2c != null);
    }
}
