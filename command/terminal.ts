import { createObservable } from "./../utils/observe";
import { exec, execFile, spawn } from "child_process";

type execResult = {
    err?: Error | null;
    out?: string;
    stderr?: string;
};

interface spawnShellAction {
    (sp: { stdin: { write: (content: string) => {} } }): void;
}

interface resultFunction {
    (result: execResult, isComplete?: boolean): void;
}

function hasError(err: any) {
    return err != null && err != undefined;
}

function when(isOk: Boolean, doIt: Function) {
    isOk && doIt();
}

function exeuteFile(file: string, args?: string[]) {
    return executeToObservable((onReturn) =>
        execFile(file, args, (err, out, stderr) => {
            onReturn({ err, out, stderr }, true);
        })
    );
}

function executeToObservable(execteableCaller: (_: resultFunction) => {}) {
    return createObservable((p: any) => {
        const producer = {
            next: p.next,
            error: p.error,
            complete: p.complete ? p.complete : () => {},
        };

        execteableCaller(({ out, err, stderr }, isComplete) => {
            if (isComplete) {
                producer.complete("");
            }

            if (!hasError(err)) {
                producer.next({ out, stderr: stderr ? stderr : "" });
                return;
            }

            when(hasError(err || stderr), () => producer.error(err || stderr));
        });
    });
}

export function newTabExecute(commands: string[]) {
    const scriptLine = commands
        .map((v) => {
            return `do script "${v}"`;
        })
        .join("\n");

    const command = `osascript <<EOF
    tell app "Terminal"
    ${scriptLine}
    end tell 
EOF`;

    return execute(command);
}

function exeuteOnStdout(onReturn: resultFunction, data: string) {
    onReturn({
        out: data.toString(),
    });
}

function exeuteOnStderr(onReturn: resultFunction, data: string) {
    onReturn({
        out: data.toString(),
    });
}

function exeuteOnClose(onReturn: resultFunction, code: number) {
    if (code != 0) {
        console.warn("close code :", code);
    }

    onReturn(
        {
            out: "",
            stderr: "",
        },
        true
    );
}

function executeOnError(onReturn: resultFunction, err: Error) {
    onReturn(
        {
            err,
            out: "",
            stderr: "",
        },
        true
    );
}

export function executeSpawnShell(actionHandle: spawnShellAction) {
    return executeToObservable((onReturn): any => {
        const sp = spawn("bash");

        sp.stdout.on("data", (data) => exeuteOnStdout(onReturn, data));

        sp.stderr.on("data", (data) => exeuteOnStderr(onReturn, data));

        sp.on("close", (code: number) => exeuteOnClose(onReturn, code));

        sp.on("error", (err) => executeOnError(onReturn, err));

        actionHandle(sp);

        sp.stdin.end();
    });
}

export function execute(command: string) {
    return executeToObservable((onReturn): any => {
        exec(command, (err, out, stderr) => {
            onReturn({ err, out, stderr }, true);
        });
    });
}

function openOnWithApp(appPath: string, filePath: string) {
    return execute(`open -a ${appPath} ${filePath}`);
}

function openOnFolder(dir: string) {
    return execute(`open ${dir}`);
}

const Terminal = {
    openOnWithApp,
    openOnFolder,
    execute,
    exeuteFile,
    newTabExecute,
    executeSpawnShell,
};

export default Terminal;
