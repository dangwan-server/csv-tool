import Variables from "./variables";

type TypeTargetCode = "go" | "lua" | "gofunbody" | "gogetter";

export default class Coder {
    getTemplateContent(lang: TypeTargetCode) {
        switch (lang) {
            case "lua":
                return `
local key = "{$cache_key}"
{$list}
`;
            case "go":
                return `package {$package} 

type {$name} struct {
{$prototype}
}
`;
            case "gofunbody":
                return `func Get{$name}(id string) *{$name}{
	result := GetStruct("{$cat_name}", id, &{$name}{})
	if result == nil {
		return nil
	}

	return result.(*{$name})
}
`;
            case "gogetter":
                return `package {$package} 

{$funcs}
`;
            default:
                return "not support";
        }
    }

    generate(lang: TypeTargetCode, variables: Variables) {
        let result = this.getTemplateContent(lang);

        variables.keys().map((key) => {
            result = result.replace(new RegExp(`\\{\\$${key}\\}`, "gms"), variables.get(key));
        });

        return result;
    }
}
