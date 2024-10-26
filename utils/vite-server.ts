import { createServer as createViteServer } from "vite"
import { Express } from "express"
import path from "node:path"
import fs from "node:fs"

export async function createServer(app: Express) {
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "custom",
    })

    app.use(vite.middlewares)

    app.response.renderHTML = async function (
        file: string,
        data?: Record<string, any>
    ) {
        const request = this.req
        const response = this
        const url = request.originalUrl
        try {
            if (!file.endsWith(".html")) file = file.trim() + ".html"

            let template = fs.readFileSync(path.resolve("views", file), "utf-8")
            template = await vite.transformIndexHtml(url, template)
            template = replacePlaceholders(template, data)

            response
                .status(200)
                .set({ "Content-Type": "text/html" })
                .end(template)
        } catch (e) {
            console.error(e)
            vite.ssrFixStacktrace(e as Error)
        }
    }
    return vite
}

function replacePlaceholders(template: string, data?: Record<string, any>) {
    if (!data) return template
    return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
        return key in data || {} ? String(data[key]) : match // Return the matched string if key not found
    })
}
