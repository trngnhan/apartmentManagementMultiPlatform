import React, { useEffect, useState } from "react";
import { endpoints, authApis } from "../../configs/Apis";
import { useNavigate } from "react-router-dom";

function AdminLocker() {
    const [lockers, setLockers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [unregisteredResidents, setUnregisteredResidents] = useState([]);
    const [newLocker, setNewLocker] = useState({ resident_id: "" });
    const navigate = useNavigate();

    // Lấy token
    const getToken = () => localStorage.getItem("access_token");

    // Lấy danh sách tủ đồ
    const fetchLockers = async () => {
        setLoading(true);
        setError("");
        try {
            const api = authApis(getToken());
            const res = await api.get(endpoints.lockers);
            setLockers(res.data.results || res.data);
        } catch (err) {
            setError("Đã xảy ra lỗi khi tải danh sách tủ đồ.");
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách cư dân chưa có tủ đồ
    const fetchUnregisteredResidents = async () => {
        try {
            const api = authApis(getToken());
            const res = await api.get(endpoints.unregisteredResidentsLocker);
            setUnregisteredResidents(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
            // Không cần xử lý lỗi ở đây
        }
    };

    useEffect(() => {
        fetchLockers();
    }, []);

    useEffect(() => {
        if (showModal) {
            fetchUnregisteredResidents();
            setNewLocker({ resident_id: "" });
        }
    }, [showModal]);

    // Tạo mới tủ đồ
    const createLocker = async (e) => {
        e.preventDefault();
        if (!newLocker.resident_id) {
            alert("Vui lòng chọn cư dân để tạo tủ đồ");
            return;
        }
        try {
            const api = authApis(getToken());
            const res = await api.post(endpoints.lockers, { resident_id: newLocker.resident_id });
            setLockers(prev => [res.data, ...prev]);
            setShowModal(false);
            alert("Tủ đồ mới đã được thêm.");
        } catch (err) {
            alert("Không thể tạo tủ đồ. Vui lòng thử lại.");
        }
    };

    // Xóa tủ đồ
    const handleDeleteLocker = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xoá tủ đồ này?")) return;
        try {
            const api = authApis(getToken());
            const res = await api.delete(`${endpoints.lockers}${id}/`);
            if (res.status === 204 || res.status === 200) {
                setLockers(prev => prev.filter(locker => locker.id !== id));
                alert("Đã xoá tủ đồ.");
            } else {
                alert("Không thể xoá tủ đồ.");
            }
        } catch {
            alert("Có lỗi xảy ra khi xoá tủ đồ.");
        }
    };

    const handleViewLocker = (locker) => {
        const admin = JSON.parse(localStorage.getItem("user"));
        navigate(`/admin/locker/${locker.id}`, {
            state: {
                locker,
                resident: {
                    id: locker.resident,
                    email: locker.resident_email,
                    first_name: locker.first_name,
                    last_name: locker.last_name
                },
                admin: {
                    id: admin?.id,
                    email: admin?.email,
                    first_name: admin?.first_name,
                    last_name: admin?.last_name
                }
            }
        });
    };

    return (
        <div style={{
            maxWidth: 1100,
            margin: "40px auto",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px #e0e0e0",
            padding: 32
        }}>
            <h2 style={{ textAlign: "center", marginBottom: 24, color: "#FF6F61", textTransform: "uppercase" }}>
                Quản lý tủ đồ cư dân
            </h2>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        padding: "10px 24px",
                        borderRadius: 8,
                        background: "#4CAF50",
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        fontSize: 16,
                        cursor: "pointer"
                    }}
                >
                    + Tạo tủ đồ mới
                </button>
            </div>
            {loading ? (
                <div style={{ textAlign: "center", color: "#888", marginTop: 40 }}>Đang tải...</div>
            ) : error ? (
                <div style={{ color: "red", textAlign: "center" }}>{error}</div>
            ) : lockers.length === 0 ? (
                <div style={{ color: "#888", textAlign: "center" }}>Không có tủ đồ nào để hiển thị.</div>
            ) : (
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 20,
                    justifyContent: "flex-start"
                }}>
                    {lockers
                        .sort((a, b) => a.id - b.id)
                        .map(locker => (
                        <div key={locker.id} style={{
                            width: "12%",
                            minWidth: 210,
                            background: "#f8fafc",
                            borderRadius: 14,
                            boxShadow: "0 1px 6px #e0e0e0",
                            padding: 18,
                            marginBottom: 18,
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }}>
                            <button
                                onClick={() => handleDeleteLocker(locker.id)}
                                style={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    background: "#F44336",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: 28,
                                    height: 28,
                                    fontWeight: "bold",
                                    fontSize: 18,
                                    cursor: "pointer"
                                }}
                                title="Xoá tủ đồ"
                            >×</button>
                            <div
                                style={{ cursor: "pointer", textAlign: "center" }}
                                onClick={() => handleViewLocker(locker)}
                            >
                                <img
                                    src="/assets/locker_resident.png"
                                    alt="Tủ đồ"
                                    style={{ width: 64, height: 64, marginBottom: 10 }}
                                />
                                <div style={{ fontSize: 18, fontWeight: "bold" }}>#{locker.id}</div>
                                <div style={{ color: "#222", fontWeight: 500, margin: "6px 0" }}>
                                    {locker.first_name} {locker.last_name}
                                </div>
                                <div style={{ fontSize: 13, color: locker.active ? "#4CAF50" : "#F44336" }}>
                                    {locker.active ? "Đang hoạt động" : "Đã khoá"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal tạo mới tủ */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <form
                        onSubmit={createLocker}
                        style={{
                            background: "#fff", padding: 32, borderRadius: 12, minWidth: 350, boxShadow: "0 2px 16px #bbb"
                        }}
                    >
                        <h3 style={{ marginBottom: 16 }}>Tạo tủ đồ mới</h3>
                        <select
                            value={newLocker.resident_id}
                            onChange={e => setNewLocker({ ...newLocker, resident_id: e.target.value })}
                            required
                            style={{
                                width: "100%",
                                padding: 10,
                                marginBottom: 18,
                                borderRadius: 8,
                                border: "1px solid #ccc",
                                fontSize: 16
                            }}
                        >
                            <option value="">Chọn cư dân</option>
                            {unregisteredResidents.map(resident => (
                                <option key={resident.id} value={resident.id}>
                                    {resident.email}
                                </option>
                            ))}
                        </select>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button type="button" onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 6, background: "#ccc", border: "none" }}>Hủy</button>
                            <button type="submit" style={{ padding: "8px 20px", borderRadius: 6, background: "#4CAF50", border: "none", fontWeight: 600, color: "#fff" }}>Tạo</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default AdminLocker;