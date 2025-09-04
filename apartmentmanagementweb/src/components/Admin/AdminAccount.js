import React, { useEffect, useState } from "react";
import { authApis, endpoints } from "../../configs/Apis";

function AdminAccount() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [form, setForm] = useState({
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        phone_number: "",
    });
    const [editUser, setEditUser] = useState(null);

    // Lấy token từ localStorage
    const getToken = () => localStorage.getItem("access_token");

    // Lấy danh sách tài khoản
    const fetchUsers = async (searchText = "") => {
        setLoading(true);
        setError("");
        try {
            const apiAuth = authApis(getToken());
            const res = await apiAuth.get(`${endpoints.users}?search=${searchText}`);
            setUsers(res.data.results || res.data);
        } catch (err) {
            setError("Không thể tải danh sách tài khoản.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Tìm kiếm
    const handleSearch = (e) => {
        setSearch(e.target.value);
        fetchUsers(e.target.value);
    };

    // Khóa/mở khóa tài khoản
    const toggleUserActive = async (userId, currentActive) => {
        const action = currentActive ? "khóa" : "mở khóa";
        if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản này?`)) return;
        try {
            const apiAuth = authApis(getToken());
            await apiAuth.patch(endpoints.userLock(userId), { active: !currentActive });
            setUsers(users.map(u => u.id === userId ? { ...u, active: !currentActive } : u));
        } catch {
            alert(`Không thể ${action} tài khoản.`);
        }
    };

    // Tạo tài khoản mới
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const apiAuth = authApis(getToken());
            const res = await apiAuth.post(endpoints.users, form);
            setUsers([...users, res.data]);
            setShowModal(false);
            setForm({ email: "", first_name: "", last_name: "", password: "", phone_number: "" });
        } catch {
            alert("Không thể tạo tài khoản.");
        }
    };

    // Sửa tài khoản
    const handleEditUser = (user) => {
        setEditUser(user);
        setForm({
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone_number: user.phone_number || "",
            password: "",
        });
        setEditModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const apiAuth = authApis(getToken());
            const updateData = { ...form };
            if (!updateData.password) delete updateData.password; // Không đổi mật khẩu nếu để trống
            const res = await apiAuth.patch(`${endpoints.users}${editUser.id}/`, updateData);
            setUsers(users.map(u => u.id === editUser.id ? res.data : u));
            setEditModal(false);
            setEditUser(null);
        } catch {
            alert("Không thể cập nhật tài khoản.");
        }
    };

    return (
        <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px #eee", padding: 32 }}>
            <h2 style={{ textAlign: "center", marginBottom: 24, textTransform: "uppercase" }}>Quản lý tài khoản</h2>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={search}
                    onChange={handleSearch}
                    style={{ padding: 15, borderRadius: 10, border: "1px solid #ccc", width: 500 }}
                />
                <button
                    onClick={() => {
                        setForm({ email: "", first_name: "", last_name: "", password: "", phone_number: "" }); // reset form
                        setShowModal(true);
                    }}
                    style={{ padding: "8px 20px", borderRadius: 6, background: "#74ebd5", color: "#222", border: "none", fontWeight: 600 }}
                >
                    Tạo tài khoản mới
                </button>
            </div>
            {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "#f3f6fa" }}>
                        <th style={{ padding: 8, border: "1px solid #eee" }}>Tên</th>
                        <th style={{ padding: 8, border: "1px solid #eee" }}>Email</th>
                        <th style={{ padding: 8, border: "1px solid #eee" }}>Số điện thoại</th>
                        <th style={{ padding: 8, border: "1px solid #eee" }}>Vai trò</th>
                        <th style={{ padding: 8, border: "1px solid #eee" }}>Trạng thái</th>
                        <th style={{ padding: 8, border: "1px solid #eee" }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: 24 }}>Đang tải...</td></tr>
                    ) : users.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: 24 }}>Không có tài khoản nào.</td></tr>
                    ) : (
                        users.map(user => (
                            <tr key={user.id}>
                                <td style={{ padding: 8, border: "1px solid #eee" }}>
                                    {user.first_name} {user.last_name}
                                </td>
                                <td style={{ padding: 8, border: "1px solid #eee" }}>{user.email}</td>
                                <td style={{ padding: 8, border: "1px solid #eee" }}>{user.phone_number || ""}</td>
                                <td style={{ padding: 8, border: "1px solid #eee" }}>{user.is_superuser ? "Admin" : "Cư dân"}</td>
                                <td style={{ padding: 8, border: "1px solid #eee" }}>
                                    {user.active === false ? <span style={{ color: "red" }}>Đã khóa</span> : <span style={{ color: "green" }}>Hoạt động</span>}
                                </td>
                                <td style={{ 
                                    padding: 8, border: "1px solid #eee",
                                    minWidth: 160,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <button
                                        onClick={() => toggleUserActive(user.id, user.active)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: 6,
                                            background: user.active === false ? "#4CAF50" : "#FF6F61",
                                            color: "#fff",
                                            border: "none",
                                            cursor: "pointer",
                                            marginRight: 8
                                        }}
                                    >
                                        {user.active === false ? "Mở khóa" : "Khóa"}
                                    </button>
                                    <button
                                        onClick={() => handleEditUser(user)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: 6,
                                            background: "#2196F3",
                                            color: "#fff",
                                            border: "none",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Sửa
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Modal tạo tài khoản */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <form
                        onSubmit={handleCreateUser}
                        style={{
                            background: "#fff", padding: 32, borderRadius: 12, minWidth: 350, boxShadow: "0 2px 16px #bbb"
                        }}
                    >
                        <h3 style={{ marginBottom: 16 }}>Tạo tài khoản mới</h3>
                        <input
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            required
                            style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <input
                            type="text"
                            placeholder="Họ"
                            value={form.first_name}
                            onChange={e => setForm({ ...form, first_name: e.target.value })}
                            required
                            style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <input
                            type="text"
                            placeholder="Tên"
                            value={form.last_name}
                            onChange={e => setForm({ ...form, last_name: e.target.value })}
                            required
                            style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                            style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <input
                            type="text"
                            placeholder="Số điện thoại"
                            value={form.phone_number}
                            maxLength={10}
                            onChange={e => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setForm({ ...form, phone_number: value });
                            }}
                            required
                            style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button type="button" onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 6, background: "#ccc", border: "none" }}>Hủy</button>
                            <button type="submit" style={{ padding: "8px 20px", borderRadius: 6, background: "#74ebd5", border: "none", fontWeight: 600 }}>Tạo</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal sửa tài khoản */}
            {editModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <form
                        onSubmit={handleUpdateUser}
                        style={{
                            background: "#fff", padding: 32, borderRadius: 12, minWidth: 350, boxShadow: "0 2px 16px #bbb"
                        }}
                    >
                        <h3 style={{ marginBottom: 16 }}>Sửa tài khoản</h3>
                        <input
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            required
                            style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <input
                            type="text"
                            placeholder="Họ"
                            value={form.first_name}
                            onChange={e => setForm({ ...form, first_name: e.target.value })}
                            required
                            style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <input
                            type="text"
                            placeholder="Tên"
                            value={form.last_name}
                            onChange={e => setForm({ ...form, last_name: e.target.value })}
                            required
                            style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <input
                            type="password"
                            placeholder="Mật khẩu (bỏ trống nếu không đổi)"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <input
                            type="text"
                            placeholder="Số điện thoại"
                            value={form.phone_number}
                            maxLength={10}
                            onChange={e => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setForm({ ...form, phone_number: value });
                            }}
                            required
                            style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button type="button" onClick={() => setEditModal(false)} style={{ padding: "8px 20px", borderRadius: 6, background: "#ccc", border: "none" }}>Hủy</button>
                            <button type="submit" style={{ padding: "8px 20px", borderRadius: 6, background: "#2196F3", border: "none", fontWeight: 600, color: "#fff" }}>Lưu</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default AdminAccount;