import { defineConfig } from "vite"


export default defineConfig({
    build: {
        rollupOptions: {
            input: [
                "./views/index.html"
            ],
        },
        outDir: "dist-client"
    }
})