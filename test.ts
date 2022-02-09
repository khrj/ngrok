import { assertEquals, serve } from "./deps.ts"
import { Ngrok } from "./mod.ts"

const exchange = "hi"
const port = 8080

Deno.test({
    name: "Create and destroy instance",
    fn: async () => {
        const ngrok = await Ngrok.create({
            protocol: "http",
            port,
        })

        await new Promise<void>(resolve => {
            ngrok.addEventListener("ready", () => {
                ngrok.destroy().then(() => {
                    resolve()
                })
            })
        })
    },
})

Deno.test({
    name: "Self HTTP Request",
    fn: async () => {
        const controller = new AbortController()
        const server = serve((_req) => new Response(exchange), { port, signal: controller.signal })
        
        const ngrok = await Ngrok.create({
            protocol: "http",
            port,
        })

        const ip = await new Promise(resolve => {
            ngrok.addEventListener("ready", (event) => {
                resolve(event.detail)
            }, { once: true })
        })

        const response = await fetch(`https://${ip}`).then(r => r.text())
        assertEquals(response, exchange)

        await ngrok.destroy()
        controller.abort()
        await server
    },
})
