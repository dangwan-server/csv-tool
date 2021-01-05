import { TypeValueTarget, ValueTypeInterface } from "../../types";

export default class TypeArrayInt implements ValueTypeInterface {
    getName() {
        return "array_int";
    }

    toValue(target: TypeValueTarget, value: string) {
        switch (target) {
            case "json":
                return value
                    .split("|")
                    .filter((v) => v != "")
                    .map((v) => parseInt(v));
            case "gostruct":
                return "[]int";
        }
    }
}
