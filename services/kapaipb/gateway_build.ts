import { TypeServiceInfo } from "../component/type";
import Coder from "../component/coder";
import Variables from "../component/variables";
import { TypeStructInfo } from "../component/type";
import Str from "@/utils/str";
import { isGoSystemType, convertUnSupperType } from "@/utils/go";

type TypeAssignmentOption = {
    leftRootName: string;
    rightRootName: string;
    pbPackageName: string;
};

function convertValueType(typeName: string, value: string): string {
    const { originType, targetType } = convertUnSupperType(typeName);

    if (originType != targetType) {
        return `${targetType}(${value})`;
    }

    return value;
}

export default class GatewayBuild {
    private configTemplate() {
        return `RegisterConfig[head.Cmd{$package_name}] = myConfig{
    Parsers: typeParserColl{
        {$parse_body}
    },
    cmdHandle: func() IGatewayActionHandle {
        h := New{$package_name}Handle()
        {$register_body}
        return h
    },
}`;
    }

    private handleTemplate() {
        return `//{$comment}
func (h *{$package_name}Handle) {$service_name}(ctx context.Context) (interface{}, error) {
    {$c2s_body}

    res, err := h.client.{$service_name}(ctx, req)

    if err != nil {
        return nil, err
    }

    {$s2c_body}

    return s2c, nil
}`;
    }

    buildConfig(serviceList: TypeServiceInfo[], packageName: string) {
        const variables = new Variables();
        const coder = new Coder();
        const ucPackageName = Str.ucFirst(packageName);
        const parseBody = serviceList
            .map((v) => {
                let actionName = Str.toSnake(ucPackageName + "_" + Str.trimPrefix(v.name, ucPackageName));

                return `head.${actionName} : &pa.${v.c2s.name}{},`;
            })
            .join("\n\t\t\t\t");

        const registerBody = serviceList
            .map((v) => {
                let handleName = v.name;
                let actionName = Str.toSnake(ucPackageName + "_" + Str.trimPrefix(v.name, ucPackageName));

                return `//${v.c2s.comment}\n\t\t\t\th.RegisterAction(head.${actionName}, h.${handleName})`;
            })
            .join("\n\t\t\t\t");

        variables.set("package_name", ucPackageName);
        variables.set("parse_body", parseBody);
        variables.set("register_body", registerBody);

        return coder.generate(this.configTemplate(), variables);
    }

    buildHandle(serviceInfo: TypeServiceInfo, structList: TypeStructInfo[], packageName: string) {
        const serviceName = serviceInfo.name;
        const variables = new Variables();
        const coder = new Coder();

        const cli2sV = Object.assign({}, serviceInfo.c2s, { name: serviceName + "Req" });
        const cli2sTree = this.combinTargetTree(cli2sV, structList);
        const cli2sArr = this.buildStructAssignment(
            cli2sTree,
            {
                leftRootName: "req",
                rightRootName: "c2s",
                pbPackageName: "pb",
            },
            true
        );

        // 去除空的c2s
        if (cli2sArr.length > 1) {
            cli2sArr.unshift(`c2s := h.Msg.C2S().(*params.${serviceName}C2S)`);
        }

        const cli2sBody = cli2sArr.join("\n\t\t");

        const ser2cTree = this.combinTargetTree(serviceInfo.s2c, structList);
        const ser2cBody = this.buildStructAssignment(
            ser2cTree,
            {
                leftRootName: "s2c",
                rightRootName: "res",
                pbPackageName: "params",
            },
            false
        ).join("\n\t\t");

        variables.set("comment", serviceInfo.c2s.comment);
        variables.set("package_name", packageName);
        variables.set("service_name", serviceName);
        variables.set("c2s_body", cli2sBody);
        variables.set("s2c_body", ser2cBody);

        return coder.generate(this.handleTemplate(), variables);
    }

    //生成属性赋值的代码块
    buildStructAssignment(v: TypeStructInfo, option: TypeAssignmentOption, isPointer = false, parents: string[] = [], index: number = 0) {
        const result: string[] = [];

        if (parents.length == 0) {
            result.push(`${option.leftRootName} := ${isPointer ? "&" : ""}${option.pbPackageName}.${v.name}{}`);
        }

        v.propertys.map((v) => {
            const newParents = [...parents, v.name];
            const leftVars = [option.leftRootName, ...newParents];
            const rightVars = [option.rightRootName, ...newParents];

            if (v.type.name == "array") {
                result.push(`for _, v := range ${rightVars.join(".")} {`);

                const rowName = index == 0 ? "row" : `row${index}`;

                // 循环开始
                if (v.typeTarget) {
                    // 递归赋值
                    result.push(
                        ...this.buildStructAssignment(
                            v.typeTarget,
                            {
                                leftRootName: rowName,
                                rightRootName: "v",
                                pbPackageName: option.pbPackageName,
                            },
                            isPointer,
                            [],
                            ++index
                        ).map((v) => "\t" + v)
                    );

                    result.push(`\t${leftVars.join(".")} = append(${leftVars.join(".")}, ${rowName})`);
                } else {
                    let appendRowValue = "v";
                    if (v.type.son) {
                        appendRowValue = convertValueType(v.type.son, appendRowValue);
                    }

                    result.push(`\t${leftVars.join(".")} = append(${leftVars.join(".")}, ${appendRowValue})`);
                }

                // 循环结束
                result.push(`}`);
            } else {
                if (!isGoSystemType(v.type.name)) {
                    // 链式赋值
                    result.push(`${leftVars.join(".")} = ${option.pbPackageName}.${v.type.name}{}`);
                } else {
                    let targetValue = rightVars.join(".");

                    targetValue = convertValueType(v.type.name, targetValue);

                    // 普通赋值
                    result.push(`${leftVars.join(".")} = ${targetValue}`);
                }

                if (v.typeTarget) {
                    // 递归赋值
                    result.push(...this.buildStructAssignment(v.typeTarget, option, isPointer, newParents));
                }
            }
        });

        return result;
    }

    //解析成属性树形结构
    combinTargetTree(v: TypeStructInfo, structList: TypeStructInfo[]) {
        v.propertys = v.propertys.map((attr) => {
            let typeTarget = null;
            let typeTargetName: string | undefined = attr.type.name;

            if (attr.type.isRecomb) {
                if (attr.type.son) {
                    typeTargetName = attr.type.son;
                }
            }

            if (!isGoSystemType(typeTargetName)) {
                typeTarget = structList
                    .filter((struct) => {
                        return struct.name == typeTargetName;
                    })
                    .pop();

                // 递归组合target树结构
                if (typeTarget) {
                    typeTarget = this.combinTargetTree(typeTarget, structList);
                }
            }

            return Object.assign(attr, {
                typeTarget: typeTarget,
            });
        });

        return v;
    }
}
