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

    ignoreJsonPath() {
        return path.join(this.rootDir, "ignore.json");
    }
}
