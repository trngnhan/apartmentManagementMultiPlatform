import React, { useEffect, useState } from "react";
import { List, Avatar, Spin, Typography, message, Input } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { endpoints, authApis } from "../../configs/Apis";

const { Title } = Typography;
const { Search } = Input;

function AdminChatScreen() {
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const adminStr = localStorage.getItem("user");
    const adminId = adminStr ? JSON.parse(adminStr).id : null;

    useEffect(() => {
        const fetchResidents = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("access_token");
                const api = authApis(token);
                const res = await api.get(endpoints.residents || "/residents/");
                const data = res.data.results || res.data;
                const filtered = data.filter(item => item.user?.role === "RESIDENT");
                setResidents(filtered);
            } catch (err) {
                message.error("Không thể tải danh sách cư dân.");
            }
            setLoading(false);
        };
        fetchResidents();
    }, []);

    const filteredResidents = residents.filter(item =>
        (item.user?.first_name + " " + item.user?.last_name)
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const handleChat = (resident) => {
        // Chuyển sang trang chat, truyền id phòng chat là adminId_residentId
        const adminId = adminStr ? JSON.parse(adminStr).id : null;
        const roomId = `${adminId}_${resident.id+1}`;
        navigate(`/admin/chat/${roomId}?residentId=${resident.id+1}`, { state: { avatar: resident.user?.avatar || resident.user?.profile_picture || null } });
    };

    return (
        <div
            style={{
                maxWidth: 600,
                margin: "40px auto",
                padding: 32,
                background: "linear-gradient(135deg, #f8fafc 60%, #e3e6e8 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
                minHeight: 500,
            }}
        >
            <Title level={3} style={{ textAlign: "center", color: "#1976d2", marginBottom: 24 }}>
                Danh sách cư dân để chat
            </Title>
            <Search
                placeholder="Tìm kiếm cư dân..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom: 20 }}
                allowClear
            />
            {loading ? (
                <div style={{ textAlign: "center", margin: "40px 0" }}>
                    <Spin size="large" />
                </div>
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={filteredResidents}
                    locale={{ emptyText: "Không có cư dân nào." }}
                    renderItem={item => (
                        <List.Item
                            style={{
                                padding: 16,
                                borderRadius: 10,
                                marginBottom: 10,
                                background: "#fff",
                                boxShadow: "0 2px 8px #e0e0e0",
                                cursor: "pointer",
                                transition: "box-shadow 0.2s",
                            }}
                            onClick={() => handleChat(item)}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                    size={48}
                                    icon={<UserOutlined />}
                                    src={item.user?.avatar || item.user?.profile_picture || undefined}
                                    style={{ backgroundColor: "#b3c6e0" }}
                                />
                                }
                                title={
                                    <span style={{ fontWeight: 600, color: "#1976d2" }}>
                                        {item.user?.first_name} {item.user?.last_name}
                                    </span>
                                }
                                description={
                                    <>
                                        <span>Email: {item.user?.email || "Không có"}</span>
                                        <br />
                                        <span>Trạng thái: {item.user?.active ? "Hoạt động" : "Đã khoá"}</span>
                                    </>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </div>
    );
}

export default AdminChatScreen;