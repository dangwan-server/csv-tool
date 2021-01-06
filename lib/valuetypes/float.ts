import { TypeValueTarget, ValueTypeInterface } from "../../types";
import { toFloat } from "../value";

export default class TypeFloat implements ValueTypeInterface {
    getName() {
        return "float";
    }

    toValue(target: TypeValueTarget, value: string) {
        switch (target) {
            case "json":
                return toFloat(value);
            case "gostruct":
                return "float32";
        }
    }
}
