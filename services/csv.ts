import { App } from "../types/handle";
import fs from "fs";
import path from "path";

export default class CsvService {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    getAllCsvs(): any[] {
        const csvPath = this.app.path.csvPath();

        return fs
            .readdirSync(csvPath)
            .filter((v) => path.extname(v) == ".csv")
            .map((v) => path.parse(v).name);
    }

    getItemList(csvName: string): any[] {
        const jsonPath = this.app.path.jsonPath(csvName);

        const content = fs.readFileSync(jsonPath, {
            encoding: "utf-8",
        });

        return JSON.parse(content);
    }

    isParsed(catName: string) {
        const findCatName = this.getAllCsvs().find((v) => v == catName);

        return findCatName != undefined;
    }

    getConfig(): any {
        const content =
            fs.readFileSync(this.app.path.configPath(), {
                encoding: "utf-8",
            }) || "{}";

        return JSON.parse(content);
    }
}
