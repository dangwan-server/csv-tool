import Path from "../lib/path";
import TypeManager from "../lib/typemanager";

export type Application = {
    path: Path;
    typeManager: TypeManager;
};

export type TypeValueTarget = "gostruct" | "json";

export interface ValueTypeInterface {
    getName(): string;
    toValue(target: TypeValueTarget, value: string): void;
}
