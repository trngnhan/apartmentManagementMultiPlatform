import React, { useEffect, useState } from "react";
import { authApis, endpoints } from "../../configs/Apis";

function AdminResident() {
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [unregisteredUsers, setUnregisteredUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");

    // Lấy token từ localStorage
    const getToken = () => localStorage.getItem("access_token");

    // Lấy danh sách cư dân
    const fetchResidents = async (searchText = "") => {
        setLoading(true);
        setError("");
        try {
            const api = authApis(getToken());
            const res = await api.get(`${endpoints.residents}?search=${searchText}`);
            setResidents(res.data.results || res.data);
        } catch {
            setError("Không thể tải danh sách cư dân.");
        } finally {
            setLoading(false);
        }
    };

    const toggleResidentActive = async (residentId, currentActive) => {
        const action = currentActive ? "khóa" : "mở khóa";
        if (!window.confirm(`Bạn có chắc chắn muốn ${action} cư dân này?`)) return;
        try {
            const api = authApis(getToken());
            await api.patch(`${endpoints.residents}${residentId}/`, { active: !currentActive });
            setResidents(residents.map(r =>
                r.id === residentId ? { ...r, user: { ...r.user, active: !currentActive } } : r
            ));
        } catch {
            alert(`Không thể ${action} cư dân.`);
        }
    };

    // Lấy danh sách user chưa đăng ký cư dân
    const fetchUnregisteredUsers = async () => {
        try {
            const api = authApis(getToken());
            const res = await api.get(endpoints.unregisteredUsers);
            setUnregisteredUsers(res.data);
        } catch {
            setUnregisteredUsers([]);
        }
    };

    useEffect(() => {
        fetchResidents();
    }, []);

    // Tìm kiếm
    const handleSearch = (e) => {
        setSearch(e.target.value);
        fetchResidents(e.target.value);
    };

    // Thêm cư dân mới
    const handleAddResident = async (e) => {
        e.preventDefault();
        if (!selectedUserId) {
            alert("Vui lòng chọn một cư dân trước khi thêm.");
            return;
        }
        try {
            const api = authApis(getToken());
            const res = await api.post(endpoints.residents, { user_id: Number(selectedUserId) }); // ép kiểu về số nếu cần
            if (res.status === 201 || res.status === 200) {
                const data = res.data;
                setResidents((prevResidents) => [data, ...prevResidents]);
                setShowModal(false);
                setSelectedUserId("");
                alert("Cư dân mới đã được thêm.");
            } else {
                alert(`Không thể thêm cư dân: ${res.data.detail || "Dữ liệu không hợp lệ"}`);
            }
        } catch (error) {
            console.log("Lỗi thêm cư dân:", error?.response?.data || error.message || error);
            alert(
                error?.response?.data?.detail ||
                (error?.response?.data && JSON.stringify(error.response.data)) ||
                "Đã xảy ra lỗi khi thêm cư dân."
            );
        }
    };

    // Hiển thị modal thêm cư dân
    const openModal = () => {
        fetchUnregisteredUsers();
        setShowModal(true);
    };

    return (
        <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px #eee", padding: 32 }}>
            <h2 style={{ textAlign: "center", marginBottom: 24, textTransform: "uppercase" }}>Quản lý cư dân</h2>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc email..." 
                    value={search}
                    onChange={handleSearch}
                    style={{ padding: 12, borderRadius: 10, border: "1px solid #ccc", width: 500 }}
                />
                <button
                    onClick={openModal}
                    style={{ padding: "8px 20px", borderRadius: 6, background: "#FFCC33", color: "#222", border: "none", fontWeight: 600 }}
                >
                    Thêm cư dân
                </button>
            </div>
            {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "#f3f6fa" }}>
                        <th style={{ padding: 8, border: "1px solid #eee" }}>Tên</th>
                        <th style={{ padding: 8, border: "1px solid #eee" }}>Email</th>
                        <th style={{ padding: 8, border: "1px solid #eee" }}>Trạng thái</th>
                        <th style={{ padding: 8, border: "1px solid #eee" }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={4} style={{ textAlign: "center", padding: 24 }}>Đang tải...</td></tr>
                    ) : residents.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: "center", padding: 24 }}>Không có cư dân nào.</td></tr>
                    ) : (
                        residents.map(resident => (
                            <tr key={resident.id}>
                                <td style={{ padding: 8, border: "1px solid #eee" }}>
                                    {resident.user?.first_name} {resident.user?.last_name}
                                </td>
                                <td style={{ padding: 8, border: "1px solid #eee" }}>{resident.user?.email}</td>
                                <td style={{ padding: 8, border: "1px solid #eee" }}>
                                    {resident.user?.active === false
                                        ? <span style={{ color: "red" }}>Đã khóa</span>
                                        : <span style={{ color: "green" }}>Hoạt động</span>}
                                </td>
                                <td style={{ padding: 8, border: "1px solid #eee" }}>
                                    <button
                                        onClick={() => toggleResidentActive(resident.id, resident.user?.active)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: 6,
                                            background: resident.user?.active === false ? "#4CAF50" : "#FF6F61",
                                            color: "#fff",
                                            border: "none",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {resident.user?.active === false ? "Mở khóa" : "Khóa"}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Modal thêm cư dân */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <form
                        onSubmit={handleAddResident}
                        style={{
                            background: "#fff", padding: 32, borderRadius: 12, minWidth: 350, boxShadow: "0 2px 16px #bbb"
                        }}
                    >
                        <h3 style={{ marginBottom: 16 }}>Thêm cư dân mới</h3>
                        <select
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                            required
                            style={{ width: "100%", padding: 8, marginBottom: 16, borderRadius: 6, border: "1px solid #ccc" }}
                        >
                            <option value="">Chọn cư dân</option>
                            {unregisteredUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name} ({user.email})
                                </option>
                            ))}
                        </select>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button type="button" onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 6, background: "#ccc", border: "none" }}>Hủy</button>
                            <button type="submit" style={{ padding: "8px 20px", borderRadius: 6, background: "#FF6F61", border: "none", fontWeight: 600, color: "#fff" }}>Thêm</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default AdminResident;