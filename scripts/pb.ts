import HanldeAbstract from "../lib/handle";
import path from "path";
import fs from "fs";
import { isDir, filetrSufixName, upperCaseFirstW, mapCount, isComment } from "../lib/func";
import { VarHeapManage } from "../lib/heap";
import { getStructNameFromType } from "../lib/go/func";

type MessageStructProperty = {
    name: string;
    type: string;
    comment: string;
};

type MessageInfo = {
    name: string;
    comment: string;
};

type ServiceInfo = {
    name: string;
    rq: MessageInfo;
    rp: MessageInfo;
    comment: string;
};

function formatStructProperty(content: string, structName: string, childStructs: { name: string; propertys: any }[]) {
    const structReg = new RegExp(`type ${structName} struct {\\n(.*?)\\n}`, "ms");

    const matched = content.match(structReg);

    if (!matched) {
        return [];
    }

    const lines = matched[1].split("\n").map((v) => v.replace("\t", ""));
    const nameReg = /(\w+)\s+(.*?)\s+/;

    const varHeap = new VarHeapManage();

    lines
        .filter((v) => v.trim() != "" && v != "//----@client")
        .map((v) => {
            varHeap.push(v);
        });

    const result: MessageStructProperty[] = [];

    while (!varHeap.isEmpty()) {
        let lineResult = varHeap.pop();
        let matchedVar = lineResult.varLine.match(nameReg);

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

function getStructMessages(content: string, structInfo: MessageInfo, igNoreComment = false) {
    const childStructs: any[] = [];

    const pts = formatStructProperty(content, structInfo.name, childStructs);
    let goStructName = structInfo.name.replace(/(Req)|(Request)$/, "C2S");

    goStructName = goStructName.replace(/Reply$/, "S2C");

    childStructs.push({
        comment: igNoreComment ? "" : structInfo.comment,
        name: goStructName,
        hasPrefix: true,
        propertys: pts,
    });

    return childStructs;
}

export default class PbHandle extends HanldeAbstract {
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

                const structs: ServiceInfo[] = lines
                    .map((v) => {
                        if (v[0] == "\t") {
                            return v.substring(1);
                        }
                        return v;
                    })
                    .map((line, k) => {
                        // 是否是注释
                        let isCommentLine = isComment(line);
                        // 注释内容
                        let comment = "";

                        if (k > 0) {
                            const prevLine = lines[k - 1];
                            if (isComment(prevLine)) {
                                comment = prevLine.trim().substring(2);
                            }
                        }

                        return {
                            content: line,
                            isComment: isCommentLine,
                            comment: comment,
                        };
                    })
                    .filter((v) => {
                        return !v.isComment;
                    })
                    .filter((v, _) => {
                        // 有@server注释的是仅供服务端调用的方法
                        return v.comment.indexOf("@server") != 0;
                    })
                    .map((v) => {
                        const requestMatched = v.content.match(structRequestStructReg);
                        const replyMatched = v.content.match(structReplyStructReg);

                        if (!replyMatched || !requestMatched) {
                            return Object.assign(v, { requestName: "", replyName: "" });
                        }

                        return Object.assign(v, { requestName: requestMatched[1], replyName: replyMatched[1] });
                    })
                    .filter((v) => v.requestName != "")
                    .map((v) => {
                        return {
                            name: v.requestName.replace(/(Req|Reply)$/, ""),
                            comment: v.comment,
                            rq: {
                                name: v.requestName,
                                comment: v.comment,
                            },
                            rp: {
                                name: v.replyName,
                                comment: v.comment,
                            },
                        };
                    });

                const messageStructs: { comment: ""; name: string; hasPrefix: false; propertys: MessageStructProperty[] }[] = [];

                structs.map((v) => {
                    if (!/^common\./.test(v.rq.name)) {
                        messageStructs.push(...getStructMessages(content, v.rq));
                    }

                    if (!/^common\./.test(v.rp.name)) {
                        messageStructs.push(...getStructMessages(content, v.rp, true));
                    }
                });

                let msgStructContents = [];
                const uniqueMessageName: string[] = [];

                msgStructContents = messageStructs
                    .map((v) => {
                        if (uniqueMessageName.indexOf(v.name) != -1) {
                            return "";
                        }

                        // 不需要生成common包的struct
                        if (/^common\./.test(v.name)) {
                            return "";
                        }

                        const messageContent = [];
                        let structName = upperCaseFirstW(v.name);

                        if (v.comment) {
                            messageContent.push(`//${v.comment}`);
                        }

                        messageContent.push(`type ${structName} struct {`);
                        messageContent.push(
                            ...v.propertys.map((v) => {
                                const comment = v.comment.replace(/^\/\/\s?([^\s])/, "// $1");
                                // 把common.替换掉
                                const attrName = v.type.replace("common.", "");

                                return `\t${v.name} ${attrName} ${comment}`;
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
