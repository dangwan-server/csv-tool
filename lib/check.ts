import { ValueTypeInterface } from "../types";
import TypeInvalid from "./valuetypes/invalid";

export function checkType(typeConver: ValueTypeInterface, msg: string) {
    if (typeConver instanceof TypeInvalid) {
        console.log(msg);
    }
}
