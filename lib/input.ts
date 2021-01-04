import { Inputable } from "../types/handle.d";

export default class Input implements Inputable {
    private originalArgs: string[] = [];
    private args: { [key: string]: any } = {};

    constructor(args: string[]) {
        this.originalArgs = args.splice(2);

        this.args = this.originalArgs
            .filter((v) => v.indexOf("=") != -1)
            .map((v) => {
                const qualIndex = v.indexOf("=");
                const [name, val] = [v.substr(0, qualIndex), v.substr(qualIndex + 1)];
                return {
                    [name]: val,
                };
            })
            .reduce((prev, v) => {
                return Object.assign(prev, v);
            });

        console.log("入参：", this.args);
    }

    len() {
        return this.originalArgs.length;
    }

    getByIndex(index: number) {
        return this.originalArgs[index];
    }

    get(name: string, def?: string): string {
        return this.args[name] == undefined ? def : this.args[name];
    }

    getNumber(name: string): number {
        return Number(this.get(name));
    }
}
