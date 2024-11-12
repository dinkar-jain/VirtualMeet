import { maxConnections } from "./Constants";
import { MutableRefObject } from "react";
import { toast } from 'react-toastify';
import { socket } from "./socket";

const iceCandidateQueue = new Map();
const servers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.l.google.com:5349" },
        { urls: "stun:stun1.l.google.com:3478" },
        { urls: "stun:stun1.l.google.com:5349" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:5349" },
        { urls: "stun:stun3.l.google.com:3478" },
        { urls: "stun:stun3.l.google.com:5349" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:5349" }
    ]
}

async function mediaStream(playerId: string, webRTCInstance: RTCPeerConnection, isStream: MutableRefObject<{ creating: boolean, created: boolean }>, setLocalStream: any, cb: any) {
    while (isStream.current.creating) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (isStream.current.created) {
        setLocalStream((localStream: MediaStream | null) => {
            localStream?.getTracks().forEach((track) => {
                if (webRTCInstance.signalingState !== "closed") {
                    webRTCInstance.addTrack(track, localStream);
                }
            });
            cb();
            return localStream;
        });
    }
    else {
        isStream.current.creating = true;

        const newAudioAndVideoStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setLocalStream(newAudioAndVideoStream);
        newAudioAndVideoStream.getTracks().forEach((track) => {
            if (webRTCInstance.signalingState !== "closed") {
                webRTCInstance.addTrack(track, newAudioAndVideoStream);
            }
        });
        cb();
    }

    webRTCInstance.ontrack = (event) => {
        document.getElementById(playerId)?.remove();

        const remoteVideo = document.createElement("video") as HTMLVideoElement;

        remoteVideo.id = playerId
        remoteVideo.className = "w-60 h-48 rounded shadow-lg";
        remoteVideo.autoplay = true;
        remoteVideo.playsInline = true;
        remoteVideo.srcObject = event.streams[0];

        document.getElementById("videos")?.appendChild(remoteVideo);
    }
}

async function initialiseWebRTC(setRoomId: any, setWebRTCInstances: any, isStream: MutableRefObject<{ creating: boolean, created: boolean }>, setLocalStream: any) {
    socket.on("connectRequest", (data: { playerId: string }) => {
        setWebRTCInstances((webRTCInstances: { playerId: string, webRTCInstance: RTCPeerConnection }[]) => {
            if (webRTCInstances.length >= maxConnections) {
                socket.emit("roomFull", { playerId: data.playerId });
            }
            else {
                setRoomId((roomId: string | null) => {
                    if (roomId) {
                        socket.emit("connectResponse", { playerId: data.playerId, roomId: roomId });
                        return roomId;
                    } else {
                        const newRoomId = Math.random().toString(36).substring(7);
                        socket.emit("createRoom", { roomId: newRoomId });
                        socket.emit("connectResponse", { playerId: data.playerId, roomId: newRoomId });
                        return newRoomId;
                    }
                })
            }
            return webRTCInstances;
        });
    });

    socket.on("roomFull", (data: { playerId: string }) => {
        toast.info("Room is full", {
            position: "bottom-right",
            autoClose: 2000,
            closeOnClick: true,
            pauseOnHover: true,
        });
    });

    socket.on("connectResponse", (data: { playerId: string, roomId: string }) => {
        socket.emit("joinRoom", { roomId: data.roomId });
        setRoomId(data.roomId);
    })

    socket.on("playerJoined", async (data: { playerId: string }) => {
        const webRTCInstance = new RTCPeerConnection(servers);
        setWebRTCInstances((webRTCInstances: { playerId: string, webRTCInstance: RTCPeerConnection }[]) => {
            return [...webRTCInstances, { playerId: data.playerId, webRTCInstance: webRTCInstance }]
        });

        await mediaStream(data.playerId, webRTCInstance, isStream, setLocalStream, () => {
            if (webRTCInstance.signalingState !== "closed") {
                webRTCInstance.createOffer().then((offer) => {
                    webRTCInstance.setLocalDescription(offer);
                    socket.emit("offer", { offer: offer, playerId: data.playerId });
                })
            }
        });

        webRTCInstance.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("iceCandidate", { candidate: event.candidate, playerId: data.playerId });
            }
        }
    })

    socket.on("offer", async (data: { playerId: string, offer: RTCSessionDescriptionInit }) => {
        const webRTCInstance = new RTCPeerConnection(servers);
        setWebRTCInstances((webRTCInstances: { playerId: string, webRTCInstance: RTCPeerConnection }[]) => {
            return [...webRTCInstances, { playerId: data.playerId, webRTCInstance: webRTCInstance }]
        });

        await mediaStream(data.playerId, webRTCInstance, isStream, setLocalStream, () => {
            if (webRTCInstance.signalingState !== "closed") {
                webRTCInstance.setRemoteDescription(data.offer).then(() => {
                    webRTCInstance.createAnswer().then((answer) => {
                        webRTCInstance.setLocalDescription(answer);
                        socket.emit("answer", { answer: answer, playerId: data.playerId });
                    })
                    // Process queued candidates
                    const candidates = iceCandidateQueue.get(data.playerId) || [];
                    candidates.forEach((candidate: RTCIceCandidate) => {
                        webRTCInstance.addIceCandidate(candidate).catch(error => {
                            console.error("Error adding queued ICE candidate:", error);
                        });
                    });
                    iceCandidateQueue.delete(data.playerId); // Clear the queue
                })
            }
        });

        webRTCInstance.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("iceCandidate", { candidate: event.candidate, playerId: data.playerId });
            }
        }
    })

    socket.on("answer", (data: { playerId: string, answer: RTCSessionDescriptionInit }) => {
        setWebRTCInstances((webRTCInstances: { playerId: string, webRTCInstance: RTCPeerConnection }[]) => {
            const webRTCInstance = webRTCInstances.find((instance) => instance.playerId === data.playerId)?.webRTCInstance;
            if (webRTCInstance) {
                webRTCInstance.setRemoteDescription(data.answer).then(() => {
                    // Process queued candidates
                    const candidates = iceCandidateQueue.get(data.playerId) || [];
                    candidates.forEach((candidate: RTCIceCandidate) => {
                        webRTCInstance.addIceCandidate(candidate).catch(error => {
                            console.error("Error adding queued ICE candidate:", error);
                        });
                    });
                    iceCandidateQueue.delete(data.playerId); // Clear the queue
                }).catch(error => {
                    console.error("Error setting remote description:", error);
                });
            }
            return webRTCInstances;
        })
    });

    socket.on("iceCandidate", (data: { playerId: string, candidate: RTCIceCandidate }) => {
        setWebRTCInstances((webRTCInstances: { playerId: string, webRTCInstance: RTCPeerConnection }[]) => {
            const webRTCInstance = webRTCInstances.find((instance) => instance.playerId === data.playerId)?.webRTCInstance;
            if (webRTCInstance) {
                if (webRTCInstance.remoteDescription) {
                    webRTCInstance.addIceCandidate(data.candidate).catch(error => {
                        console.error("Error adding ICE candidate:", error);
                    });
                } else {
                    // Queue the candidate if the remote description is not set
                    if (!iceCandidateQueue.has(data.playerId)) {
                        iceCandidateQueue.set(data.playerId, []);
                    }
                    iceCandidateQueue.get(data.playerId).push(data.candidate);
                }
            }
            return webRTCInstances;
        });
    });

    socket.on("toExitRoom", (data: { playerId: string }) => {
        if (data.playerId === socket.id) {
            setWebRTCInstances((webRTCInstances: { playerId: string, webRTCInstance: RTCPeerConnection }[]) => {
                webRTCInstances.forEach((instance) => {
                    document.getElementById(instance.playerId)?.remove();
                    instance.webRTCInstance.close();
                });
                return [];
            });
        }
        else {
            setWebRTCInstances((webRTCInstances: { playerId: string, webRTCInstance: RTCPeerConnection }[]) => {
                const webRTCInstance = webRTCInstances.find((instance) => instance.playerId === data.playerId)?.webRTCInstance;
                if (webRTCInstance) {
                    document.getElementById(data.playerId)?.remove();
                    webRTCInstance.close();
                }
                return webRTCInstances.filter((instance) => instance.playerId !== data.playerId)
            })
        }
    });
}

export { initialiseWebRTC };