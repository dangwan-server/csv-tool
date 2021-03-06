import { TypeValueTarget, ValueTypeInterface } from "../../types";
import { toInt } from "../value";

export default class TypeInt implements ValueTypeInterface {
    getName() {
        return "int";
    }

    toValue(target: TypeValueTarget, value: string) {
        switch (target) {
            case "json":
                return toInt(value);
            case "gostruct":
                return "int32";
        }
    }
}
