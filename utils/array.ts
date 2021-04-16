export function getMaxId(list: any[]) {
    list = list.filter((v) => !isNaN(parseInt(v.id))).map((v) => v.id);

    if (!list || list.length == 0) {
        return 0;
    }

    return Math.max.apply(null, list);
}

export function convertArguments(agvs: any) {
    if (!agvs.length) {
        return [];
    }

    let result = [];
    for (var i = 0; i < agvs.length; i++) {
        result.push(agvs[i]);
    }

    return result;
}
