import glob from "tiny-glob";

import { UPLOAD_BASE } from "@/app/api/utils";
import { resolve, sep } from "node:path";

import { promises as fs } from "node:fs";

export async function GET() {
    const base = resolve(UPLOAD_BASE);
    const globPattern = (base + sep + "**" + sep + "META.json").replaceAll("\\", "/");
    const files = await glob(globPattern);

    const allContents = files.map((meta) => {
        const abs = resolve(meta);
        return fs.readFile(abs, { encoding: "utf-8" }).then((content) => {
            return JSON.parse(content);
        });
    });

    return new Response(JSON.stringify({
        success: true,
        data: await Promise.all(allContents)
    }), {
        headers: {
            "Content-Type": "application/json"
        }
    });
}
