import fs from "fs";

export default class GenerateCode {
    replace(oldContent: string, body: string, sign: string) {
        const limitCon = new Array(6).fill("-").join("");
        const reg = new RegExp(`//${limitCon}${sign}_start(.+)//${limitCon}${sign}_end`, "ms");
        const target = `//${limitCon}${sign}_start\n${body}\n//${limitCon}${sign}_end`;

        return oldContent.replace(reg, target);
    }

    generate(fileName: string, body: string, sign: "body" | "message" | "service"): { ok: boolean; msg?: string } {
        if (!fs.existsSync(fileName)) {
            return { ok: false, msg: "文件不存在" };
        }

        const oldContent = fs.readFileSync(fileName, {
            encoding: "utf-8",
        });

        fs.writeFileSync(fileName, this.replace(oldContent, body, sign), {
            encoding: "utf-8",
        });

        return { ok: true };
    }
}
