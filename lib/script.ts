import Container from "./container";
import { Inputable } from "../types/handle.d";
import { Application } from "../types";

export default class Script {
    container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    run(input: Inputable, app: Application) {
        this.check(input);
        const appName = String(input.getByIndex(0));
        const handle = this.make(appName);

        console.log("服务：", appName);

        handle.run(input, app);
    }

    check(input: Inputable) {
        if (input.len() < 1) {
            throw new Error("argc >= 1");
        }
    }

    make(appName: string) {
        if (!this.container.isExists(appName)) {
            const msg = [`[${appName}]不存在`, `你是否找的是:\n[${this.container.keys().join("]\n[")}]`];
            console.warn(msg.join("\n"));

            throw new Error(`${appName}不存在`);
        }

        return this.container.get(appName);
    }
}
