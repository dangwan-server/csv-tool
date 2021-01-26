import HanldeAbstract from "../lib/handle";
import path from "path";
import fs from "fs";
import { isDir, filetrSufixName, upperCaseFirstW } from "../lib/func";

type MessageStructProperty = {
    name: string;
    type: string;
    comment: string;
};

class Heap {
    items: string[] = [];

    push(val: string) {
        this.items.push(val);
    }

    pop(): string {
        return this.items.pop() || "";
    }

    len() {
        return this.items.length;
    }

    isEmpty() {
        return this.len() == 0;
    }
}

class VarHeapManage {
    varHeap: Heap;
    commentHeap: Heap;
    couter = 0;

    constructor() {
        this.varHeap = new Heap();
        this.commentHeap = new Heap();
    }

    push(val: string) {
        if (this.couter % 2 == 0) {
            //本来应该是注释的
            if (isComment(val)) {
                this.commentHeap.push(val);
            } else {
                this.commentHeap.push("");
                this.varHeap.push(val);
                this.couter++;
            }
        } else {
            this.varHeap.push(val);
        }

        this.couter++;
    }

    pop() {
        const varLine = this.varHeap.pop();
        const commentLine = this.commentHeap.pop();
        return {
            varLine,
            commentLine,
        };
    }

    isEmpty() {
        return this.varHeap.isEmpty();
    }
}

function isGoSystemType(sType: string) {
    return ["int32", "byte", "[]byte", "string"].indexOf(sType) != -1;
}

function getStructNameFromType(sType: string) {
    if (isGoSystemType(sType)) {
        return null;
    }

    const preg = /(\[\])?(.+)/;
    return sType.replace(preg, "$2");
}

function isComment(val: string) {
    return val.substring(0, 2) == "//";
}

function mapCount(count: { total: number }) {
    return (v: any) => {
        count.total++;
        return v;
    };
}

function formatStructProperty(content: string, structName: string, childStructs: { name: string; propertys: any }[]) {
    const structReg = new RegExp(`type ${structName} struct {\\n(.*?)\\n}`, "ms");

    const matched = content.match(structReg);

    if (!matched) {
        return [];
    }

    const lines = matched[1].split("\n").map((v) => v.replace("\t", ""));
    const nameReg = /(\w+)\s+(.*?)\s+/;

    const varHeap = new VarHeapManage();

    lines.map((v) => {
        varHeap.push(v);
    });

    let lineResult;

    const result: MessageStructProperty[] = [];

    while (!varHeap.isEmpty()) {
        lineResult = varHeap.pop();
        var matchedVar = lineResult.varLine.match(nameReg);

        if (!matchedVar) {
            continue;
        }

        result.push({
            name: matchedVar[1],
            type: matchedVar[2],
            comment: lineResult.commentLine,
        });
    }

    const propertys = result
        .filter((v) => v.name.substring(0, 4) != "XXX_")
        .map((v) => {
            v.type = v.type.replace("*", "");
            return v;
        });

    propertys.forEach((v) => {
        const childStructName = getStructNameFromType(v.type);
        if (childStructName) {
            childStructs.push({
                name: childStructName,
                propertys: formatStructProperty(content, childStructName, childStructs),
            });
        }
    });

    return propertys;
}

function getStructMessages(content: string, structName: string, rqType: "rq" | "rp") {
    const childStructs: any[] = [];
    const pts = formatStructProperty(content, structName, childStructs);
    let goStructName = structName;

    if (rqType == "rq") {
        goStructName = goStructName.replace(/(Req)|(Request)$/, "") + "C2S";
    }

    if (rqType == "rp") {
        goStructName = goStructName.replace(/Reply$/, "") + "S2C";
    }

    childStructs.push({
        name: goStructName,
        hasPrefix: true,
        propertys: pts,
    });

    return childStructs;
}

export default class PbHandle extends HanldeAbstract {
    private isSignle(inFile: string) {
        return path.parse(inFile).ext != "";
    }

    handle() {
        const inFile = path.resolve(this.input.get("i", ""));
        const outFile = path.resolve(this.input.get("o", ""));
        const count = { total: 0 };

        if (!isDir(inFile)) {
            throw new Error("in必须是目录");
        }

        if (!isDir(outFile)) {
            throw new Error("out必须是目录");
        }

        const outBasePackageName = path.basename(outFile);

        fs.readdirSync(inFile)
            .filter((v) => filetrSufixName(v, "pb.go"))
            .map(mapCount(count))
            .map((v) => {
                const filePath = path.join(inFile, v);
                const serviceStrctReg = /type\s+\w+Client\s+interface\s+{\n(.*?)\n}/s;
                const structRequestStructReg = /in\s\*(.*?),/;
                const structReplyStructReg = /\(\*(.*?),/;
                const packageName = v.substring(0, v.indexOf("."));

                const content = fs.readFileSync(filePath, {
                    encoding: "utf-8",
                });

                const result = content.match(serviceStrctReg);

                if (!result) {
                    console.error("没有匹配到client内容");
                    return;
                }

                let lines = result[0].split("\n");

                lines.shift();
                lines.pop();

                // 获取in对象, 获取out对象
                // 递归获取in/out对象属性
                // 过滤XXX...的属性
                // 重命名参数对象的后缀
                // 组合成go结构体内容

                const structs: { rq: string; rp: string }[] = lines
                    .map((v) => {
                        if (v[0] == "\t") {
                            return v.substring(1);
                        }
                        return v;
                    })
                    .filter((v) => v[0] + v[1] != "//")
                    .map((v) => {
                        const requestMatched = v.match(structRequestStructReg);
                        const replyMatched = v.match(structReplyStructReg);

                        if (!replyMatched || !requestMatched) {
                            return { rq: "", rp: "" };
                        }

                        return {
                            rq: requestMatched[1],
                            rp: replyMatched[1],
                        };
                    })
                    .filter((v) => v.rq != "");

                const messageStructs: { name: string; hasPrefix: false; propertys: MessageStructProperty[] }[] = [];

                structs.map((v) => {
                    if (!/^common\./.test(v.rq)) {
                        messageStructs.push(...getStructMessages(content, v.rq, "rq"));
                    }

                    if (!/^common\./.test(v.rp)) {
                        messageStructs.push(...getStructMessages(content, v.rp, "rp"));
                    }
                });

                let msgStructContents = [];
                const uniqueMessageName: string[] = [];

                msgStructContents = messageStructs
                    .map((v) => {
                        if (uniqueMessageName.indexOf(v.name) != -1) {
                            return "";
                        }

                        const messageContent = [];
                        let structName = upperCaseFirstW(v.name);

                        if (v.hasPrefix) {
                            structName = upperCaseFirstW(packageName) + structName;
                        }

                        messageContent.push(`type ${structName} struct {`);
                        messageContent.push(
                            ...v.propertys.map((v) => {
                                const comment = v.comment.replace(/^\/\/\s?([^\s])/, "// $1");

                                return `\t${v.name} ${v.type} ${comment}`;
                            })
                        );

                        messageContent.push("}");

                        uniqueMessageName.push(v.name);

                        return messageContent.join("\n");
                    })
                    .filter((v) => v != "");

                msgStructContents.unshift(`package ${outBasePackageName}`);

                const outContent = msgStructContents.join("\n\n");

                fs.writeFileSync(path.join(outFile, `${packageName}.go`), outContent);
            });

        console.log(`总共处理了${count.total}个文件`);
    }
}
