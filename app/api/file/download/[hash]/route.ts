import {NextRequest} from "next/server";

import {fileExists, getPathFromHash, type FileMeta} from "@/app/api/utils";
import fs from "node:fs/promises";
import {createReadStream} from "node:fs"
import {Readable} from "node:stream";

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest, {params}: { params: { hash: string } }) {
    const {hash} = params;
    if (typeof hash !== "string") {
        return new Response("Invalid hash", {status: 400});
    }

    if (!fileExists(hash)) {
        return new Response(JSON.stringify({
            success: false,
            error: "File not found"
        }), {status: 404});
    }

    const {content, meta} = getPathFromHash(hash);

    const metaContent = JSON.parse(await fs.readFile(meta, {encoding: "utf-8"})) as FileMeta;
    const fileStream = Readable.toWeb(createReadStream(content));

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${metaContent.originalFileName}"`);
    headers.set("Content-Type", metaContent.originalFileType);
    headers.set("Content-Length", metaContent.originalFileSize.toString());
    for (let key in metaContent) {
        headers.set(`X-Troila-Meta-${key}`, metaContent[key as keyof typeof metaContent].toString() ?? "");
    }
    return new Response(fileStream as any, {headers});
}