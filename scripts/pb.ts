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

function isComment(val: string) {
    return val.substring(0, 2) == "//";
}

function mapCount(count: { total: number }) {
    return (v: any) => {
        count.total++;
        return v;
    };
}

function formatStructProperty(content: string, structName: string) {
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

    const propertys = result.filter((v) => v.name.substring(0, 4) != "XXX_");

    return propertys;
}

export default class PbHandle extends HanldeAbstract {
    private isSignle(inFile: string) {
        return path.parse(inFile).ext != "";
    }

    handle() {
        const inFile = "/Users/lixingbo/golang/company/dangwan/kapai/pb/github.com/dangwan-server/pb/package";
        const outBasePackageName = "params2";
        const outFile = "/Users/lixingbo/golang/company/dangwan/kapai/pb/" + outBasePackageName;
        const count = { total: 0 };

        if (!isDir(inFile)) {
            throw new Error("in必须是目录");
        }

        if (!isDir(outFile)) {
            throw new Error("out必须是目录");
        }

        fs.readdirSync(inFile)
            .filter((v) => filetrSufixName(v, "pb.go"))
            .map(mapCount(count))
            .map((v) => {
                const filePath = path.join(inFile, v);
                const serviceStrctReg = /type\s+\w+Client\s+interface\s+{\n(.*?)\n}/s;
                const structRequestStructReg = /in\s\*(\w+),/;
                const structReplyStructReg = /\(\*(\w+),/;
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

                const messageStructs: { name: string; propertys: MessageStructProperty[] }[] = [];

                structs.map((v) => {
                    const rqPropertys = formatStructProperty(content, v.rq);
                    const rpPropertys = formatStructProperty(content, v.rp);

                    const rqName = v.rq.replace(/(Req)|(Request)$/, "") + "C2S";
                    const rpName = v.rp.replace(/Reply$/, "") + "S2C";

                    messageStructs.push({
                        name: rqName,
                        propertys: rqPropertys,
                    });

                    messageStructs.push({
                        name: rpName,
                        propertys: rpPropertys,
                    });
                });

                let msgStructContents = [];

                msgStructContents = messageStructs.map((v) => {
                    const messageContent = [];
                    const structName = upperCaseFirstW(packageName) + upperCaseFirstW(v.name);

                    messageContent.push(`type ${structName} struct {`);
                    messageContent.push(
                        ...v.propertys.map((v) => {
                            return `\t${v.name} ${v.type} ${v.comment}`;
                        })
                    );

                    messageContent.push("}");

                    return messageContent.join("\n");
                });

                msgStructContents.unshift(`package ${outBasePackageName}`);

                const outContent = msgStructContents.join("\n\n");

                fs.writeFileSync(path.join(outFile, `${packageName}.go`), outContent);
            });

        console.log(`总共处理了${count.total}个文件`);
    }
}
