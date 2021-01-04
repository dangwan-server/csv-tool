import path from "path";

export default class PathService {
    private rootDir = "";

    constructor(rootDir: string) {
        this.rootDir = rootDir;
    }

    luaTemplatePath() {
        return path.join(this.rootDir, "template", "lua.lua");
    }

    goTemplatePath() {
        return path.join(this.rootDir, "template", "struct.go");
    }

    csvPath(csvName?: string) {
        const dir = path.join(this.rootDir, "csv");

        if (!csvName) {
            return dir;
        }

        const keyName = path.parse(csvName).name;

        return path.join(dir, keyName + ".csv");
    }

    jsonPath(csvName?: string) {
        const dir = path.join(this.rootDir, "json");

        if (!csvName) {
            return dir;
        }

        const keyName = path.parse(csvName).name;
        return path.join(dir, keyName + ".json");
    }

    configPath() {
        return path.join(this.rootDir, "config.json");
    }
}
