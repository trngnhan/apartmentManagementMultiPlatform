import React, { useEffect, useState, useRef } from "react";
import { ref, push, onValue } from "firebase/database";
import { useLocation, useNavigate } from "react-router-dom";
import { database2 } from "../../firebase/Configs";
import { chatServiceLockers } from "../../firebase/ChatServices"; // Đảm bảo đã export đúng

function AdminChatLocker() {
    const navigate = useNavigate();
    const location = useLocation();
    const { lockerId, adminId, residentId, note } = location.state || {};
    const [roomId, setRoomId] = useState(null);
    const [sending, setSending] = useState(true);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [noteSent, setNoteSent] = useState(false);
    const messagesEndRef = useRef(null);

    // Tạo hoặc lấy phòng chat locker bằng chatServiceLockers
    useEffect(() => {
        if (!lockerId || !adminId || !residentId) {
            setSending(false);
            return;
        }
        setSending(true);
        chatServiceLockers.createOrGetChatRoom(adminId, residentId, lockerId)
            .then(roomKey => {
                setRoomId(roomKey);
                setSending(false);
            })
            .catch(() => setSending(false));
        // eslint-disable-next-line
    }, [lockerId, adminId, residentId]);

    // Gửi note tự động nếu có
    useEffect(() => {
        if (roomId && note && !noteSent) {
            handleSendMessage(note);
            setNoteSent(true);
        }
        // eslint-disable-next-line
    }, [roomId, note, noteSent]);

    // Lắng nghe tin nhắn
    useEffect(() => {
        if (!roomId) return;
        setLoading(true);
        const messagesRef = ref(database2, `chatRooms/${roomId}/messages`);
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const msgs = snapshot.val() || {};
            const msgList = Object.values(msgs).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            setMessages(msgList);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [roomId]);

    // Tự động scroll xuống cuối khi có tin nhắn mới
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Gửi tin nhắn
    const handleSendMessage = async (msgText) => {
        if (!msgText?.trim() || !roomId) return;
        await push(ref(database2, `chatRooms/${roomId}/messages`), {
            text: msgText,
            senderId: adminId,
            senderRole: "admin",
            timestamp: Date.now()
        });
        setNewMessage("");
    };

    const handleSend = (e) => {
        e.preventDefault();
        handleSendMessage(newMessage);
    };

    if (sending || !roomId) {
        return (
            <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh"
            }}>
                <div className="loader" />
                <div style={{ marginTop: 10 }}>Đang khởi tạo phòng chat...</div>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: 600,
            margin: "40px auto",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px #e0e0e0",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            height: "80vh"
        }}>
            <div style={{
                padding: "18px 28px",
                borderBottom: "1px solid #eee",
                background: "linear-gradient(90deg, #FF6F61 0%, #ffb88c 100%)",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                color: "#fff",
                fontWeight: 700,
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                gap: 14
            }}>
                <span>Chat tủ đồ #{lockerId}</span>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        marginLeft: "auto",
                        background: "rgba(255,255,255,0.2)",
                        border: "none",
                        borderRadius: 8,
                        color: "#fff",
                        padding: "6px 16px",
                        cursor: "pointer"
                    }}
                >Quay lại</button>
            </div>
            <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 24px 12px 24px",
                background: "#f8fafc"
            }}>
                {loading ? (
                    <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                    <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>Chưa có tin nhắn nào.</div>
                ) : (
                    messages.map((msg, idx) => {
                        const isSender = String(msg.senderId) === String(adminId);
                        return (
                            <div
                                key={idx}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: isSender ? "flex-end" : "flex-start",
                                    marginBottom: 12
                                }}
                            >
                                <div style={{
                                    background: isSender ? "#0b93f6" : "#e5e5ea",
                                    color: isSender ? "#fff" : "#222",
                                    borderRadius: 18,
                                    padding: "10px 18px",
                                    maxWidth: "70%",
                                    fontSize: 16,
                                    boxShadow: isSender ? "0 2px 8px #b6e0f7" : "0 1px 4px #e0e0e0"
                                }}>
                                    {msg.text}
                                </div>
                                <div style={{
                                    fontSize: 12,
                                    color: "#888",
                                    marginTop: 4,
                                    marginRight: isSender ? 0 : "auto",
                                    marginLeft: isSender ? "auto" : 0
                                }}>
                                    {msg.timestamp && new Date(msg.timestamp).toLocaleString("vi-VN")}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            <form
                onSubmit={handleSend}
                style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "18px 24px",
                    borderTop: "1px solid #eee",
                    background: "#fff",
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16
                }}
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    style={{
                        flex: 1,
                        fontSize: 16,
                        padding: "12px 16px",
                        borderRadius: 20,
                        border: "1px solid #e0e7ff",
                        outline: "none",
                        background: "#f5f5f5",
                        marginRight: 12
                    }}
                />
                <button
                    type="submit"
                    style={{
                        background: "#0b93f6",
                        color: "#fff",
                        border: "none",
                        borderRadius: 20,
                        padding: "10px 28px",
                        fontWeight: 600,
                        fontSize: 16,
                        cursor: "pointer",
                        transition: "background 0.2s"
                    }}
                >
                    Gửi
                </button>
            </form>
        </div>
    );
}

export default AdminChatLocker;