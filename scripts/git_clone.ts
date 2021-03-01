import HanldeAbstract from "../lib/handle";
import path from "path";
import { isDir } from "../lib/func";

export default class Git extends HanldeAbstract {
    handle() {
        const workDir = path.resolve(this.input.get("o", ""));
        const addr = "git@gitee.com:dangwan-server";

        if (!isDir(workDir)) {
            throw new Error("out必须是目录");
        }

        const packges = ["common", "gateway", "hero", "package", "pb", "map", "master", "account"];

        const workSpaceCommon = `cd ${workDir}`;

        packges.forEach((pkName) => {
            const cloneCommon = `git clone ${addr}/${pkName}.git`;
        });
    }
}
