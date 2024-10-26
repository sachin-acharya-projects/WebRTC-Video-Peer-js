import { MediaConnection, Peer, StreamConnection } from "peerjs"
import { io } from "socket.io-client"
import "../styles/style.css"

const socket = io("/")
const peer = new Peer({
    host: "/",
    port: 5000,
})

let videoGrid: HTMLVideoElement | null = document.querySelector(".video-grid")
const peers: Record<string, MediaConnection> = {}
//@ts-expect-error ROOM_ID_ is retrived from upper script tag.
const ROOM_ID = ROOM_ID_

window.onload = () => {
    // DOM Selection
    if (!videoGrid) videoGrid = document.querySelector(".video-grid")
    const answerCallButton: HTMLDivElement =
        document.querySelector(".answer-btn")!
    const callButton: HTMLDivElement = document.querySelector(".call-btn")!
    const joinButton: HTMLDivElement = document.querySelector(".join-btn")!

    joinButton.addEventListener("click", () => {
        if (!peer.id) return
        socket.emit("join-room", ROOM_ID, peer.id)
        joinButton.style.display = "none"
    })

    // Retriving User Media
    navigator.mediaDevices
        .getUserMedia({
            audio: true,
            video: true,
        })
        .then((stream) => {
            const video_el = document.createElement("video")
            video_el.muted = true
            addVideoStream(video_el, stream)

            if (peer.id) socket.emit("join-room", ROOM_ID, peer.id)
            else joinButton.style.display = "block"

            socket.on("user-connected", (userID) => {
                if (userID !== peer.id) {
                    console.log(`New user ${userID} connected`)
                    callButton.style.display = "block"

                    const handleCall = () => {
                        connectNewUser(userID, stream)
                    }
                    callButton.addEventListener("click", handleCall)
                }
            })

            socket.on("user-disconnected", (userID: string) => {
                console.log(`User ${userID} disconnected`)
                if (peers[userID]) peers[userID].close()
            })

            peer.on("call", (call) => {
                console.log("Incomming Call")
                if (stream) {
                    answerCallButton.style.display = "block"
                    const handleAnswerCall = () => {
                        console.log("Answering the User Call")
                        const video_el = document.createElement("video")
                        call.answer(stream)

                        call.on("stream", (remoteStream) => {
                            console.log("Remote Stream Obtained.")
                            addVideoStream(video_el, remoteStream)
                        })

                        call.on("error", (error) => {
                            console.error(error)
                        })

                        call.on("close", () => {
                            console.log("Call has been closed")
                            video_el.remove()
                        })
                        answerCallButton.style.display = "none"
                    }
                    answerCallButton.addEventListener("click", handleAnswerCall)
                }
            })
        })
        .catch((error) => {
            console.error("Cannot access the User Media.", error)
        })
}

function connectNewUser(userID: string, stream: MediaStream) {
    if (userID && stream) {
        const video_el = document.createElement("video")
        const call = peer.call(userID, stream)

        call.on("stream", (remoteStream) => {
            console.log("Remote Stream Obtained")
            addVideoStream(video_el, remoteStream)
            const callBtn: HTMLButtonElement =
                document.querySelector(".call-btn")!
            callBtn.style.display = "none"
        })

        call.on("error", (error) => {
            console.error(
                `Cannot call user ${userID} due to following error: `,
                error
            )
        })

        call.on("close", () => {
            console.log("Call has been closed")
            video_el.remove()
        })

        peers[userID] = call
    }
}

function addVideoStream(video_el: HTMLVideoElement, stream: MediaStream) {
    if (stream) {
        // Just in case
        video_el.muted = true
        video_el.srcObject = stream
        video_el.addEventListener("loadedmetadata", () => {
            video_el.play()
        })

        if (videoGrid) videoGrid.append(video_el)
    }
}
