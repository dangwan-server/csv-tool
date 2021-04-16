import Variables from "./variables";

export default class Coder {
    generate(template: string, variables: Variables) {
        let result = template;

        variables.keys().map((key) => {
            result = result.replace(new RegExp(`\\{\\$${key}\\}`, "gms"), variables.get(key));
        });

        return result;
    }
}
