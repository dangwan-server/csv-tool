import { HanldeInterface } from "../types/handle.d";

export default class Container {
    private handles: { [key: string]: HanldeInterface } = {};

    register(name: string, handle: HanldeInterface) {
        if (this.isExists(name)) {
            throw new Error(`${name}已经注册过了`);
        }

        this.handles[name] = handle;
    }

    isExists(name: string) {
        return this.handles.hasOwnProperty(name);
    }

    get(name: string): HanldeInterface {
        return this.handles[name];
    }

    keys() {
        return Object.keys(this.handles);
    }
}
