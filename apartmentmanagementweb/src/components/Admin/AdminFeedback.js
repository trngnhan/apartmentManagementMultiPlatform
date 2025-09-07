import React, { useEffect, useState } from "react";
import { endpoints, authApis } from "../../configs/Apis";

function AdminFeedback() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStatuses, setSelectedStatuses] = useState({});

    const fetchFeedbacks = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const response = await api.get(endpoints.feedbacks);
            const data = response.data;
            setFeedbacks(data.results || data);
        } catch (err) {
            setError("Đã xảy ra lỗi khi tải phản ánh.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const response = await api.patch(endpoints.updateFeedbackStatus(id), { status: newStatus });
            if (response.status === 200 || response.status === 204) {
                alert("Đã cập nhật trạng thái.");
                fetchFeedbacks();
            } else {
                alert("Không thể cập nhật trạng thái.");
            }
        } catch (error) {
            alert("Đã xảy ra lỗi khi kết nối.");
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xoá phản ánh này?")) return;
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.delete(`${endpoints.feedbacks}${id}/`);
            if (res.status === 204 || res.status === 200) {
                alert("Đã xoá phản ánh.");
                fetchFeedbacks();
            } else {
                alert("Không thể xoá phản ánh.");
            }
        } catch (err) {
            alert("Có lỗi xảy ra khi xoá phản ánh.");
        }
    };

    useEffect(() => {
        fetchFeedbacks();
        // eslint-disable-next-line
    }, []);

    return (
        <div style={{
            maxWidth: 900,
            margin: "40px auto",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px #e0e0e0",
            padding: 32
        }}
        className="admin-feedback-container"
        >
            <h2 className="admin-feedback-title" style={{ textAlign: "center", marginBottom: 24 }}>QUẢN LÝ PHẢN ÁNH</h2>
            {loading ? (
                <div style={{ textAlign: "center", marginTop: 40 }}>Đang tải...</div>
            ) : error ? (
                <div style={{ color: "red", textAlign: "center" }}>{error}</div>
            ) : feedbacks.length === 0 ? (
                <div style={{ textAlign: "center", color: "#888" }}>Không có phản ánh nào.</div>
            ) : (
                <table className="admin-feedback-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th>Tiêu đề</th>
                            <th>Nội dung</th>
                            <th>Cư dân</th>
                            <th>Email</th>
                            <th>Ngày gửi</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feedbacks.map(item => (
                            <tr key={item.id}>
                                <td>{item.title}</td>
                                <td>{item.content}</td>
                                <td>{item.first_name} {item.last_name}</td>
                                <td>{item.resident_email}</td>
                                <td>{item.created_date && new Date(item.created_date).toLocaleString("vi-VN", {
                                    year: "numeric", month: "2-digit", day: "2-digit",
                                    hour: "2-digit", minute: "2-digit"
                                })}</td>
                                <td>
                                    <select
                                        className="admin-feedback-select"
                                        value={selectedStatuses[item.id] || item.status || 'NEW'}
                                        onChange={e => {
                                            const value = e.target.value;
                                            setSelectedStatuses(prev => ({ ...prev, [item.id]: value }));
                                            handleUpdateStatus(item.id, value);
                                        }}
                                    >
                                        <option value="NEW">Mới</option>
                                        <option value="PROCESSING">Đang xử lý</option>
                                        <option value="RESOLVED">Đã xử lý</option>
                                    </select>
                                </td>
                                <td>
                                    <button
                                        className="admin-feedback-delete-btn"
                                        onClick={() => handleDeleteFeedback(item.id)}
                                    >
                                        Xoá
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminFeedback;