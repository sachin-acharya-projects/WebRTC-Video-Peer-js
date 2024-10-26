declare namespace Express {
    export interface Response {
        renderHTML: (file: string, options?: Record<string, any>) => void
    }
}
