import { Application } from "../types";
import { HanldeInterface, Inputable } from "../types/handle.d";

export default abstract class HanldeAbstract implements HanldeInterface {
    protected input!: Inputable;
    protected app!: Application;

    bootstrap() {}

    run(input: Inputable, app: Application) {
        this.input = input;
        this.app = app;
        this.bootstrap();
        this.handle();
    }

    abstract handle(): void;
}
