export function isGoSystemType(sType: string) {
    return ["int", "uint", "int32", "uint32", "int64", "uint64", "byte", "[]byte", "string", "float", "float32", "float64"].indexOf(sType) != -1;
}

export function convertUnSupperType(typeName: string): { originType: string; targetType: string } {
    if (typeName == "uint16") {
        return {
            originType: typeName,
            targetType: "int32",
        };
    }

    return {
        originType: typeName,
        targetType: typeName,
    };
}
