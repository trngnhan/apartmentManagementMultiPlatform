import React, { useEffect, useState } from "react";
import { Card, Typography, Radio, Button, message, Spin, Alert } from "antd";
import { endpoints, authApis } from "../../configs/Apis";

const { Title, Paragraph, Text } = Typography;

function SurveyListScreen() {
    const [surveys, setSurveys] = useState([]);
    const [responses, setResponses] = useState({});
    const [submittedSurveyIds, setSubmittedSurveyIds] = useState(new Set());
    const [loading, setLoading] = useState(true);

    const fetchSurveys = async (token) => {
        try {
            const api = authApis(token);
            const res = await api.get(endpoints.surveys || "/surveys/");
            if (res.status === 200) {
                setSurveys(res.data);
            } else {
                message.error("Không thể tải danh sách khảo sát.");
            }
        } catch (err) {
            message.error("Lỗi khi tải khảo sát.");
        }
    };

    const fetchMyResponses = async (token) => {
        try {
            const api = authApis(token);
            const res = await api.get(endpoints.mySurveyResponses || "/surveyresponses/");
            if (res.status === 200) {
                const data = res.data;
                const surveyIds = new Set(data.map((r) => r.survey));
                setSubmittedSurveyIds(surveyIds);

                const prefillResponses = {};
                data.forEach((r) => {
                    prefillResponses[r.survey] = r.option.toString();
                });
                setResponses(prefillResponses);
            }
        } catch (err) {
            message.error("Lỗi khi tải phản hồi.");
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const token = localStorage.getItem("access_token");
            if (token) {
                await fetchSurveys(token);
                await fetchMyResponses(token);
            } else {
                message.error("Không tìm thấy token.");
            }
            setLoading(false);
        };
        loadData();
    }, []);

    const submitResponse = async (surveyId, optionId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            console.log("Gửi phản hồi:", { survey: surveyId, option: optionId });
            const res = await api.post(endpoints.surveyResponses || "/surveyresponses/", {
                survey: surveyId,
                option: optionId,
            });
            console.log("Kết quả API:", res);
            if (res.status === 201 || res.status === 200) {
                message.success("Bạn đã phản hồi khảo sát.");
                setResponses((prev) => ({ ...prev, [surveyId]: optionId.toString() }));
                setSubmittedSurveyIds((prev) => new Set(prev).add(surveyId));
            } else {
                message.error(res.data?.detail || "Không thể gửi phản hồi.");
            }
        } catch (err) {
            console.error("Lỗi gửi phản hồi:", err);
            message.error("Không thể gửi phản hồi.");
        }
        setLoading(false);
    };

    return (
        <div
            style={{
                maxWidth: 600,
                margin: "40px auto",
                padding: 20,
                background: "linear-gradient(135deg, #fff 60%, #f8fafc 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
                minHeight: 400,
            }}
        >
            <Title level={3} style={{ color: "#FF6F61", textAlign: "center", marginBottom: 18 }}>
                DANH SÁCH KHẢO SÁT
            </Title>
            {loading ? (
                <div style={{ textAlign: "center", margin: "40px 0" }}>
                    <Spin size="large" />
                </div>
            ) : surveys.length === 0 ? (
                <Alert message="Không có khảo sát nào." type="info" showIcon />
            ) : (
                surveys.map((survey) => {
                    const isSubmitted = submittedSurveyIds.has(survey.id);
                    return (
                        <Card
                            key={survey.id}
                            style={{
                                marginBottom: 18,
                                borderRadius: 12,
                                background: "#fff",
                                boxShadow: "0 2px 8px #e0e0e0",
                            }}
                        >
                            <Title level={5} style={{ color: "#222", marginBottom: 4 }}>
                                {survey.title}
                            </Title>
                            <Paragraph style={{ color: "#666", marginBottom: 10 }}>
                                {survey.description}
                            </Paragraph>
                            {isSubmitted ? (
                                <Text type="success" style={{ fontStyle: "italic", fontWeight: "bold" }}>
                                    Cư dân đã thực hiện khảo sát này.
                                </Text>
                            ) : (
                                <>
                                    <Radio.Group
                                        onChange={e =>
                                            setResponses((prev) => ({
                                                ...prev,
                                                [survey.id]: e.target.value,
                                            }))
                                        }
                                        value={responses[survey.id]}
                                        style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}
                                    >
                                        {survey.options.map((opt) => (
                                            <Radio key={opt.id} value={opt.id.toString()} style={{ fontSize: 15 }}>
                                                {opt.option_text}
                                            </Radio>
                                        ))}
                                    </Radio.Group>
                                    <Button
                                        type="primary"
                                        style={{
                                            background: "#FF6F61",
                                            border: "none",
                                            fontWeight: "bold",
                                            borderRadius: 8,
                                            padding: "0 24px",
                                            float: "right",
                                        }}
                                        onClick={() => {
                                            if (!responses[survey.id]) {
                                                message.warning("Vui lòng chọn một lựa chọn.");
                                            } else {
                                                submitResponse(
                                                    parseInt(survey.id),
                                                    parseInt(responses[survey.id])
                                                );
                                            }
                                        }}
                                        disabled={loading}
                                    >
                                        Gửi phản hồi
                                    </Button>
                                </>
                            )}
                        </Card>
                    );
                })
            )}
        </div>
    );
}

export default SurveyListScreen;