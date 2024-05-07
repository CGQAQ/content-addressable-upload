import {NextRequest} from "next/server";
import {createHash} from "node:crypto";
import {mkdir, writeFile} from "node:fs/promises";
import {Readable} from "node:stream";
import {getPathFromHash, fileExists, type FileMeta} from "@/app/api/utils";

export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
    let hasher = createHash("sha256");
    try {
        const form = await req.formData();
        const file = form.get("file");
        if (!file) {
            return new Response(JSON.stringify({error: "file is not found"}), {
                status: 400,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        if (typeof file === "string") {
            return new Response(JSON.stringify({error: "file is not a file"}), {
                status: 400,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        const originalFileName = file.name;
        const originalFileExtension = originalFileName.split(".").pop() ?? "";
        const originalFileType = file.type;
        const originalFileSize = file.size;
        const originalFileLastModified = file.lastModified;

        // hash the file content, and write it to the disk
        const reader = file.stream().getReader();
        while (true) {
            const {done, value} = await reader.read();

            if (value) {
                hasher.update(value);
            }

            if (done) {
                break;
            }
        }
        const sha256 = hasher.digest("hex");

        if (fileExists(sha256)) {
            return new Response(JSON.stringify({
                success: true,
                data: {
                    sha256,
                    originalFileName,
                    originalFileExtension,
                    originalFileType,
                    originalFileSize,
                    originalFileLastModified
                } as FileMeta
            }), {
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        const {base, content, meta} = getPathFromHash(sha256);
        try {
            await mkdir(base, {recursive: true});
        } catch (e) {
            // ignore
        }

        await writeFile(content, Readable.fromWeb(file.stream() as any), {flag: "wx"});
        await writeFile(meta, JSON.stringify({
            sha256,
            originalFileName,
            originalFileExtension,
            originalFileType,
            originalFileSize,
            originalFileLastModified
        } as FileMeta));

        return new Response(JSON.stringify({
            success: true,
            data: {
                sha256,
                originalFileName,
                originalFileExtension,
                originalFileType,
                originalFileSize,
                originalFileLastModified,
            } as FileMeta
        }), {
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({
            success: false,
            error: e.message
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
}


