import React, { useEffect, useState } from "react";
import { Card, Typography, Spin, Alert, List } from "antd";
import { useLocation } from "react-router-dom";
import { getDatabase, ref, onValue } from "firebase/database";
import { database2 } from "../../firebase/Configs";

const { Title, Text } = Typography;

function NotificationScreen() {
    const location = useLocation();
    // Lấy params từ location.state hoặc localStorage
    const currentUserId = location.state?.currentUserId || JSON.parse(localStorage.getItem("user") || "{}").id;
    const adminId = location.state?.adminId || JSON.parse(localStorage.getItem("user") || "{}").admin_id;
    const lockerId = location.state?.lockerId || JSON.parse(localStorage.getItem("user") || "{}").locker_id;

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUserId || !adminId || !lockerId) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const roomId = `${adminId}_${currentUserId - 1}_${lockerId}`;
        console.log("Room ID for notifications:", roomId);
        const notificationsRef = ref(database2, `chatRooms/${roomId}/messages`);
        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const notiArr = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                setNotifications(notiArr);
            } else {
                setNotifications([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUserId, adminId, lockerId]);

    return (
        <div
            style={{
                maxWidth: 600,
                margin: "40px auto",
                padding: 24,
                background: "linear-gradient(135deg, #fff 60%, #FFBAC3 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
                minHeight: 400,
            }}
        >
            <Title level={3} style={{ color: "#FF6F61", textAlign: "center", marginBottom: 18 }}>
                Thông báo tủ đồ
            </Title>
            {loading ? (
                <div style={{ textAlign: "center", margin: "40px 0" }}>
                    <Spin size="large" />
                </div>
            ) : notifications.length === 0 ? (
                <Alert message="Không có thông báo nào." type="info" showIcon />
            ) : (
                <List
                    dataSource={notifications}
                    renderItem={item => (
                        <Card
                            style={{
                                marginBottom: 16,
                                borderRadius: 8,
                                boxShadow: "0 2px 8px #e0e0e0",
                                background: "#fff"
                            }}
                        >
                            <Text strong style={{ fontSize: 16 }}>
                                {item.senderRole === "admin" ? "Thông báo về tủ đồ" : "Tin nhắn"}
                            </Text>
                            <br />
                            <Text style={{ fontSize: 15 }}>{item.text}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.timestamp ? new Date(item.timestamp).toLocaleString("vi-VN") : ""}
                            </Text>
                        </Card>
                    )}
                />
            )}
        </div>
    );
}

export default NotificationScreen;