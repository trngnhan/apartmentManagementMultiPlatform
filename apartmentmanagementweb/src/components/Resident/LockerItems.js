import React, { useEffect, useState } from "react";
import { Card, Typography, Button, Spin, Alert, message } from "antd";
import { useNavigate } from "react-router-dom";
import { endpoints, authApis } from "../../configs/Apis";

const { Title, Paragraph, Text } = Typography;

function LockerItems() {
    const [lockerItems, setLockerItems] = useState([]);
    const [lockerId, setLockerId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adminId, setAdminId] = useState(null);
    const navigate = useNavigate();

    // Hàm lấy adminId cho cư dân hiện tại
    const getAdminIdForResident = async (residentId) => {
        const token = localStorage.getItem("access_token");
        try {
            const api = authApis(token);
            // Nếu endpoint cần residentId, hãy sửa lại endpoint tại đây
            const res = await api.get(endpoints.admin);
            if (res.status === 200) {
                const data = res.data;
                return data.admin_id;
            } else {
                message.error("Không lấy được admin_id.");
                return null;
            }
        } catch (error) {
            message.error("Lỗi khi lấy admin_id.");
            return null;
        }
    };

    useEffect(() => {
        // Lấy lockerId từ localStorage
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setLockerId(user.locker_id);
            // Lấy adminId khi có residentId
            getAdminIdForResident(user.resident_id).then(setAdminId);
        }
    }, []);

    useEffect(() => {
        const fetchLockerItems = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("access_token");
                const userStr = localStorage.getItem("user");
                if (!userStr) {
                    setLockerItems([]);
                    setLoading(false);
                    return;
                }
                const user = JSON.parse(userStr);
                if (!user.locker_id) {
                    setLockerItems([]);
                    setLoading(false);
                    return;
                }
                const api = authApis(token);
                const res = await api.get(endpoints.lockerItems(user.locker_id));
                setLockerItems(res.data || []);
            } catch (error) {
                setLockerItems([]);
            }
            setLoading(false);
        };
        if (lockerId) fetchLockerItems();
    }, [lockerId]);

    const handleNotification = () => {
        const userStr = localStorage.getItem("user");
        let currentUserId = null, lockerIdValue = null;
        if (userStr) {
            const user = JSON.parse(userStr);
            currentUserId = user.id;
            lockerIdValue = user.locker_id;
        }
        // Truyền adminId lấy được từ API
        navigate("/resident/locker-notification", {
            state: { currentUserId, adminId, lockerId: lockerIdValue }
        });
    };

    return (
        <div
            style={{
                maxWidth: 700,
                margin: "40px auto",
                padding: 24,
                background: "linear-gradient(135deg, #fff 60%, #FFBAC3 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
                minHeight: 500,
            }}
        >
            <Title level={3} style={{ color: "#FF6F61", textAlign: "center", marginBottom: 18, textTransform: "uppercase" }}>
                TỦ ĐỒ CỦA CƯ DÂN
            </Title>
            <Button
                type="primary"
                style={{ marginBottom: 18, background: "#FF6F61", border: "none", fontWeight: 1000, fontSize: 18 }}
                onClick={handleNotification}
                disabled={!adminId}
            >
                Thông báo
            </Button>
            {loading ? (
                <div style={{ textAlign: "center", margin: "40px 0" }}>
                    <Spin size="large" />
                </div>
            ) : lockerItems.length === 0 ? (
                <Alert message="Không có món hàng nào trong tủ đồ." type="info" showIcon />
            ) : (
                lockerItems.map((item, index) => (
                    <Card key={index} style={{ marginBottom: 16, borderRadius: 12, boxShadow: "0 2px 8px #e0e0e0" }}>
                        <Title level={5} style={{ color: "#1976D2" }}>Món hàng: {item.name}</Title>
                        <Paragraph>
                            Trạng thái:{" "}
                            <Text strong style={{color: "#00f974ff", fontWeight: "bold"}}>
                                {item.status === "PENDING" && "Chờ nhận"}
                                {item.status === "RECEIVED" && "Đã nhận"}
                                {item.status === "RETURNED" && "Đã trả lại"}
                                {!["PENDING", "RECEIVED", "RETURNED"].includes(item.status) && item.status}
                            </Text>
                        </Paragraph>
                        <Paragraph>
                            Ngày nhận:{" "}
                            {item.created_date
                                ? new Date(item.created_date).toLocaleDateString("vi-VN", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })
                                : "Chưa nhận"}
                        </Paragraph>
                        <Paragraph>Ghi chú: {item.note || "Không có"}</Paragraph>
                    </Card>
                ))
            )}
        </div>
    );
}

export default LockerItems;