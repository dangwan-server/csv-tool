import { Application } from ".";

export interface Inputable {
    get(name: string, def?: string): string;
    getByIndex(index: number): string;
    len(): number;
    getNumber(name: string): number;
}

export interface HanldeInterface {
    bootstrap(): void;
    run(input: Inputable, app: Application): void;
}
