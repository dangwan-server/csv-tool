import Variables from "./variables";
import fs from "fs";

export default class Coder {
    getTemplateContent(lang: "go" | "lua") {
        switch (lang) {
            case "lua":
                return `
local key = "dangwan-kapai-config-2021"
{$list}
`;
            case "go":
                return `
type {$name} struct {

{$prototype}

}
`;
            default:
                return "not support";
        }
    }

    generate(lang: "go" | "lua", variables: Variables) {
        let result = this.getTemplateContent(lang);

        variables.keys().map((key) => {
            result = result.replace(new RegExp(`\\{\\$${key}\\}`, "gms"), variables.get(key));
        });

        return result;
    }
}
