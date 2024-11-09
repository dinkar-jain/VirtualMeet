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
    const streamStateRef = useRef<{ stream: MediaStream | null, isCreating: boolean }>({ stream: null, isCreating: false })

    const [roomId, setRoomId] = useState<string | null>(null)
    const [game, setGame] = useState<Phaser.Game | null>(null)
    const [username, setUsername] = useState<string | null>(null)
    const [webRTCInstances, setWebRTCInstances] = useState<{ playerId: string, webRTCInstance: RTCPeerConnection }[]>([])

    function stopMediaTracks(stream: MediaStream) {
        stream.getTracks().forEach(track => track.stop())
        streamStateRef.current.stream = null
    }

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
            setGame(currentGameInstance)

            initialiseWebRTC(setRoomId, setWebRTCInstances, streamStateRef)
        })
    }, [username])

    useEffect(() => {
        if (game) {
            game.registry.set("roomId", roomId)
        }
    }, [roomId])

    async function handleWebRTCInstancesChange() {
        game?.registry.set("isWebRTCConnected", false)
        setRoomId(null)

        while (streamStateRef.current.isCreating) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        if (streamStateRef.current.stream) stopMediaTracks(streamStateRef.current.stream)
    }

    useEffect(() => {
        if (webRTCInstances.length === 0) {
            handleWebRTCInstancesChange()
        }
        else {
            game?.registry.set("isWebRTCConnected", true)
        }
    }, [webRTCInstances])

    return (
        <>
            <ToastContainer />
            {username ?
                <>
                    <div id="app" className={`min-h-screen`} />
                    <div id="videos" className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
                        <video
                            id="localVideo"
                            className={`w-60 h-48 rounded shadow-lg ${webRTCInstances.length === 0 ? "hidden" : ""}`}
                            autoPlay
                            playsInline
                        />
                    </div>
                </>
                :
                <LandingPage setUsername={setUsername} />
            }
        </>
    )
}

export default App