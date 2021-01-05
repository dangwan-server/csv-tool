import container from "./register";
import Script from "./lib/script";
import Input from "./lib/input";
import Path from "./lib/path";
import path from "path";

declare var process: any;

const runner = new Script(container);
const input = new Input(process.argv);

try {
    runner.run(input, {
        path: new Path(path.resolve(__dirname, "data")),
    });
} catch (error) {
    console.warn(error.toString());
}
