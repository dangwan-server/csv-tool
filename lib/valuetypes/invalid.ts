import { TypeValueTarget, ValueTypeInterface } from "../../types";

export default class TypeInvalid implements ValueTypeInterface {
    getName() {
        return "invalid";
    }

    toValue(target: TypeValueTarget, value: string) {
        switch (target) {
            case "json":
                return value;
            case "gostruct":
                return "string";
        }
    }
}
