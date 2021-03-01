import { ValueTypeInterface } from "../types";
import TypeString from "./valuetypes/array_string";
import TypeInvalid from "./valuetypes/invalid";

export default class TypeManager {
    private typeconvert: { [key: string]: ValueTypeInterface } = {};
    private defaultType!: ValueTypeInterface;

    constructor() {
        this.defaultType = new TypeString();
    }

    register(typeconvert: ValueTypeInterface) {
        this.typeconvert[typeconvert.getName()] = typeconvert;
    }

    getType(row: { type: string; value: string | number }) {
        if (!row.type) {
            return this.defaultType;
        }

        if (!this.typeconvert[row.type]) {
            return new TypeInvalid();
        }

        return this.typeconvert[row.type];
    }
}
