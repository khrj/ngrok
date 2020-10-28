import { join } from "https://deno.land/std@0.74.0/path/mod.ts"
import { existsSync } from "https://deno.land/std@0.74.0/fs/mod.ts"
import { readLines } from "https://deno.land/std@0.74.0/io/mod.ts";

interface NgrokOptions {
    protocol: string;
    port: number;
    region?: string;
    subdomain?: string;
    authtoken?: string;
    extraArgs?: string[];
}

let ngrok: any;

export function connect (options: NgrokOptions): Promise<string> {
    return new Promise(async (resolve, reject) => {
        const zip = join(Deno.env.get("HOME")!, ".ngrok-deno", "ngrok.zip");
        const cacheDir = join(Deno.env.get("HOME")!, ".ngrok-deno");
        const bin = join(Deno.env.get("HOME")!, ".ngrok-deno", "ngrok")
        const fileURL = ((_) => {
            const arch = Deno.build.os
            const cdn = "https://bin.equinox.io"
            const cdnPath = "/c/4VmDzA7iaHb/ngrok-stable-"
            const cdnFiles = {
                darwin: "darwin-amd64.zip",
                linux: "linux-amd64.zip",
                windows: "windows-amd64.zip",
            }

            const url = cdnFiles[arch]
            if (!url) {
                console.error("ngrok - platform " + arch + " is not supported.")
                Deno.exit()
            }
            return cdn + cdnPath + url
        })()

        if (!existsSync(bin)) {
            Deno.mkdirSync(cacheDir, { recursive: true })
            const file = await Deno.open(zip, { write: true, create: true })
            const res = await fetch(fileURL)

            if (res?.body) {
                for await (const chunk of res.body) {
                    await Deno.writeAll(file, chunk)
                }
            } else {
                throw "Ngrok download URL invalid, open a new issue"
            }

            file.close()

            await Deno.run({
                cmd: Deno.build.os === "windows"
                    ? [
                        "PowerShell",
                        "Expand-Archive",
                        "-Path",
                        zip,
                        "-DestinationPath",
                        cacheDir,
                    ]
                    : ["unzip", zip, "-d", cacheDir],
                stdout: "null",
                stderr: "inherit",
            }).status()

            Deno.removeSync(zip)
        }

        const args: string[] = []
        args.push(options.protocol, "--log=stdout")
        if (options.region) args.push(`--region=${options.region}`)
        if (options.subdomain) args.push(`--subdomain=${options.subdomain}`)
        if (options.authtoken) args.push(`--authtoken="${options.authtoken}"`)
        if (options.extraArgs) args.push(...options.extraArgs)
        args.push(options.port.toString())

        ngrok = Deno.run({
            cmd: [bin, ...args],
            stdout: "piped",
            stderr: "inherit",
        })

        const ready = /started tunnel.*:\/\/(.*)/

        for await (const line of readLines(ngrok.stdout)) {
            const isReady = line.match(ready)
            if (isReady) {
                resolve(isReady[1])
            }
        }

        let status = await ngrok.status()

        if (!status.success) {
            reject(`Error: ngrok exited with code ${status.code}`) // (╯°□°）╯︵ ┻━┻
        }
    })
}

export function disconnect (code?: number) {
    ngrok.kill(code || 15) // Deno.Signal.SIGTERM
}