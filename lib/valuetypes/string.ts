import { TypeValueTarget, ValueTypeInterface } from "../../types";

export default class TypeString implements ValueTypeInterface {
    getName() {
        return "string";
    }

    toValue(target: TypeValueTarget, value: string) {
        switch (target) {
            case "json":
                return value == "0" ? "" : value;
            case "gostruct":
                return "string";
        }
    }
}
