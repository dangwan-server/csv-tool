export default class Variables {
    private collection: { [key: string]: any } = {};

    set(key: string, val: any) {
        this.collection[key] = val;
    }

    isExists(key: string) {
        return this.collection[key] != null;
    }

    get(key: string) {
        return this.collection[key];
    }

    keys() {
        return Object.keys(this.collection);
    }
}
