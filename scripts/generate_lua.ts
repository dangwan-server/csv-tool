import HanldeAbstract from "../lib/handle";
import { isDir, isFile } from "../lib/func";
import path from "path";
import GernerateLuaService from "../services/lua";
import Variables from "../lib/variables";

const cacheConfigPrefix = "game_config";

export default class GeneralLuaHandle extends HanldeAbstract {
    private checkOutFile(outFile: string) {
        const targetIsDir = (pathName: string) => {
            return path.parse(pathName).ext == "";
        };

        if (targetIsDir(outFile) && !isDir(outFile)) {
            throw new Error(`目录${outFile}不存在`);
        }

        if (!targetIsDir(outFile)) {
            if (!isDir(path.dirname(outFile))) {
                throw new Error(`${path.dirname(outFile)}目录不存在`);
            }
        }
    }

    private isSignle(inFile: string) {
        return path.parse(inFile).ext != "";
    }

    handle() {
        const inFile = path.resolve(this.input.get("i") || "");
        const outFile = path.resolve(this.input.get("o") || "");
        const cacheKey = this.input.get("cache_key", cacheConfigPrefix);
        const variables = new Variables();

        this.checkOutFile(outFile);

        variables.set("cache_key", cacheKey);

        const handle = new GernerateLuaService(this.app, variables);

        if (this.isSignle(inFile)) {
            if (!isFile(inFile)) {
                throw new Error(`文件${inFile}不存在`);
            }

            const ignores = this.input
                .get("ignore", "")
                .split(",")
                .filter((v) => v != "");

            handle.generate(inFile, outFile, ignores);
        } else {
            if (!isDir(inFile)) {
                throw new Error(`目录${inFile}不存在`);
            }

            const ignores = this.input.get("ignore", "");

            handle.generateFromDir(inFile, outFile, ignores);
        }
    }
}
