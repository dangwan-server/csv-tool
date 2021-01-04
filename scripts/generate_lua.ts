import HanldeAbstract from "../lib/handle";
import { isDir } from "../lib/func";
import path from "path";
import GernerateLuaService from "../services/lua";

export default class GeneralLuaHandle extends HanldeAbstract {
    private checkInFile(inFile: string) {
        if (!isDir(inFile)) {
            throw new Error(`目录${inFile}不存在`);
        }
    }

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

    handle() {
        const inFile = path.resolve(this.input.get("i") || "");
        const outFile = path.resolve(this.input.get("o") || "");
        const ignores = this.input.get("ignore", "").split(",");

        this.checkInFile(inFile);
        this.checkOutFile(outFile);

        const handle = new GernerateLuaService(this.app);

        handle.generateFromDir(inFile, outFile, ignores);
    }
}
