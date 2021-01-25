import { TypeValueTarget, ValueTypeInterface } from "../../types";

export default class TypeArrayString implements ValueTypeInterface {
    getName() {
        return "array_string";
    }

    toValue(target: TypeValueTarget, value: string) {
        switch (target) {
            case "json":
                return value == "0" ? [] : value.split("|").filter((v) => v != "");
            case "gostruct":
                return "[]string";
        }
    }
}
