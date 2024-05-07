import { resolve } from "node:path";
import { statSync } from "node:fs";

export const UPLOAD_BASE = process.env["UPLOAD_BASE"] ?? "";
if (UPLOAD_BASE.length === 0) {
    throw new Error("UPLOAD_BASE is not defined");
}

const CONTENT_FILE_NAME = "CONTENT.bin";
const META_FILE_NAME = "META.json";

export type FileMeta = {
    sha256: string;
    originalFileName: string;
    originalFileExtension: string;
    originalFileType: string;
    originalFileSize: number;
    originalFileLastModified: number;
};

export function getPathFromHash(hash: string): {
    base: string;
    content: string;
    meta: string;
} {
    const base = resolve(UPLOAD_BASE, hash.slice(0, 3), hash.slice(3));
    return {
        base,
        content: resolve(base, CONTENT_FILE_NAME),
        meta: resolve(base, META_FILE_NAME)
    };
}

export function fileExists(hash: string): boolean {
    const { content, meta } = getPathFromHash(hash);
    try {
        return statSync(content).isFile() && statSync(meta).isFile();
    } catch (e) {
        return false;
    }
}