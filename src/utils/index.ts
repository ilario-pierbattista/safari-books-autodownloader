import path = require("path");

export function safariBooksModulePath(subPath: string): string {
    return path.join(__dirname, '../../safaribooks', subPath)
}
