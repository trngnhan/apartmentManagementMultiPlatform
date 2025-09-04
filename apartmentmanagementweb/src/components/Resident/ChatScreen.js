import React, { useEffect, useState, useRef } from "react";
import { getDatabase, ref, onValue, push } from "firebase/database";
import { authApis, endpoints } from "../../configs/Apis";
import "../../firebase/Configs"; // Đảm bảo đã import để khởi tạo firebase

const database = getDatabase();

function ChatScreen() {
    const [chatRoomId, setChatRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [adminInfo, setAdminInfo] = useState(null);
    const messagesEndRef = useRef(null);

    // Lấy user hiện tại và adminId
    const user = JSON.parse(localStorage.getItem("user"));
    const currentUserId = user?.id;
    const adminId = 1;

    // Tìm hoặc tạo phòng chat
    useEffect(() => {
        if (!currentUserId || !adminId) return;
        const roomsRef = ref(database, "chatRooms");
        onValue(roomsRef, (snapshot) => {
            const allRooms = snapshot.val() || {};
            let foundRoom = null;
            Object.entries(allRooms).forEach(([roomId, room]) => {
                if (room.residentId === currentUserId && room.adminId === adminId) {
                    foundRoom = { ...room, id: roomId };
                }
            });
            if (foundRoom) {
                setChatRoomId(foundRoom.id);
            } else {
                // Tạo phòng mới
                const newRoomRef = push(roomsRef, {
                    residentId: currentUserId,
                    adminId: adminId,
                    createdAt: Date.now()
                });
                setChatRoomId(newRoomRef.key);
            }
        });
    }, [currentUserId, adminId]);

    // Lấy tin nhắn
    useEffect(() => {
        if (!chatRoomId) return;
        const messagesRef = ref(database, `messages/${chatRoomId}`);
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const msgs = snapshot.val() || {};
            const msgList = Object.values(msgs).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            setMessages(msgList);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [chatRoomId]);

    // Lấy thông tin admin
    useEffect(() => {
        const fetchAdmin = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const api = authApis(token);
                const res = await api.get(endpoints.admin);
                setAdminInfo(res.data);
            } catch {}
        };
        fetchAdmin();
    }, [adminId]);

    // Tự động scroll xuống cuối khi có tin nhắn mới
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Gửi tin nhắn
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatRoomId) return;
        const msg = {
            text: newMessage,
            senderId: currentUserId,
            timestamp: Date.now()
        };
        await push(ref(database, `messages/${chatRoomId}`), msg);
        setNewMessage("");
    };

    if (loading) return <div style={{ textAlign: "center", marginTop: 40 }}>Đang tải phòng chat...</div>;

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
            {/* Header */}
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
                <span style={{
                    display: "inline-block",
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#fff",
                    overflow: "hidden",
                    marginRight: 10
                }}>
                    <img
                        src={adminInfo?.avatar_url || user?.profile_picture || "/assets/user.png"}
                        alt="Bạn"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                </span>
                <span>Chat với quản trị viên</span>
            </div>

            {/* Danh sách tin nhắn */}
            <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 24px 12px 24px",
                background: "#f8fafc"
            }}>
                {messages.length === 0 ? (
                    <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>Chưa có tin nhắn nào.</div>
                ) : (
                    messages.map((msg, idx) => {
                        const isSender = msg.senderId === currentUserId;
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

            {/* Nhập tin nhắn */}
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

export default ChatScreen;