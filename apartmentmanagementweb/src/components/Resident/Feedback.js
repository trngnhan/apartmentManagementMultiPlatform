import React, { useEffect, useState } from "react";
import { endpoints, authApis } from "../../configs/Apis";

function Feedback() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [myFeedbacks, setMyFeedbacks] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Lấy token từ localStorage
    const getToken = () => localStorage.getItem("access_token");

    // Lấy danh sách phản ánh của cư dân
    const fetchMyFeedbacks = async () => {
        setError("");
        try {
            const api = authApis(getToken());
            const res = await api.get(endpoints.myFeedbacks);
            if (res.status === 200) {
                setMyFeedbacks(res.data);
            } else {
                setError("Không thể tải danh sách phản ánh.");
            }
        } catch (err) {
            setError("Lỗi khi tải phản ánh.");
        }
    };

    useEffect(() => {
        fetchMyFeedbacks();
    }, []);

    // Gửi phản ánh
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!title || !content) {
            setError("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
            return;
        }
        setLoading(true);
        try {
            const api = authApis(getToken());
            const res = await api.post(endpoints.feedbacks, { title, content });
            if (res.status === 201 || res.status === 200) {
                setSuccess("Gửi phản ánh thành công.");
                setTitle("");
                setContent("");
                fetchMyFeedbacks();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(res.data.detail || "Không thể gửi phản ánh.");
            }
        } catch (err) {
            setError("Đã xảy ra lỗi khi gửi phản ánh.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            maxWidth: 600,
            margin: "40px auto",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 16px #eee",
            padding: 32
        }}>
            <h2 style={{
                textAlign: "center",
                marginBottom: 24,
                color: "#FF6F61",
                textTransform: "uppercase"
            }}>
                Gửi phản ánh
            </h2>
            {success && (
                <div style={{
                    background: "#e6ffed",
                    color: "#1a7f37",
                    border: "1px solid #b7eb8f",
                    borderRadius: 8,
                    padding: "10px 16px",
                    marginBottom: 16,
                    fontWeight: 600,
                    textAlign: "center"
                }}>
                    {success}
                </div>
            )}
            <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500, color: "#FF6F61" }}>Tiêu đề</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            marginTop: 8,
                            border: "1px solid #dbeafe",
                            borderRadius: 8,
                            outline: "none",
                            fontSize: 16,
                            background: "#fff"
                        }}
                        placeholder="Nhập tiêu đề phản ánh"
                        required
                    />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500, color: "#FF6F61" }}>Nội dung</label>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={5}
                        style={{
                            width: "100%",
                            padding: "20px 12px",
                            marginTop: 8,
                            border: "1px solid #dbeafe",
                            borderRadius: 8,
                            outline: "none",
                            fontSize: 16,
                            background: "#fff",
                            resize: "vertical"
                        }}
                        placeholder="Nhập nội dung phản ánh"
                        required
                    />
                </div>
                {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
                {success && <div style={{ color: "green", marginBottom: 12 }}>{success}</div>}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "12px 0",
                        background: "#FF6F61",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 16,
                        border: "none",
                        borderRadius: 8,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1,
                        boxShadow: "0 2px 8px rgba(44, 62, 80, 0.08)",
                        transition: "background 0.2s"
                    }}
                >
                    {loading ? "Đang gửi..." : "Gửi phản ánh"}
                </button>
            </form>

            <h3 style={{
                textAlign: "center",
                marginBottom: 18,
                color: "#222",
                fontWeight: "bold"
            }}>
                Phản ánh của bạn
            </h3>
            {myFeedbacks.length === 0 ? (
                <div style={{ color: "#888", textAlign: "center", fontSize: 15 }}>
                    Chưa có phản ánh nào.
                </div>
            ) : (
                myFeedbacks.map(fb => (
                    <div key={fb.id} style={{
                        marginBottom: 18,
                        background: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 1px 6px #e0e0e0",
                        borderLeft: "5px solid #FF6F61",
                        padding: 16
                    }}>
                        <div style={{ fontWeight: "bold", fontSize: 17, color: "#FF6F61", marginBottom: 6 }}>
                            {fb.title}
                        </div>
                        <div style={{ color: "#333", marginBottom: 6 }}>
                            {fb.content}
                        </div>
                        <div style={{
                            fontSize: 13,
                            fontWeight: "bold",
                            color:
                                fb.status === "pending"
                                    ? "#FFA500"
                                    : fb.status === "approved"
                                    ? "#eaff00ff"
                                    : "#4CAF50"
                        }}>
                            Trạng thái: {fb.status === "pending" ? "Chờ xử lý" : fb.status === "approved" ? "Đã duyệt" : fb.status}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default Feedback;