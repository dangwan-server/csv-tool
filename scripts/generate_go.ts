import HanldeAbstract from "../lib/handle";
import { isDir } from "../lib/func";
import path from "path";
import GernerateGoService from "../services/go";

export default class GeneralGoHandle extends HanldeAbstract {
    private checkInFile(inFile: string) {
        if (!isDir(inFile)) {
            throw new Error(`目录${inFile}不存在`);
        }
    }

    private checkOutFile(outFile: string) {
        if (!isDir(outFile)) {
            throw new Error(`目录${outFile}不存在`);
        }
    }

    handle() {
        const inFile = path.resolve(this.input.get("i") || "");
        const outFile = path.resolve(this.input.get("o") || "");
        const ignores = this.input.get("ignore", "").split(",");

        this.checkInFile(inFile);
        this.checkOutFile(outFile);

        const handle = new GernerateGoService(this.app);

        handle.generateFromDir(inFile, outFile, ignores);
    }
}
