import React, { useEffect, useState } from "react";
import { endpoints, authApis } from "../../configs/Apis";
import { useNavigate } from "react-router-dom";

function AdminAmenity() {
    const [amenities, setAmenities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        location: "",
        opening_time: "",
        closing_time: "",
        max_bookings_per_slot: "1",
        image: ""
    });
    const [editId, setEditId] = useState(null);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    const fetchAmenities = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.get(endpoints.amenities);
            setAmenities(res.data.results || res.data);
        } catch (err) {
            setAmenities([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAmenities();
    }, []);

    const handleAddAmenity = async (e) => {
        e.preventDefault();
        if (!form.name || !form.location || !form.opening_time || !form.closing_time) {
            alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
            return;
        }
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);

            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("description", form.description);
            formData.append("location", form.location);
            formData.append("opening_time", form.opening_time);
            formData.append("closing_time", form.closing_time);
            formData.append("max_bookings_per_slot", form.max_bookings_per_slot);
            if (form.image && typeof form.image !== "string") {
                formData.append("image", form.image);
            }

            let res;
            if (editId) {
                res = await api.put(
                    `${endpoints.amenities}${editId}/`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
            } else {
                res = await api.post(
                    endpoints.amenities,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
            }
            if (res.status === 201 || res.status === 200) {
                alert(editId ? "Đã sửa tiện ích!" : "Đã thêm tiện ích mới!");
                setShowModal(false);
                setForm({
                    name: "",
                    description: "",
                    location: "",
                    opening_time: "",
                    closing_time: "",
                    max_bookings_per_slot: "1",
                    image: ""
                });
                setEditId(null);
                fetchAmenities();
            } else {
                alert("Không thể lưu tiện ích.");
            }
        } catch (err) {
            alert("Có lỗi xảy ra khi lưu tiện ích.");
        }
    };

    const handleDeleteAmenity = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xoá tiện ích này?")) return;
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.delete(`${endpoints.amenities}${id}/`);
            if (res.status === 204 || res.status === 200) {
                alert("Đã xoá tiện ích.");
                fetchAmenities();
            } else {
                alert("Không thể xoá tiện ích.");
            }
        } catch (err) {
            alert("Có lỗi xảy ra khi xoá tiện ích.");
        }
    };

    const filteredAmenities = amenities.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(180deg, #fff, #d7d2cc, #FFBAC3)",
            padding: "40px 0"
        }}>
            <div style={{
                maxWidth: 800,
                margin: "0 auto",
                background: "#f8fafc",
                borderRadius: 16,
                boxShadow: "0 4px 24px #e0e0e0",
                padding: 32
            }}>
                <h2 style={{
                    textAlign: "center",
                    marginBottom: 32,
                    color: "#FF6F61",
                    textTransform: "uppercase",
                    letterSpacing: 1.5
                }}>
                    QUẢN LÝ TIỆN ÍCH
                </h2>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm tiện ích..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            flex: 1,
                            border: "1px solid #ccc",
                            borderRadius: 8,
                            padding: 10,
                            marginRight: 12,
                            background: "#fff"
                        }}
                    />
                    <button
                        style={{
                            background: "#4A90E2",
                            color: "#fff",
                            padding: "10px 20px",
                            borderRadius: 8,
                            border: "none",
                            fontWeight: "bold",
                            cursor: "pointer"
                        }}
                        onClick={() => setShowModal(true)}
                    >
                        Thêm tiện ích
                    </button>
                </div>
                {loading ? (
                    <div style={{ textAlign: "center", margin: "40px 0" }}>
                        <span className="spinner-border text-danger" role="status" />
                        <span style={{ marginLeft: 12 }}>Đang tải...</span>
                    </div>
                ) : filteredAmenities.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#888" }}>
                        Không có tiện ích nào.
                    </div>
                ) : (
                    <div>
                        {filteredAmenities.map(item => (
                            <div 
                                style={{
                                    background: "#fff",
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 14,
                                    boxShadow: "0 2px 8px #e0e0e0",
                                }}
                                >
                                <div 
                                style={{ 
                                    fontWeight: "bold", fontSize: 18, textAlign: "center", marginBottom: 8, textTransform: "uppercase" }}>{item.name}</div>
                                {item.image ? (
                                    <img
                                        key={item.id} 
                                        src={typeof item.image === "string" ? item.image : item.image?.url}
                                        alt={item.name}
                                        onClick={() => navigate(`/admin/amenity-bookings/${item.id}`)}
                                        style={{ cursor: "pointer", width: "100%", height: 240, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
                                    />
                                ) : (
                                    <div style={{ color: "#aaa", textAlign: "center" }}>Không có ảnh</div>
                                )}
                                <div>Vị trí: {item.location}</div>
                                <div>Mô tả: {item.description || "Không có mô tả"}</div>
                                <div style={{
                                    display: "flex",
                                    gap: 16,
                                    margin: "18px 0 8px 0",
                                    justifyContent: "center",
                                    alignItems: "center"
                                }}>
                                    <div style={{
                                        background: "linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)",
                                        color: "#fff",
                                        borderRadius: 10,
                                        padding: "12px 24px",
                                        fontWeight: 700,
                                        fontSize: 16,
                                        boxShadow: "0 2px 8px #b3c6e0",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8
                                    }}>
                                        Giờ mở cửa: {item.opening_time?.slice(0, 5)} - {item.closing_time?.slice(0, 5)}
                                    </div>
                                    <div style={{
                                        background: "linear-gradient(90deg, #ff9800 60%, #ffd54f 100%)",
                                        color: "#fff",
                                        borderRadius: 10,
                                        padding: "12px 24px",
                                        fontWeight: 700,
                                        fontSize: 16,
                                        boxShadow: "0 2px 8px #ffe0b2",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8
                                    }}>
                                        Tối đa: {item.max_bookings_per_slot} lượt/khung giờ
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                                    <button
                                        style={{
                                            background: "#FFA500",
                                            color: "#fff",
                                            padding: "8px 16px",
                                            borderRadius: 6,
                                            border: "none",
                                            fontWeight: "bold",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => {
                                            setForm({
                                                name: item.name,
                                                description: item.description,
                                                location: item.location,
                                                opening_time: item.opening_time,
                                                closing_time: item.closing_time,
                                                max_bookings_per_slot: item.max_bookings_per_slot.toString(),
                                                image: item.image || ""
                                            });
                                            setEditId(item.id);
                                            setShowModal(true);
                                        }}
                                    >
                                        Sửa tiện ích
                                    </button>
                                    <button
                                        style={{
                                            background: "#F44336",
                                            color: "#fff",
                                            padding: "8px 16px",
                                            borderRadius: 6,
                                            border: "none",
                                            fontWeight: "bold",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => handleDeleteAmenity(item.id)}
                                    >
                                        Xoá tiện ích
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal thêm/sửa tiện ích */}
            {showModal && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 24,
                        width: 400,
                        boxShadow: "0 4px 24px #e0e0e0",
                        position: "relative"
                    }}>
                        <button
                            onClick={() => {
                                setShowModal(false);
                                setEditId(null);
                                setForm({
                                    name: "",
                                    description: "",
                                    location: "",
                                    opening_time: "",
                                    closing_time: "",
                                    max_bookings_per_slot: "1",
                                    image: ""
                                });
                            }}
                            style={{
                                position: "absolute",
                                top: 12,
                                right: 16,
                                background: "transparent",
                                border: "none",
                                fontSize: 22,
                                color: "#888",
                                cursor: "pointer"
                            }}
                            aria-label="Đóng"
                        >×</button>
                        <h3 style={{ marginBottom: 18, textAlign: "center", color: "#2196F3" }}>
                            {editId ? "Sửa tiện ích" : "Thêm tiện ích mới"}
                        </h3>
                        <form onSubmit={handleAddAmenity} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <input
                                type="text"
                                placeholder="Tên tiện ích*"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                            />
                            <input
                                type="text"
                                placeholder="Vị trí*"
                                value={form.location}
                                onChange={e => setForm({ ...form, location: e.target.value })}
                                style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                            />
                            <input
                                type="text"
                                placeholder="Giờ mở cửa (hh:mm:ss)*"
                                value={form.opening_time}
                                onChange={e => setForm({ ...form, opening_time: e.target.value })}
                                style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                            />
                            <input
                                type="text"
                                placeholder="Giờ đóng cửa (hh:mm:ss)*"
                                value={form.closing_time}
                                onChange={e => setForm({ ...form, closing_time: e.target.value })}
                                style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                            />
                            <input
                                type="number"
                                placeholder="Số lượt đặt tối đa"
                                value={form.max_bookings_per_slot}
                                onChange={e => setForm({ ...form, max_bookings_per_slot: e.target.value })}
                                style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                            />
                            <input
                                type="text"
                                placeholder="Mô tả"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setForm({ ...form, image: e.target.files[0] })}
                            />
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button
                                    type="submit"
                                    style={{
                                        background: "#4A90E2",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "8px 18px",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    {editId ? "Lưu thay đổi" : "Thêm"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditId(null);
                                        setForm({
                                            name: "",
                                            description: "",
                                            location: "",
                                            opening_time: "",
                                            closing_time: "",
                                            max_bookings_per_slot: "1",
                                            image: ""
                                        });
                                    }}
                                    style={{
                                        background: "#aaa",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "8px 18px",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminAmenity;