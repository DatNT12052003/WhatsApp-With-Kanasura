import React, { useRef, useState } from "react";
import { FaCheck, FaCheckDouble, FaPlus, FaRegCopy, FaSmile } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { format } from "date-fns";
import useOutSideClick from "../../hooks/useOutSideClick";
import EmojiPicker from "emoji-picker-react";
import { RxCross2 } from "react-icons/rx";

const MessageBubble = ({ message, theme, onReact, currentUser, deleteMessage }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const messageRef = useRef(null);
    const [showOptions, setShowOptions] = useState(false);
    const optionRef = useRef();

    const emojiPickerRef = useRef();
    const reactionMenuRef = useRef();
    const isUserMessage = message.sender._id === currentUser?._id;

    const bubbleClass = isUserMessage ? "chat-end" : "chat-start";
    const bubbleContentClass = isUserMessage
        ? `chat-bubble md:max-w-[50%] ${theme === "dark" ? "bg-[#144d38] text-white" : "bg-[#d9fdd3] text-black"}`
        : `chat-bubble md:max-w-[50%] min-w-[130px] ${
              theme === "dark" ? "bg-[#144d38] text-white" : "bg-white text-black"
          }`;

    const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🫩", "🥰"];
    // const quickReactions = ["❤️", "❤️", "❤️", "❤️", "❤️", "❤️"];

    const handleReact = (emoji) => {
        onReact(message._id, emoji);
        setShowReactions(false);
        setShowOptions(false);
    };

    useOutSideClick(emojiPickerRef, () => {
        if (showEmojiPicker) setShowEmojiPicker(false);
    });

    useOutSideClick(reactionMenuRef, () => {
        if (showReactions) setShowReactions(false);
    });

    useOutSideClick(optionRef, () => {
        if (showOptions) setShowOptions(false);
    });

    if (message === 0) return;
    return (
        <div className={`chat ${bubbleClass}`}>
            {/* <div class="chat-header">
                <time class="text-xs opacity-50">{format(new Date(message.createdAt), "HH:mm")}</time>
            </div> */}
            <div className={`${bubbleContentClass} relative group flex items-center gap-2`} ref={messageRef}>
                {message.contentType === "text" && <p className="mr-2 break-words">{message.content}</p>}
                {message.contentType === "image" && (
                    <div>
                        <img
                            src={message.imageOrVideoUrl}
                            alt="image-video"
                            className="max-w-xs rounded-lg max-h-[500px]"
                        />
                        <p className="mt-1">{message.content}</p>
                    </div>
                )}
                {message.contentType === "video" && (
                    <div>
                        <video
                            src={message.imageOrVideoUrl}
                            alt="image-video"
                            className="max-w-xs rounded-lg  max-h-[500px]"
                            controls
                        ></video>
                        <p className="mt-1">{message.content}</p>
                    </div>
                )}
                <div className="flex items-center self-end justify-end gap-1 mt-2 ml-2 text-xs opacity-60">
                    <span>{format(new Date(message.createdAt), "HH:mm")}</span>
                    {isUserMessage && (
                        <>
                            {message.messageStatus === "send" && <FaCheck size={12} />}
                            {message.messageStatus === "delivered" && (
                                <FaCheckDouble size={12} className="text-blue-900" />
                            )}
                        </>
                    )}
                </div>
                <div className="absolute z-20 transition-opacity opacity-0 top-1 right-1 group-hover:opacity-100">
                    <button
                        onClick={() => setShowOptions((prev) => !prev)}
                        className={`p-1 rounded-full ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                    >
                        <HiDotsVertical size={18} />
                    </button>
                </div>
                <div
                    className={`absolute ${
                        isUserMessage ? "-left-10" : "-right-10"
                    } top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity  flex flex-col gap-2`}
                >
                    <button
                        onClick={() => setShowReactions(!showReactions)}
                        className={`p-2 rounded-full ${
                            theme === "dark" ? "bg-[#202c33] hover:bg-[#202c33]/80" : "bg-white hover:bg-gray-100"
                        } shadow-lg`}
                    >
                        <FaSmile className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`} />
                    </button>
                </div>

                {showReactions && (
                    <div
                        ref={reactionMenuRef}
                        className={`absolute -top-8 ${
                            isUserMessage ? "left-8" : "left-36"
                        } transform -translate-x-1/2 flex items-center hover:bg-[#202c33]/90 rounded-full px-2 py-1.5 gap-1 shadow-lg z-50`}
                    >
                        {quickReactions.map((emoji, index) => (
                            <button
                                key={index}
                                onClick={() => handleReact(emoji)}
                                className="p-1 transition-transform hover:scale-125"
                            >
                                {emoji}
                            </button>
                        ))}
                        <div className="w-[1px] h-5 bg-gray-600 mx-1" />
                        <button
                            className="hover:bg-[#ffffff1a] rounded-full p-1"
                            onClick={() => setShowEmojiPicker(true)}
                        >
                            <FaPlus className="w-4 h-4 text-gray-300" />
                        </button>
                    </div>
                )}
                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute left-0 z-50 mb-6">
                        <div className="relative">
                            <EmojiPicker onEmojiClick={(emojiObject) => handleReact(emojiObject.emoji)} theme={theme} />
                            <button
                                onClick={() => setShowEmojiPicker(false)}
                                className="absolute text-gray-500 top-2 right-2 hover:text-gray-700"
                            >
                                <RxCross2 />
                            </button>
                        </div>
                    </div>
                )}
                {message.reactions && message.reactions.length > 0 && (
                    <div
                        className={`absolute -bottom-5 ${isUserMessage ? "right-2" : "left-2"} ${
                            theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200"
                        } rounded-full px-2 shadow-md`}
                    >
                        {message.reactions.map((reaction, index) => (
                            <span key={index} className="mr-1">
                                {reaction.emoji}
                            </span>
                        ))}
                    </div>
                )}
                {showOptions && (
                    <div
                        ref={optionRef}
                        className={`absolute top-8 right-1 z-50 w-36 rounded-xl shadow-lg py-2 text-sm ${
                            theme === "dark" ? "bg-[#1d1f1f] text-white" : "bg-gray-100 text-black"
                        }`}
                    >
                        <button
                            onClick={() => {
                                if (message.contentType === "text") {
                                    navigator.clipboard.writeText(message.content);
                                }
                                setShowOptions(false);
                            }}
                            className="flex items-center w-full gap-3 px-4 py-2 rounded-lg"
                        >
                            <FaRegCopy size={14} />
                            <span>Copy</span>
                        </button>
                        {isUserMessage && (
                            <button
                                onClick={() => {
                                    deleteMessage(message?._id);
                                    setShowOptions(false);
                                }}
                                className="flex items-center w-full gap-3 px-4 py-2 text-red-600 rounded-lg"
                            >
                                <FaRegCopy className="text-red-600" size={14} />
                                <span>Delete</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
