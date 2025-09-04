import React, { useCallback, useEffect, useState } from "react";
import { endpoints, authApis } from "../../configs/Apis";
import { useLocation, useParams, useNavigate } from "react-router-dom";


function AdminLockerItems() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const [newItemNote, setNewItemNote] = useState("");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");
    const { lockerId } = useParams();
    const location = useLocation();
    const {resident, admin } = location.state || {};
    const navigate = useNavigate();

    // Lấy token
    const getToken = () => localStorage.getItem("access_token");

    // Lấy danh sách món đồ
    const fetchLockerItems = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const api = authApis(getToken());
            const res = await api.get(endpoints.lockerItems(lockerId));
            setItems(res.data);
        } catch (err) {
            setError("Không thể tải dữ liệu món đồ từ máy chủ.");
        } finally {
            setLoading(false);
        }
    }, [lockerId]);

    useEffect(() => {
        if (lockerId) fetchLockerItems();
    }, [lockerId, fetchLockerItems]);

    // Đổi trạng thái món đồ
    const handleUpdateStatus = async (itemId, newStatus) => {
        try {
            const api = authApis(getToken());
            const res = await api.patch(
                endpoints.updateLockerItemStatus(lockerId, itemId),
                { item_id: itemId, status: newStatus }
            );
            if (res.status === 200 || res.status === 204) {
                fetchLockerItems();
                alert("Đã cập nhật trạng thái.");
            } else {
                alert(res.data.detail || "Không thể cập nhật trạng thái.");
            }
        } catch {
            alert("Đã xảy ra lỗi khi kết nối.");
        }
    };

    // Thêm món đồ mới
    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItemName.trim()) {
            alert("Tên món đồ không được để trống.");
            return;
        }
        setAdding(true);
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const response = await api.post(
                endpoints.addLockerItem(lockerId),
                {
                    item_name: newItemName,
                    note: newItemNote
                }
            );
            if (response.status === 200 || response.status === 201) {
                setAddModalVisible(false);
                const noteToSend = newItemNote;
                setNewItemName("");
                setNewItemNote("");
                fetchLockerItems();

                navigate("/admin/chat-locker", {
                    state: {
                        lockerId,
                        adminId: admin.id,
                        residentId: resident.id,
                        admin,
                        resident,
                        note: noteToSend,
                    }
                });
                alert("Đã thêm món đồ mới!");
            } else {
                alert(response.data.detail || "Không thể thêm món đồ.");
            }
        } catch (error) {
            alert("Đã xảy ra lỗi khi kết nối.");
        } finally {
            setAdding(false);
        }
    };

    const handleSendMessage = (noteToSend) => {
        if (!resident || !resident.id) {
            alert("Không tìm thấy thông tin cư dân.");
            return;
        }
        navigate("/admin/chat-locker", {
            state: {
                lockerId,
                adminId: admin.id,
                residentId: resident.id,
                admin,
                resident,
                note: noteToSend,
            }
        });
    };

    return (
        <div style={{
            maxWidth: 600,
            margin: "40px auto",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px #e0e0e0",
            padding: 32,
            minHeight: 400
        }}>
            <h2 style={{
                textAlign: "center",
                marginBottom: 24,
                color: "#FF6F61",
                textTransform: "uppercase"
            }}>
                Quản lý món đồ trong tủ #{lockerId}
            </h2>
            {/* Hiển thị thông tin cư dân và admin nếu có */}
            <div style={{ marginBottom: 18, fontSize: 20, color: "#0b0b0bff" }}>
                {resident && (
                    <div>
                        <b>Cư dân:</b> {resident.first_name} {resident.last_name}
                    </div>
                )}
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <button
                    onClick={() => setAddModalVisible(true)}
                    style={{
                        background: "#4CAF50",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontWeight: 600,
                        fontSize: 16,
                        cursor: "pointer"
                    }}
                >
                    Thêm món đồ
                </button>
                <button
                    onClick={() => handleSendMessage()}
                    style={{
                        background: "#2196F3",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontWeight: 600,
                        fontSize: 16,
                        cursor: "pointer"
                    }}
                    title={!resident || !resident.id ? "Không tìm thấy thông tin cư dân" : ""}
                >
                    Gửi tin nhắn cho cư dân
                </button>
            </div>
            {addModalVisible && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <form
                        onSubmit={handleAddItem}
                        style={{
                            background: "#fff", padding: 32, borderRadius: 12, minWidth: 350, boxShadow: "0 2px 16px #bbb"
                        }}
                    >
                        <h3 style={{ marginBottom: 16 }}>Thêm món đồ mới</h3>
                        <input
                            type="text"
                            placeholder="Tên món đồ"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                padding: 10,
                                marginBottom: 12,
                                borderRadius: 8,
                                border: "1px solid #ccc",
                                fontSize: 16
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Ghi chú (không bắt buộc)"
                            value={newItemNote}
                            onChange={e => setNewItemNote(e.target.value)}
                            style={{
                                width: "100%",
                                padding: 10,
                                marginBottom: 18,
                                borderRadius: 8,
                                border: "1px solid #ccc",
                                fontSize: 16
                            }}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button type="button" onClick={() => setAddModalVisible(false)} style={{ padding: "8px 20px", borderRadius: 6, background: "#ccc", border: "none" }}>Hủy</button>
                            <button type="submit" disabled={adding} style={{ padding: "8px 20px", borderRadius: 6, background: "#4CAF50", border: "none", fontWeight: 600, color: "#fff" }}>
                                {adding ? "Đang thêm..." : "Thêm"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {loading ? (
                <div style={{ textAlign: "center", color: "#888", marginTop: 40 }}>Đang tải...</div>
            ) : error ? (
                <div style={{ color: "red", textAlign: "center" }}>{error}</div>
            ) : items.length === 0 ? (
                <div style={{ color: "#888", textAlign: "center" }}>📦 Chưa có món đồ nào trong tủ đồ...</div>
            ) : (
                items.map(item => (
                    <div key={item.id} style={{
                        background: "#ffffff",
                        borderRadius: 12,
                        padding: 16,
                        boxShadow: "0 1px 6px #e0e0e0",
                        marginBottom: 12
                    }}>
                        <div style={{ fontSize: 18, fontWeight: 600, color: "#343a40", marginBottom: 8 }}>
                            Tên món đồ: {item.name}
                        </div>
                        <div style={{ fontSize: 14, color: "#495057", marginBottom: 4 }}>
                            Ghi chú: {item.note || 'Không có'}
                        </div>
                        <div style={{ fontSize: 14, color: "#495057", marginBottom: 4 }}>
                            Ngày tạo: {item.created_date
                                ? new Date(item.created_date).toLocaleString("vi-VN", {
                                    year: "numeric", month: "2-digit", day: "2-digit",
                                    hour: "2-digit", minute: "2-digit"
                                })
                                : ""}
                        </div>
                        <div style={{
                            border: "1px solid #ccc",
                            borderRadius: 8,
                            margin: "8px 0",
                            background: "#fff",
                            padding: 8,
                            width: 180
                        }}>
                            <select
                                value={item.status}
                                onChange={e => handleUpdateStatus(item.id, e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: 6,
                                    borderRadius: 6,
                                    border: "1px solid #ccc",
                                    fontWeight: 600,
                                    color: item.status === "RECEIVED" ? "#4CAF50" : "#FF9800"
                                }}
                            >
                                <option value="PENDING">Chờ nhận</option>
                                <option value="RECEIVED">Đã nhận</option>
                            </select>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default AdminLockerItems;