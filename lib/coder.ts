import Variables from "./variables";
import fs from "fs";

export default class Coder {
    getTemplateContent(templatePath: string) {
        return fs.readFileSync(templatePath, {
            encoding: "utf-8",
        });
    }

    generate(templatePath: string, variables: Variables) {
        let result = this.getTemplateContent(templatePath);

        variables.keys().map((key) => {
            result = result.replace(new RegExp(`\\{\\$${key}\\}`, "gms"), variables.get(key));
        });

        return result;
    }
}
