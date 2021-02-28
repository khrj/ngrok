import { exists, join, readLines, TypedCustomEvent, TypedEventTarget } from "./deps.ts"

type Events = {
    status: Deno.ProcessStatus
    stdout: string
    stderr: string
    ready: string
}

interface NgrokOptions {
    protocol: string
    port: number
    region?: string
    subdomain?: string
    authtoken?: string
    extraArgs?: string[]
}

export class Ngrok extends TypedEventTarget<Events> {
    private instance: Deno.Process<{
        cmd: [string, ...string[]]
        stdout: "piped"
        stderr: "piped"
    }>

    private constructor(bin: string, args: string[]) {
        super()

        this.instance = Deno.run({
            cmd: [bin, ...args],
            stdout: "piped",
            stderr: "piped",
        })

        this.handleStdout()
        this.handleStderr()
        this.handleStatus()
    }

    static async create(options: NgrokOptions) {
        const homeDir: string = (Deno.env.get("HOME") || Deno.env.get("userprofile"))!
        const zip = join(homeDir, ".ngrok-deno", "ngrok.zip")
        const cacheDir = join(homeDir, ".ngrok-deno")
        const bin = join(homeDir, ".ngrok-deno", "ngrok")
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

        if (!(await exists(bin))) {
            await Deno.mkdir(cacheDir, { recursive: true })
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

            await Deno.remove(zip)
        }

        const args: string[] = []
        args.push(options.protocol, "--log=stdout")
        if (options.region) args.push(`--region=${options.region}`)
        if (options.subdomain) args.push(`--subdomain=${options.subdomain}`)
        if (options.authtoken) args.push(`--authtoken="${options.authtoken}"`)
        if (options.extraArgs) args.push(...options.extraArgs)
        args.push(options.port.toString())

        return new Ngrok(bin, args)
    }

    destroy(code?: number) {
        this.instance.kill(code || 15)
    }

    private async handleStdout() {
        const ready = /started tunnel.*:\/\/(.*)/
        let readyEventSent = false

        for await (const line of readLines(this.instance.stdout)) {
            this.dispatchEvent(new TypedCustomEvent("stdout", { detail: line }))

            if (!readyEventSent) {
                const isReady = line.match(ready)
                if (isReady) {
                    readyEventSent = true
                    this.dispatchEvent(new TypedCustomEvent("ready", { detail: isReady[1] }))
                }
            }
        }
    }

    private async handleStderr() {
        for await (const line of readLines(this.instance.stderr)) {
            this.dispatchEvent(new TypedCustomEvent("stderr", { detail: line }))
        }
    }

    private async handleStatus() {
        this.dispatchEvent(new TypedCustomEvent("status", { detail: await this.instance.status() }))
    }
}
