import container from "./register";
import Script from "./lib/script";
import Input from "./lib/input";
import Path from "./lib/path";
import path from "path";
import TypeManager from "./lib/typemanager";
import TypeArrayString from "./lib/valuetypes/array_string";
import TypeString from "./lib/valuetypes/string";
import TypeInt from "./lib/valuetypes/int";
import TypeArrayInt from "./lib/valuetypes/array_int";
import TypeArrayFloat from "./lib/valuetypes/array_float";
import TypeFloat from "./lib/valuetypes/float";

declare var process: any;

const runner = new Script(container);
const input = new Input(process.argv);
const typeManager = new TypeManager();

typeManager.register(new TypeString());
typeManager.register(new TypeInt());
typeManager.register(new TypeArrayString());
typeManager.register(new TypeArrayInt());
typeManager.register(new TypeFloat());
typeManager.register(new TypeArrayFloat());

try {
    runner.run(input, {
        path: new Path(path.resolve(__dirname, "data")),
        typeManager: typeManager,
    });
} catch (error) {
    console.warn(error.toString());
}
