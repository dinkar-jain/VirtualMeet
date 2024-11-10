import { useEffect, useRef, useState } from "react";
import { gameHeight, gameWidth } from "./Constants"
import { Preloader } from "./game/scenes/Preloader"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Office } from "./game/scenes/Office"
import { initialiseWebRTC } from "./WebRTC";
import LandingPage from './LandingPage';
import { socket } from "./socket";
import Phaser from "phaser"

function App() {
    const isStream = useRef<{ creating: boolean, created: boolean }>({ creating: false, created: false })

    const [roomId, setRoomId] = useState<string | null>(null)
    const [game, setGame] = useState<Phaser.Game | null>(null)
    const [username, setUsername] = useState<string | null>(null)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [isWebRTCConnected, setIsWebRTCConnected] = useState<boolean>(false)
    const [webRTCInstances, setWebRTCInstances] = useState<{ playerId: string, webRTCInstance: RTCPeerConnection }[]>([])

    useEffect(() => {
        if (!username) return

        socket.connect()
        socket.on("connect", () => {
            let currentGameInstance = new Phaser.Game({
                parent: "app",
                scene: [Preloader, Office],
                backgroundColor: "#000000",
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                    width: gameWidth,
                    height: gameHeight
                },
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: {
                            x: 0,
                            y: 0
                        },
                        debug: false
                    }
                }
            })
            currentGameInstance.registry.set("name", username)
            currentGameInstance.events.on("isWebRTCConnected", (data: boolean) => { setIsWebRTCConnected(data) })
            setGame(currentGameInstance)

            initialiseWebRTC(setRoomId, setWebRTCInstances, isStream, setLocalStream)
        })
    }, [username])

    useEffect(() => {
        if (game) {
            game.registry.set("roomId", roomId)
        }
    }, [roomId])

    async function stopMediaTracks() {
        localStream?.getTracks().forEach(track => track.stop())
        setLocalStream(null)
    }

    useEffect(() => {
        if (!isWebRTCConnected && localStream) {
            stopMediaTracks()
        }
    }, [isWebRTCConnected, localStream])

    useEffect(() => {
        game?.registry.set("isWebRTCConnected", isWebRTCConnected)
    }, [isWebRTCConnected])

    useEffect(() => {
        if (webRTCInstances.length === 0) {
            setIsWebRTCConnected(false)
            setRoomId(null)
        }
        else {
            setIsWebRTCConnected(true)
        }
    }, [webRTCInstances])

    useEffect(() => {
        isStream.current.creating = false
        isStream.current.created = !!localStream

        const localVideo = document.getElementById("localVideo") as HTMLVideoElement
        if (localVideo) localVideo.srcObject = localStream
    }, [localStream])

    return (
        <>
            <ToastContainer />
            {username ?
                <>
                    <div id="app" className={`min-h-screen`} />
                    <div id="videos" className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
                        <video
                            id="localVideo"
                            className={`w-60 h-48 rounded shadow-lg ${isWebRTCConnected ? localStream ? "" : "bg-black" : "hidden"}`}
                            autoPlay
                            playsInline
                        />
                    </div>
                    <div className={`absolute top-14 left-1/2 transform -translate-x-1/2 z-10 ${isWebRTCConnected && !localStream ? "" : "hidden"}`}>
                        <div className="w-20 h-20 border-2 border-t-8 border-gray-200 rounded-full animate-spin" />
                    </div>
                </>
                :
                <LandingPage setUsername={setUsername} />
            }
        </>
    )
}

export default App