import { argv, exit } from "process";
import { safariBooksModulePath } from "../utils";
import { spawn } from 'child_process'

if(argv.length < 3) {
    console.error('Must specify book id')
    exit(1)
}

const ls = spawn(
    './safaribooks.py',
    ["--kindle", argv[2]],
    {cwd: safariBooksModulePath('')}
);

ls.stdout.on("data", (data: unknown) => {
    console.log(`stdout: ${data}`);
});

ls.stderr.on("data", (data: unknown) => {
    console.log(`stderr: ${data}`);
});

ls.on('error', (error: Error) => {
    console.log(`error: ${error.message}`);
});

ls.on("close", (code: number) => {
    console.log(`child process exited with code ${code}`);
});
