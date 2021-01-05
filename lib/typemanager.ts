import { ValueTypeInterface } from "../types";
import TypeString from "./valuetypes/array_string";

export default class TypeManager {
    private typeconvert: { [key: string]: ValueTypeInterface } = {};
    private defaultType!: ValueTypeInterface;

    constructor() {
        this.defaultType = new TypeString();
    }

    register(typeconvert: ValueTypeInterface) {
        this.typeconvert[typeconvert.getName()] = typeconvert;
    }

    getType(row: { type: string; value: string }) {
        return this.typeconvert[row.type] ? this.typeconvert[row.type] : this.defaultType;
    }
}
