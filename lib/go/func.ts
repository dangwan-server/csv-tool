export function isGoSystemType(sType: string) {
    return ["int", "uint", "int32", "uint32", "int64", "uint64", "byte", "[]byte", "string", "float", "float32", "float64"].indexOf(sType) != -1;
}

export function getStructNameFromType(sType: string) {
    if (isGoSystemType(sType)) {
        return null;
    }

    const preg = /(\[\])?(.+)/;
    return sType.replace(preg, "$2");
}
