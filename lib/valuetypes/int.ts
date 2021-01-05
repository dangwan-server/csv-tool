import { TypeValueTarget, ValueTypeInterface } from "../../types";

export default class TypeInt implements ValueTypeInterface {
    getName() {
        return "int";
    }

    toValue(target: TypeValueTarget, value: string) {
        switch (target) {
            case "json":
                return isNaN(parseInt(value)) ? value : parseInt(value);
            case "gostruct":
                return "int32";
        }
    }
}
