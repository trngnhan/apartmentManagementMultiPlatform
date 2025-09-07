import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Input, Button, Typography, message as antdMessage, Spin } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { ref, push, serverTimestamp, onValue } from "firebase/database";
import { database1 } from "../../firebase/Configs";
import {Avatar} from "antd";

const { Title } = Typography;

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function AdminChat() {
    const { roomId } = useParams();
    const query = useQuery();
    const residentId = query.get("residentId");
    const adminStr = localStorage.getItem("user");
    const adminId = adminStr ? JSON.parse(adminStr).id : null;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const location = useLocation();
    const residentAvatar = location.state?.avatar || null;

    useEffect(() => {
        const messagesRef = ref(database1, `messages/${roomId}`);
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const messagesArray = Object.values(data).sort((a, b) => {
                    const aTime = a.timestamp?.seconds || a.timestamp || 0;
                    const bTime = b.timestamp?.seconds || b.timestamp || 0;
                    return aTime - bTime;
                });
                setMessages(messagesArray);
            } else {
                setMessages([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [roomId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        const messageObj = {
            text: newMessage,
            senderId: adminId,
            timestamp: serverTimestamp(),
        };
        try {
            await push(ref(database1, `messages/${roomId}`), messageObj);
            setNewMessage("");
        } catch (error) {
            antdMessage.error("Lỗi khi gửi tin nhắn!");
        }
    };

    return (
        <div
            style={{
                maxWidth: 700,
                margin: "40px auto",
                padding: 32,
                background: "linear-gradient(135deg, #f8fafc 60%, #e3e6e8 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
                minHeight: 600,
                display: "flex",
                flexDirection: "column",
                height: "80vh"
            }}
        >
            <Title level={4} style={{ textAlign: "center", color: "#1976d2", marginBottom: 24 }}>
                Chat với cư dân
            </Title>
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    marginBottom: 16,
                    padding: "0 8px"
                }}
            >
                {loading ? (
                    <div style={{ textAlign: "center", margin: "40px 0" }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    messages.map((item, idx) => {
                        const isSender = item.senderId === adminId;
                        let timeString = "";
                        if (item.timestamp) {
                            let utcDate;
                            if (typeof item.timestamp === "object" && item.timestamp.seconds) {
                                utcDate = new Date(item.timestamp.seconds * 1000);
                            } else {
                                utcDate = new Date(item.timestamp);
                            }
                            timeString = utcDate.toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false
                            });
                        }
                        return (
                            <div
                                key={idx}
                                style={{
                                    display: "flex",
                                    justifyContent: isSender ? "flex-end" : "flex-start",
                                    alignItems: "flex-end",
                                    marginBottom: 10
                                }}
                            >
                                {!isSender && (
                                    <Avatar
                                        src={residentAvatar || undefined}
                                        style={{ marginRight: 8, background: "#b3c6e0" }}
                                    />
                                )}
                                <div
                                    style={{
                                        background: isSender ? "#1976d2" : "#e2e2e2",
                                        color: isSender ? "#fff" : "#333",
                                        borderRadius: 20,
                                        padding: "12px 18px",
                                        maxWidth: "70%",
                                        boxShadow: "0 2px 8px #e0e0e0",
                                        wordBreak: "break-word",
                                        fontSize: 16,
                                        position: "relative"
                                    }}
                                >
                                    {item.text}
                                    {timeString && (
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: isSender ? "#e0e0e0" : "#666",
                                                marginTop: 6,
                                                textAlign: "right"
                                            }}
                                        >
                                            {timeString}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#fff",
                    borderRadius: 25,
                    boxShadow: "0 2px 8px #e0e0e0",
                    padding: "8px 16px"
                }}
            >
                <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        fontSize: 16,
                        background: "transparent"
                    }}
                    onPressEnter={sendMessage}
                />
                <Button
                    type="primary"
                    shape="circle"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    style={{
                        marginLeft: 10,
                        background: "#1976d2",
                        border: "none"
                    }}
                />
            </div>
        </div>
    );
}

export default AdminChat;