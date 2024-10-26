import express from "express"
import http from "http"
import { Server } from "socket.io"
import { v4 as uuidV4 } from "uuid"
import { createServer as createViteServer } from "./utils/vite-server"

const app = express()
const server = http.createServer(app)
const io = new Server(server)
await createViteServer(app)

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static(`${__dirname}/public`))

app.get("/", (_, response) => {
    response.redirect(`/${uuidV4()}`)
})

app.get("/:room", (request, response) => {
    response.renderHTML("index", {
        room: request.params.room,
    })
})

io.on("connection", (socket) => {
    console.log("User Connected")
    socket.on("join-room", (roomID, userID) => {
        console.log(`User ${userID} joins room ${roomID}`)
        socket.join(roomID)
        io.to(roomID).emit("user-connected", userID)

        socket.on("disconnect", () => {
            console.log(`User ${userID} Disconnected`)
            io.to(roomID).emit("user-disconnected", userID)
        })
    })
})

const HOST = process.env.HOST || "localhost"
const PORT = parseInt(process.env.PORT || "3000")

server.listen(PORT, () => {
    console.log(`Server Listening on http://${HOST}:${PORT}`)
})
