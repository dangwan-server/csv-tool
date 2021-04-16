import { TypeStructInfo, TypeServiceName } from "../component/type";
import Coder from "../component/coder";
import Variables from "../component/variables";
import Str from "@/utils/str";
import { convertUnSupperType } from "@/utils/go";

export default class ProtoBuild {
    private messageTemplate() {
        return `
message {$name} 
{
    {$body}
}
`;
    }

    private serviceTemplate() {
        return `    //{$comment}\n    rpc {$service}({$request}) returns ({$reply});`;
    }

    buildMessage(struct: TypeStructInfo) {
        const coder = new Coder();
        const variables = new Variables();
        const isCommonMessage = (typeName: string) => {
            return ["BaseAttr", "ExtendAttr"].indexOf(typeName) != -1;
        };
        const getTypeName = (typeName: string): { originType: string; targetType: string } => {
            const { originType, targetType } = convertUnSupperType(typeName);

            if (isCommonMessage(originType)) {
                return {
                    originType: originType,
                    targetType: "common." + originType,
                };
            }

            return {
                originType: originType,
                targetType: targetType,
            };
        };

        const tabSpace = new Array(4).fill(" ").join("");

        const body = struct.propertys
            .map((v, k) => {
                const varName = Str.toLine(v.name);
                const typeInfo = getTypeName(v.type.name);

                const result = {
                    comment: v.comment,
                    line: `${typeInfo.targetType} ${varName} = ${k + 1}`,
                };

                if (!v.type.isRecomb) {
                    return result;
                }

                if (v.type.name == "array") {
                    const typeName = v.type.son ? v.type.son : "known";
                    const typeInfo = getTypeName(typeName);

                    result.line = `repeated ${typeInfo.targetType} ${varName} = ${k + 1}`;
                    return result;
                }

                return result;
            })
            .map((v) => {
                return (v.comment ? "//" + v.comment + "\n" + tabSpace : "") + v.line + ";";
            })
            .join("\n" + tabSpace);

        variables.set("name", struct.name.replace(/(.*?)C2S$/, "$1Req").replace(/(.*?)S2C$/, "$1Reply"));
        variables.set("body", body);

        const result = coder.generate(this.messageTemplate(), variables);

        return result;
    }

    buildService(struct: TypeServiceName) {
        const variables = new Variables();
        const coder = new Coder();

        variables.set("comment", struct.comment);
        variables.set("request", struct.requestName);
        variables.set("reply", struct.replyName);
        variables.set("service", struct.serviceName);

        return coder.generate(this.serviceTemplate(), variables);
    }
}
