import { TypeValueTarget, ValueTypeInterface } from "../../types";
import { toInt } from "../value";

export default class TypeArrayInt implements ValueTypeInterface {
    getName() {
        return "array_int";
    }

    toValue(target: TypeValueTarget, value: string) {
        switch (target) {
            case "json":
                return value == "0"
                    ? []
                    : value
                          .split("|")
                          .filter((v) => v != "")
                          .map(toInt);
            case "gostruct":
                return "[]int";
        }
    }
}
