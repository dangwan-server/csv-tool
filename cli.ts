import container from "./register";
import Script from "./lib/script";
import Input from "./lib/input";
import Path from "./lib/path";

declare var process: any;

const runner = new Script(container);
const input = new Input(process.argv);

runner.run(input, {
    path: new Path("./data"),
});
