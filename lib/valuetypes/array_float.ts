import { TypeValueTarget, ValueTypeInterface } from "../../types";
import { toFloat } from "../value";

export default class TypeArrayFloat implements ValueTypeInterface {
    getName() {
        return "array_float";
    }

    toValue(target: TypeValueTarget, value: string) {
        switch (target) {
            case "json":
                return value
                    .split("|")
                    .filter((v) => v != "")
                    .map(toFloat);
            case "gostruct":
                return "[]float32";
        }
    }
}
