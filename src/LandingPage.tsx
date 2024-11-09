import { Users, Video, Mic, Zap, Camera, CheckCircle2, XCircle, ArrowDown, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify';

export default function LandingPage({ setUsername }: { setUsername: (username: string) => void }) {
    const [name, setName] = useState('')

    const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
    const [micPermission, setMicPermission] = useState<boolean | null>(null)
    const isChecking = cameraPermission === null || micPermission === null

    const handleJoinOffice = (e: React.FormEvent) => {
        e.preventDefault()

        if (!cameraPermission || !micPermission) {
            toast.error('Please grant camera and microphone permissions to continue.')
            return
        }
        setUsername(name)
    }

    const requestPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            stream.getTracks().forEach(track => track.stop())
        } catch (error) {
            console.error(error)
        }
    }

    const checkPermissions = async () => {
        setCameraPermission(null)
        setMicPermission(null)

        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setTimeout(() => {
            setCameraPermission(cameraPermission.state === 'granted')
            setMicPermission(micPermission.state === 'granted')
        }, 1000)
    }

    useEffect(() => {
        requestPermissions().then(checkPermissions)
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <header className="container mx-auto px-4 py-6 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-blue-400" />
                    <span className="text-2xl font-bold">VirtualMeet</span>
                </div>
                <Button
                    onClick={() => window.scrollTo({ top: document.getElementById('permissions')?.offsetTop, behavior: 'smooth' })}
                    variant="secondary" className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white">
                    Check Permissions <ArrowDown className="h-4 w-4" />
                </Button>
            </header>

            <main>
                <section className="container mx-auto px-4 py-20 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Your Virtual Office, <span className="text-blue-400">Reimagined</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                        Connect with your team in a virtual space that feels just like your real office. Collaborate, communicate, and create together, no matter where you are.
                    </p>
                    <form onSubmit={handleJoinOffice} className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
                        <Input
                            type="text"
                            placeholder="Enter your username"
                            className="max-w-xs bg-gray-800 border-gray-700 text-white"
                            value={name}
                            onChange={(e) => setName(e.target.value.trim())}
                            required
                        />
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            Join Virtual Office
                        </Button>
                    </form>
                </section>

                <section id="features" className="container mx-auto px-4 py-20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
                        Why Choose VirtualMeet?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Video className="h-12 w-12 text-blue-400" />}
                            title="Crystal Clear Video"
                            description="Experience high-quality video calls that make you feel like you're in the same room."
                        />
                        <FeatureCard
                            icon={<Mic className="h-12 w-12 text-blue-400" />}
                            title="Spatial Audio"
                            description="Hear conversations naturally, just like in a real office environment."
                        />
                        <FeatureCard
                            icon={<Zap className="h-12 w-12 text-blue-400" />}
                            title="Instant Collaboration"
                            description="Jump into conversations seamlessly as you move around the virtual office."
                        />
                    </div>
                </section>

                <section id="permissions" className="container mx-auto px-4 py-20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
                        Experience Our Virtual Office
                    </h2>
                    <div className="relative max-w-4xl mx-auto aspect-video rounded-lg overflow-hidden">
                        <div className="absolute inset-0 bg-gray-800 border-2 border-gray-700">
                            <div className="absolute top-4 left-4 flex space-x-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>

                            {/* <div className="grid grid-cols-3 gap-4 p-8 h-full">
                                <div className="bg-gray-700 rounded-lg"></div>
                                <div className="bg-gray-700 rounded-lg"></div>
                                <div className="bg-gray-700 rounded-lg"></div>
                                <div className="bg-gray-700 rounded-lg"></div>
                                <div className="bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Users className="h-12 w-12 text-white" />
                                </div>
                                <div className="bg-gray-700 rounded-lg"></div>
                                <div className="bg-gray-700 rounded-lg"></div>
                                <div className="bg-gray-700 rounded-lg"></div>
                                <div className="bg-gray-700 rounded-lg"></div>
                            </div> */}

                            <div className="flex flex-col items-center justify-center h-full space-y-8">
                                <h3 className="text-2xl font-semibold mb-4">Device Permissions</h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <PermissionStatus
                                        icon={<Camera className="h-12 w-12" />}
                                        label="Camera"
                                        status={cameraPermission}
                                    />
                                    <PermissionStatus
                                        icon={<Mic className="h-12 w-12" />}
                                        label="Microphone"
                                        status={micPermission}
                                    />
                                </div>
                                <p className="hidden sm:block text-center text-gray-400 max-w-md">
                                    Make sure to grant camera and microphone permissions for the best VirtualMeet experience.
                                </p>
                                <Button
                                    onClick={checkPermissions}
                                    disabled={isChecking}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                                >
                                    {isChecking ? 'Checking...' : 'Recheck Permissions'}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <p className="text-center mt-6 text-lg text-gray-400">
                        Move around the virtual office and connect with your teammates instantly.
                    </p>
                </section>
            </main>

            <footer className="bg-gray-900 py-12">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2 mb-4 md:mb-0">
                        <Users className="h-6 w-6 text-blue-400" />
                        <span className="text-xl font-bold">VirtualMeet</span>
                    </div>
                    <Button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        variant="secondary"
                    >
                        Back to Top <ArrowUp className="h-4 w-4" />
                    </Button>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="flex justify-center mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    )
}

function PermissionStatus({ icon, label, status }: { icon: React.ReactNode; label: string; status: boolean | null }) {
    return (
        <div className="flex flex-col items-center space-y-2">
            <div className="p-4 bg-gray-700 rounded-full">{icon}</div>
            <span className="font-medium">{label}</span>
            {status === null ? (
                <span className="text-yellow-400">Checking...</span>
            ) : status ? (
                <span className="text-green-400 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Granted
                </span>
            ) : (
                <span className="text-red-400 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" /> Denied
                </span>
            )}
        </div>
    )
}