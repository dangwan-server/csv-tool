import { newTabExecute } from "../command/terminal";
import { isDir } from "../lib/func";
import HanldeAbstract from "../lib/handle";

export default class OpenServer extends HanldeAbstract {
    handle() {
        //const workDir = path.resolve(this.input.get("o", ""));
        const workDir = "/Users/lixingbo/golang/company/dangwan/kapai";
        const inputService = this.input.get("s", "gateway");
        const services = inputService.replace(/\s+/g, ",").split(",");

        if (!isDir(workDir)) {
            throw new Error("out必须是目录");
        }

        if (services.length == 0) {
            throw new Error("缺少参数:[s]服务名称");
        }

        const scripts = services.map((v) => {
            return `${workDir}/${v} && go run main.go`;
        });

        newTabExecute(scripts).subscribe({
            error: (e: any) => {
                console.log(e);
            },
            next: (v: any) => {},
        });
    }
}
