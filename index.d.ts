interface Inputable {
    get(name: string): void;
    getNumber(name: string): number;
}

interface HanldeInterface {
    bootstrap(): void;
    run(input: Inputable): void;
}
