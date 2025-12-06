import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";
import { FaChevronCircleLeft, FaChevronCircleRight, FaChevronDown, FaEye, FaTimes, FaTrash } from "react-icons/fa";

const StatusPreview = ({ contact, currentIndex, onClose, onPrev, onNext, onDelete, theme, currentUser, loading }) => {
    const [progress, setProgress] = useState(0);
    const [showViewers, setShowViewers] = useState(false);

    const currentStatus = contact?.statuses[currentIndex];
    const isOwnerStatus = contact?.id === currentUser?._id;

    useEffect(() => {
        setProgress(0);
        let current = 0;

        const interval = setInterval(() => {
            current += 2;
            setProgress(current);
            if (current >= 100) {
                clearInterval(interval);
                onNext();
            }
        }, 100);
        return () => clearInterval(interval);
    }, [currentIndex]);

    const handleViewersToggle = () => {
        setShowViewers(!showViewers);
    };

    const handleDeleteStatus = () => {
        if (onDelete && currentStatus?.id) {
            onDelete(currentStatus.id);
        }
        if (contact.statuses.length === 1) {
            onClose();
        } else {
            onPrev();
        }
    };

    if (!currentStatus) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 w-full h-full bg-black bg-opacity-90 z-50 flex items-center justify-center`}
            style={{ backdropFilter: "blur(5px)" }}
            onClick={onClose}
        >
            <div
                className="relative flex items-center justify-center w-full h-full max-w-4xl mx-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`w-full h-full ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-800"} relative`}>
                    <div className="absolute top-0 left-0 right-0 z-10 flex justify-between gap-1 p-4">
                        {contact?.statuses.map((_, index) => (
                            <div
                                key={index}
                                className="flex-1 h-1 overflow-hidden bg-gray-400 bg-opacity-50 rounded-full"
                            >
                                <div
                                    className="h-full transition-all duration-100 ease-linear bg-white rounded-full"
                                    style={{
                                        width:
                                            index < currentIndex
                                                ? "100%"
                                                : index === currentIndex
                                                ? `${progress}%`
                                                : "0%",
                                    }}
                                ></div>
                            </div>
                        ))}
                    </div>
                    <div className="absolute z-10 flex items-center justify-between top-8 left-4 right-16">
                        <div className="flex items-center space-x-3">
                            <img
                                src={contact?.avatar}
                                alt={contact?.name}
                                className="object-cover w-10 h-10 border-2 border-white rounded-full"
                            />
                            <div>
                                <p className="font-semibold text-white">{contact?.name}</p>
                                <p className="text-sm text-gray-300">{formatTimestamp(currentStatus.timestamp)}</p>
                            </div>
                        </div>
                        {/* Status actions */}
                        {isOwnerStatus && (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleDeleteStatus}
                                    className="p-2 text-white transition-all bg-red-500 rounded-full bg-opacity-70 hover:bg-opacity-90"
                                >
                                    <FaTrash className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-center w-full h-full">
                        {currentStatus.contentType === "text" ? (
                            <div className="p-8 text-center text-white">
                                <p className="text-2xl font-medium">{currentStatus.media}</p>
                            </div>
                        ) : currentStatus.contentType === "image" ? (
                            <img
                                src={currentStatus.media}
                                alt="image"
                                className="object-contain max-w-full max-h-full"
                            />
                        ) : currentStatus.contentType === "video" ? (
                            <video
                                src={currentStatus.media}
                                controls
                                autoPlay
                                className="object-contain max-w-full max-h-full"
                            ></video>
                        ) : null}
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute z-10 p-3 text-white transition-all bg-black bg-opacity-50 rounded-full top-4 right-4 hover:bg-opacity-70"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                    {currentIndex > 0 && (
                        <button
                            onClick={onPrev}
                            className="absolute p-3 text-white transition -translate-y-1/2 bg-black bg-opacity-50 rounded-full left-4 top-1/2 hover:bg-opacity-70"
                        >
                            <FaChevronCircleLeft className="w-5 h-5" />
                        </button>
                    )}
                    {currentIndex < contact.statuses.length - 1 && (
                        <button
                            onClick={onNext}
                            className="absolute p-3 text-white transition -translate-y-1/2 bg-black bg-opacity-50 rounded-full right-4 top-1/2 hover:bg-opacity-70"
                        >
                            <FaChevronCircleRight className="w-5 h-5" />
                        </button>
                    )}
                    {isOwnerStatus && (
                        <div className="absolute bottom-4 left-4 right-4">
                            <button
                                onClick={handleViewersToggle}
                                className="flex items-center justify-between w-full px-4 py-2 text-white transition-all bg-black bg-opacity-50 rounded-lg hover:bg-opacity-70"
                            >
                                <div className="flex items-center space-x-2">
                                    <FaEye className="w-4 h-4" />
                                    <span>{currentStatus?.viewers.length}</span>
                                </div>
                                <FaChevronDown
                                    className={`h-4 w-4 transition-transform ${showViewers ? "rotate-180" : ""}`}
                                />
                            </button>
                            <AnimatePresence>
                                {showViewers && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 mt-2 overflow-y-auto rounded-lg bg-bg-black bg-opacity-70 max-h-40"
                                    >
                                        {loading ? (
                                            <p className="text-center text-white">Loading Viewers</p>
                                        ) : currentStatus.viewers.length > 0 ? (
                                            <div className="space-y-2">
                                                {currentStatus?.viewers.map((viewer) => (
                                                    <div key={viewer?._id} className="flex items-center space-x-3">
                                                        <img
                                                            src={viewer.profilePicture}
                                                            alt={viewer.username}
                                                            className="object-cover w-8 h-8 rounded-full"
                                                        />
                                                        <span className="text-white">{viewer.username}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center text-white">No Viewers Yet</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default StatusPreview;
