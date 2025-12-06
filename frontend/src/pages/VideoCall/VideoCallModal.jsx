import React, { useEffect, useMemo, useRef } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaTimes, FaVideo, FaVideoSlash } from "react-icons/fa";

const VideoCallModal = ({ socket }) => {
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const {
        currentCall,
        incomingCall,
        isCallActive,
        callType,
        localStream,
        remoteStream,
        isVideoEnabled,
        isAudioEnabled,
        peerConnection,
        iceCandidatesQueue,
        isCallModalOpen,
        callStatus,

        setCurrentCall,
        setIncomingCall,
        setCallType,
        setCallModalOpen,
        endCall,
        setCallStatus,
        setCallActive,
        setLocalStream,
        setRemoteStream,
        setPeerConnection,
        addIceCandidate,
        processQueueIceCandidates,
        toggleVideo,
        toggleAudio,
        clearIncomingCall,
    } = useVideoCallStore();

    const { user } = useUserStore();
    const { theme } = useThemeStore();

    const rtcConfiguration = {
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
            {
                urls: "stun:stun1.l.google.com:19302",
            },
            {
                urls: "stun:stun2.l.google.com:19302",
            },
        ],
    };

    //Memorize display the user info and it is prevent the unnesseccry re-render
    const displayInfo = useMemo(() => {
        if (incomingCall && !isCallActive) {
            return {
                name: incomingCall.callerName,
                avatar: incomingCall.callerAvatar,
            };
        } else if (currentCall) {
            return {
                name: currentCall.participantName,
                avatar: currentCall.participantAvatar,
            };
        }
        return null;
    }, [incomingCall, currentCall, isCallActive]);

    useEffect(() => {
        if (peerConnection && remoteStream) {
            console.log("Both peer connection and remote stream is avaiable");
            setCallStatus("connected");
            setCallActive(true);
        }
    }, [peerConnection, remoteStream, setCallStatus, setCallActive]);

    //Set up local video stream when local stream change
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    //Set up remote video stream when remote stream change
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Initilize media stream
    const initializeMedia = async (video = true) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: video ? { width: 640, height: 480 } : false,
                audio: true,
            });
            console.log("Local media stream ", stream.getTracks());
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.log("Media error", error);
            throw error;
        }
    };

    // Create peer connection
    const createPeerConnection = (stream, role) => {
        const pc = new RTCPeerConnection(rtcConfiguration);

        // Add local tracks immediatly
        if (stream) {
            stream.getTracks().forEach((track) => {
                console.log(`${role} adding ${track.kind} track`, track.id.slice(0, 8));
            });
        }

        //Handle ice candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                const participantId = currentCall?.participantId || incomingCall?.callerId;
                const callId = currentCall?.callId || incomingCall?.callId;

                if (participantId && callId) {
                    socket.emit("webrtc_ice_candidate", {
                        candidate: event.candidate,
                        receiverId: participantId,
                        callId: callId,
                    });
                }
            }
        };

        //Handle remote stream
        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            } else {
                const stream = new MediaStream();
                stream.addTrack(event.track);
                setRemoteStream(stream);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Role: ${role} : connection state`, pc.connectionState);
            if (pc.connectionState === "failed") {
                setCallStatus("failed");
                setTimeout(handleEndCall, 2000);
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`${role} : ICE state`, pc.iceConnectionState);
        };

        pc.onsignalingstatechange = () => {
            console.log(`${role} : Signaling state`, pc.signalingState);
        };

        setPeerConnection(pc);
        return pc;
    };

    // Caller: Initialize call after accepttance
    const initializeCallerCall = async () => {
        try {
            setCallStatus("connecting");
            const stream = localStream || (await initializeMedia(callType === "video"));

            //get media
            // const stream = await initializeMedia(callType === "video");

            //create peer connection with offer
            const pc = createPeerConnection(stream, "CALLER");

            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: callType === "video",
            });

            await pc.setLocalDescription(offer);

            socket.emit("webrtc_offer", {
                offer,
                receiverId: currentCall?.participantId,
                callId: currentCall?.callId,
            });
        } catch (error) {
            console.error("Caller Error", error);
            setCallStatus("failed");
            setTimeout(handleEndCall, 2000);
        }
    };

    // Receiver: Answer call
    const handleAnswerCall = async () => {
        try {
            setCallStatus("connecting");

            //get media
            const stream = await initializeMedia(callType === "video");

            //create peer connection with offer
            const pc = createPeerConnection(stream, "RECEIVER");

            socket.emit("accept_call", {
                callerId: incomingCall?.callerId,
                callId: incomingCall?.callId,
                receiverInfo: {
                    username: user?.name,
                    profilePicture: user?.profilePicture,
                },
            });

            setCurrentCall({
                callId: incomingCall?.callId,
                participantId: incomingCall?.callerId,
                participantName: incomingCall?.callerName,
                participantAvatar: incomingCall?.callerAvatar,
            });

            clearIncomingCall();
        } catch (error) {
            console.error("Receiver Error", error);
            handleEndCall();
        }
    };

    const handleRejectCall = () => {
        if (incomingCall) {
            socket.emit("reject_call", {
                callerId: incomingCall?.callerId,
                callId: incomingCall?.callId,
            });
        }
        endCall();
    };

    //Handle End call
    const handleEndCall = () => {
        const participantId = currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;

        if (participantId && callId) {
            socket.emit("end_call", {
                callId: callId,
                participantId: participantId,
            });
        }
    };

    useEffect(() => {
        if (!socket) return;

        //call accepted start caller flow
        const handleCallAccepted = ({ receiverName }) => {
            if (currentCall) {
                // setTimeout(() => {
                //     initializeCallerCall();
                // }, 500);
                initializeCallerCall();
            }
        };

        const handleCallRejected = () => {
            setCallStatus("rejected");
            setTimeout(endCall, 500);
        };

        const handleCallEnded = () => {
            endCall();
        };

        const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
            if (!peerConnection) return;

            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

                //process queued ICE candidate
                await processQueueIceCandidates();

                //create answer
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                socket.emit("webrtc_answer", {
                    answer,
                    receiverId: senderId,
                    callId,
                });

                console.log("Receiver: Answer send waiting for ice candidates");
            } catch (error) {
                console.error("Receiver offer error", error);
            }
        };

        //Receiver answer (caller)
        const handleWebRTCAnswer = async ({ answer, senderId, callId }) => {
            if (!peerConnection) return;

            if (peerConnection.signalingState === "closed") {
                console.log("Caller: Peer connection is closed");
                return;
            }

            try {
                // current caller signing
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

                // process queued the ICE candidate
                await processQueueIceCandidates();

                //check receiver
                const receivers = peerConnection.getReceivers();
                console.log("Receiver", receivers);
            } catch (error) {
                console.error("Caller anser error", error);
            }
        };

        //Receiver ICE candidates
        const handleWebRTCIceCandidates = async ({ candidate, senderId }) => {
            if (peerConnection && peerConnection.signalingState !== "closed") {
                if (peerConnection.remoteDescription) {
                    try {
                        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                        console.log("ICE candidate added");
                    } catch (error) {
                        console.log("ICE candidate error", error);
                    }
                } else {
                    console.log("Queuing ice candidates");
                    addIceCandidate(candidate);
                }
            }
        };

        //Register all events listeners

        socket.on("call_accepted", handleCallAccepted);
        socket.on("call_rejected", handleCallRejected);
        socket.on("call_ended", handleCallEnded);
        socket.on("webrtc_offer", handleWebRTCOffer);
        socket.on("webrtc_answer", handleWebRTCAnswer);
        socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates);

        console.log("Socket listeners registers");
        return () => {
            socket.off("call_accepted", handleCallAccepted);
            socket.off("call_rejected", handleCallRejected);
            socket.off("call_ended", handleCallEnded);
            socket.off("webrtc_offer", handleWebRTCOffer);
            socket.off("webrtc_answer", handleWebRTCAnswer);
            socket.off("webrtc_ice_candidate", handleWebRTCIceCandidates);
        };
    }, [socket, peerConnection, currentCall, incomingCall, user]);

    if (!isCallModalOpen && !incomingCall) return null;

    const shouldShowActiveCall = isCallActive || callStatus === "calling" || callStatus === "connecting";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div
                className={`relative w-full h-full max-w-4xl max-h-3xl rounded-lg overflow-hidden ${
                    theme === "dark" ? "bg-gray-900" : "bg-white"
                }`}
            >
                {/* Incoming Call UI */}
                {incomingCall && !isCallActive && (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                        <div className="mb-8 text-center">
                            <div className="w-32 h-32 mx-auto mb-4 overflow-hidden bg-gray-300 rounded-full">
                                <img
                                    src={displayInfo?.avatar}
                                    alt={displayInfo?.name}
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                        e.target.src = "/placeholder.svg";
                                    }}
                                />
                            </div>
                            <h2
                                className={`text-2xl font-semibold mb-2 ${
                                    theme === "dark" ? "text-white" : "text-gray-900"
                                }`}
                            >
                                {displayInfo?.name}
                            </h2>
                            <p className={`text-lg ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                Incoming {callType} call...
                            </p>
                        </div>
                        <div className="flex space-x-6">
                            <button
                                onClick={handleRejectCall}
                                className="flex items-center justify-center w-16 h-16 text-white bg-red-500 rounded-full hover:bg-red-600 transition-color"
                            >
                                <FaPhoneSlash className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleAnswerCall}
                                className="flex items-center justify-center w-16 h-16 text-white bg-green-500 rounded-full hover:bg-green-600 transition-color"
                            >
                                <FaVideo className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Active Call UI */}
                {shouldShowActiveCall && (
                    <div className="relative w-full h-full">
                        {callType === "video" && (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className={`w-full h-full object-cover bg-gray-800 ${
                                    remoteStream ? "block" : "hidden"
                                }`}
                            ></video>
                        )}

                        {/* Avatar/Status display */}
                        {(!remoteStream || callType !== "video") && (
                            <div className="flex items-center justify-center w-full h-full bg-gray-800">
                                <div className="text-center">
                                    <div className="w-32 h-32 mx-auto mb-4 overflow-hidden bg-gray-600 rounded-full">
                                        <img
                                            src={displayInfo.avatar}
                                            alt={displayInfo?.name}
                                            className="object-cover w-full h-full"
                                            onError={(e) => {
                                                e.target.src = "/placeholder.svg";
                                            }}
                                        />
                                    </div>
                                    <p className="text-xl text-white">
                                        {callStatus === "calling"
                                            ? `Calling ${displayInfo?.name}...`
                                            : callStatus === "connecting"
                                            ? "Connecting..."
                                            : callStatus === "connected"
                                            ? displayInfo?.name
                                            : callStatus === "failed"
                                            ? "Connection failed"
                                            : displayInfo?.name}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Local video (picture in picture) */}
                        {callType === "video" && localStream && (
                            <div className="absolute w-48 overflow-hidden bg-gray-800 border-2 border-white rounded-lg top-4 right-4 h-36">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="object-cover w-full h-full"
                                ></video>
                            </div>
                        )}
                        {/* Call status */}
                        <div className="absolute top-4 left-4">
                            <div
                                className={`px-4 py-2 rounded-full ${
                                    theme === "dark" ? "bg-gray-800" : "bg-white"
                                } bg-opacity-75`}
                            >
                                <p className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    {callStatus === "connected" ? "Connected" : callStatus}
                                </p>
                            </div>
                        </div>

                        {/* Call Controls */}
                        <div className="absolute transform -translate-x-1/2 bottom-8 left-1/2">
                            <div className="flex space-x-4">
                                {callType === "video" && (
                                    <button
                                        onClick={toggleVideo}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                                            isVideoEnabled
                                                ? "bg-gray-600 hover:bg-gray-700 text-white"
                                                : "bg-red-500 hover:bg-red-600 text-white"
                                        }`}
                                    >
                                        {isVideoEnabled ? (
                                            <FaVideo className="w-5 h-5" />
                                        ) : (
                                            <FaVideoSlash className="w-5 h-5" />
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={toggleAudio}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                                        isAudioEnabled
                                            ? "bg-gray-600 hover:bg-gray-700 text-white"
                                            : "bg-red-500 hover:bg-red-600 text-white"
                                    }`}
                                >
                                    {isAudioEnabled ? (
                                        <FaMicrophone className="w-5 h-5" />
                                    ) : (
                                        <FaMicrophoneSlash className="w-5 h-5" />
                                    )}
                                </button>
                                <button
                                    onClick={handleEndCall}
                                    className="flex items-center justify-center w-12 h-12 text-white bg-red-500 rounded-full hover:bg-red-600 transition-color"
                                >
                                    <FaPhoneSlash className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {callStatus === "calling" && (
                    <button
                        onClick={handleEndCall}
                        className="absolute flex items-center justify-center w-8 h-8 text-white bg-gray-500 rounded-full top-4 right-4 hover:bg-gray-600 transition-color"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default VideoCallModal;
