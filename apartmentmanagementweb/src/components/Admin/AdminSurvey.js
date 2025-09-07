import React, { useEffect, useState } from "react";
import { endpoints, authApis } from "../../configs/Apis";
import { useNavigate } from "react-router-dom";

function AdminSurvey() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creating, setCreating] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [showOptionModal, setShowOptionModal] = useState(false);

    // State cho form tạo khảo sát mới
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [deadline, setDeadline] = useState("");
    const [createdSurveyId, setCreatedSurveyId] = useState(null);

    // State cho form tạo option
    const [optionText, setOptionText] = useState("");
    const [optionList, setOptionList] = useState([]);

    const navigate = useNavigate();

    const fetchSurveys = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.get(endpoints.surveys);
            setSurveys(res.data.results || res.data);
            setError(null);
        } catch (error) {
            setError("Đã xảy ra lỗi khi tải danh sách khảo sát.");
        } finally {
            setLoading(false);
        }
    };

    // Hàm tạo khảo sát (chỉ tạo survey, chưa tạo option)
    const handleCreateSurvey = async (e) => {
        e.preventDefault();
        if (!title || !deadline) {
            alert("Vui lòng nhập đầy đủ thông tin.");
            return;
        }
        setCreating(true);
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.post(endpoints.surveys, {
                title,
                description,
                deadline
            });
            setCreatedSurveyId(res.data.id); // Lưu lại surveyId vừa tạo
            setShowModal(false);
            setTitle("");
            setDescription("");
            setDeadline("");
            setOptionList([]); // reset option list
            setShowOptionModal(true); // Mở modal tạo option
            fetchSurveys();
        } catch (error) {
            alert("Không thể tạo khảo sát mới.");
        } finally {
            setCreating(false);
        }
    };

    // Hàm thêm option cho khảo sát
    const handleAddOption = async (e) => {
        e.preventDefault();
        if (!optionText.trim()) {
            alert("Vui lòng nhập nội dung lựa chọn.");
            return;
        }
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            await api.post(endpoints.surveyOptions, {
                id: Number(createdSurveyId),
                option_text: optionText.trim()
            });
            setOptionText("");
            fetchOptions(createdSurveyId);
        } catch (error) {
            alert(JSON.stringify(error.response?.data || error.message));
        }
    };

    const fetchOptions = async (surveyId) => {
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.get(endpoints.surveys + `${surveyId}/get-options/`);
            setOptionList(res.data.map(opt => opt.option_text));
        } catch (error) {
            setOptionList([]);
        }
    };

    useEffect(() => {
        fetchSurveys();
    }, []);

    return (
        <div style={{
            maxWidth: 800,
            margin: "40px auto",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px #e0e0e0",
            padding: 32,
            fontFamily: "Segoe UI, Arial, sans-serif"
        }}>
            <h2 style={{
                textAlign: "center",
                marginBottom: 24,
                color: "#FF6F61",
                textTransform: "uppercase"
            }}>
                Quản lý Khảo sát
            </h2>

            <div style={{ textAlign: "right", marginBottom: 24 }}>
                <button
                    style={{
                        background: "#2196F3",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 24px",
                        fontWeight: 600,
                        cursor: "pointer"
                    }}
                    onClick={() => setShowModal(true)}
                >
                    + Tạo khảo sát mới
                </button>
            </div>

            {/* Modal tạo khảo sát */}
            {showModal && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 32,
                        minWidth: 400,
                        boxShadow: "0 4px 24px #e0e0e0",
                        position: "relative"
                    }}>
                        <button
                            onClick={() => setShowModal(false)}
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
                        <h3 style={{ marginBottom: 18, textAlign: "center", color: "#2196F3" }}>Tạo khảo sát mới</h3>
                        <form onSubmit={handleCreateSurvey} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <input
                                type="text"
                                placeholder="Tiêu đề khảo sát"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                            />
                            <textarea
                                placeholder="Mô tả (không bắt buộc)"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", minHeight: 60 }}
                            />
                            <input
                                type="datetime-local"
                                placeholder="Hạn chót"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                                style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                            />
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        background: "#ccc",
                                        color: "#333",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "8px 18px",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    style={{
                                        background: "#2196F3",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "8px 18px",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    {creating ? "Đang tạo..." : "Tạo khảo sát"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal tạo option khảo sát */}
            {showOptionModal && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 32,
                        minWidth: 400,
                        boxShadow: "0 4px 24px #e0e0e0",
                        position: "relative"
                    }}>
                        <button
                            onClick={() => setShowOptionModal(false)}
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
                        <h3 style={{ marginBottom: 18, textAlign: "center", color: "#2196F3" }}>Thêm lựa chọn khảo sát</h3>
                        <form onSubmit={handleAddOption} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                            <input
                                type="text"
                                placeholder="Nhập lựa chọn"
                                value={optionText}
                                onChange={e => setOptionText(e.target.value)}
                                style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                            />
                            <button
                                type="submit"
                                style={{
                                    background: "#2196F3",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "8px 18px",
                                    fontWeight: 600,
                                    cursor: "pointer"
                                }}
                            >
                                Thêm
                            </button>
                        </form>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                            <h4 style={{ margin: "12px 0", color: "#2196F3" }}>Các lựa chọn đã tạo</h4>
                            {optionList.map((opt, idx) => (
                                <li key={idx} style={{
                                    padding: "6px 0",
                                    borderBottom: "1px solid #eee"
                                }}>{opt}</li>
                            ))}
                        </ul>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                            <button
                                onClick={() => setShowOptionModal(false)}
                                style={{
                                    background: "#ccc",
                                    color: "#333",
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "8px 18px",
                                    fontWeight: 600,
                                    cursor: "pointer"
                                }}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: "center", marginTop: 40 }}>
                    <span className="spinner-border text-danger" role="status" />
                    <span style={{ marginLeft: 12 }}>Đang tải...</span>
                </div>
            ) : error ? (
                <div style={{ color: "red", textAlign: "center" }}>{error}</div>
            ) : surveys.length === 0 ? (
                <div style={{ textAlign: "center", color: "#888" }}>Không có khảo sát nào để hiển thị.</div>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f8fafc" }}>
                            <th style={{ padding: 12 }}>Tiêu đề</th>
                            <th style={{ padding: 12 }}>Mô tả</th>
                            <th style={{ padding: 12 }}>Hạn chót</th>
                            <th style={{ padding: 12 }}>Trạng thái</th>
                            <th style={{ padding: 12 }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {surveys.map(item => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: 12 }}>{item.title}</td>
                                <td style={{ padding: 12 }}>{item.description || ""}</td>
                                <td style={{ padding: 12 }}>
                                    {item.deadline ? new Date(item.deadline).toLocaleString("vi-VN") : ""}
                                </td>
                                <td style={{ padding: 12 }}>
                                    {item.active
                                        ? <span style={{ color: "#388e3c", fontWeight: 600 }}>Đang hoạt động</span>
                                        : <span style={{ color: "#d32f2f", fontWeight: 600 }}>Đã khóa</span>
                                    }
                                </td>
                                <td style={{ padding: 20 }}>
                                    <button
                                        style={{
                                            background: "#2196F3",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 8,
                                            padding: "6px 18px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            marginRight: 8,
                                            marginBottom: 10
                                        }}
                                        onClick={() => {
                                            setCreatedSurveyId(item.id);
                                            //setOptionList([]); // reset danh sách option hiển thị
                                            fetchOptions(item.id);
                                            setShowOptionModal(true);
                                        }}
                                    >
                                        Tạo các lựa chọn
                                    </button>
                                    <button
                                        style={{
                                            background: "#4CAF50",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 8,
                                            padding: "6px 18px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            marginBottom: 10
                                        }}
                                        onClick={() => navigate(`/admin/survey/${item.id}/responses`, {
                                            state: { surveyId: item.id, surveyTitle: item.title }
                                        })}
                                    >
                                        Xem phản hồi
                                    </button>
                                    {item.active && (
                                        <button
                                            style={{
                                                background: "#ff3c00ff",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 8,
                                                padding: "6px 18px",
                                                cursor: "pointer",
                                                fontWeight: 600,
                                            }}
                                            onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem("access_token");
                                                    const api = authApis(token);
                                                    await api.patch(endpoints.setSurveyActive(item.id), { id: item.id, active: false });
                                                    fetchSurveys();
                                                } catch (error) {
                                                    alert("Không thể mở khóa khảo sát.");
                                                }
                                            }}
                                        >
                                            Khóa
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminSurvey;