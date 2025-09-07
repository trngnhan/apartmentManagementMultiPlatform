import React, { useEffect, useState } from "react";
import { endpoints, authApis } from "../../configs/Apis";
import { useLocation, useParams } from "react-router-dom";

function AdminSurveyResponses() {
    // Lấy surveyId từ params hoặc location.state
    const { surveyId: paramSurveyId } = useParams();
    const location = useLocation();
    const surveyId = paramSurveyId || location.state?.surveyId;

    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchResponses = async () => {
        console.log("Fetching responses for surveyId:", surveyId);
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.get(endpoints.surveyResponsesBySurvey(surveyId));
            setResponses(res.data.results || res.data);
            setError(null);
        } catch (error) {
            setError("Đã xảy ra lỗi khi tải danh sách phản hồi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (surveyId) fetchResponses();
    }, [surveyId]);

    return (
        <div style={{
            maxWidth: 700,
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
                color: "#FF6F61"
            }}>
                Phản hồi Khảo sát
            </h2>
            {loading ? (
                <div style={{ textAlign: "center", marginTop: 40 }}>
                    <span className="spinner-border text-danger" role="status" />
                    <span style={{ marginLeft: 12 }}>Đang tải...</span>
                </div>
            ) : error ? (
                <div style={{ color: "red", textAlign: "center" }}>{error}</div>
            ) : responses.length === 0 ? (
                <div style={{ textAlign: "center", color: "#888" }}>Không có phản hồi nào để hiển thị.</div>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f8fafc" }}>
                            <th style={{ padding: 12 }}>Cư dân</th>
                            <th style={{ padding: 12 }}>Email</th>
                            <th style={{ padding: 12 }}>Phản hồi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {responses.map(item => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: 12 }}>
                                    {item.first_name && item.last_name
                                        ? `${item.first_name} ${item.last_name}`
                                        : "Không xác định"}
                                </td>
                                <td style={{ padding: 12 }}>{item.resident_email || "Không xác định"}</td>
                                <td style={{ padding: 12 }}>{item.option_text || "Không xác định"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminSurveyResponses;