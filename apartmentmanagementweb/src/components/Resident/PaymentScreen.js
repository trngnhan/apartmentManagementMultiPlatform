import React, { useEffect, useState } from "react";
import { Card, Typography, Button, Spin, Input, Tag, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { endpoints, authApis } from "../../configs/Apis";

const { Title, Paragraph, Text } = Typography;

function PaymentScreen() {
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [submittedPaymentIds, setSubmittedPaymentIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const navigate = useNavigate();

    const frequencyDisplay = (frequency) => {
        switch (frequency) {
            case "ONE_TIME":
                return "Một lần";
            case "MONTHLY":
                return "Hàng tháng";
            case "QUARTERLY":
                return "Hàng quý";
            case "YEARLY":
                return "Hàng năm";
            default:
                return frequency;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const userStr = localStorage.getItem("user");
                const token = localStorage.getItem("access_token");
                if (!token || !userStr) {
                    setLoading(false);
                    return;
                }
                const user = JSON.parse(userStr);
                const api = authApis(token);

                const categoriesResponse = await api.get(endpoints.paymentCategories);
                const categoriesData = categoriesResponse.data;

                const transactionsResponse = await api.get(endpoints.myPayments);
                const transactionsData = transactionsResponse.data;

                setCategories(categoriesData);
                setTransactions(transactionsData);

                // Cập nhật danh sách khoản phí đã thanh toán (dựa trên chu kỳ)
                const now = new Date();
                const paidIds = new Set();
                transactionsData.forEach(tx => {
                    if (tx.status === 'COMPLETED' || tx.status === 'SUCCESS') {
                        const paidDate = new Date(tx.paid_date);
                        const isMonthly = categoriesData.find(c => c.id === tx.category.id)?.frequency === 'MONTHLY';
                        if (!isMonthly || (paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear())) {
                            paidIds.add(tx.category.id);
                        }
                    }
                });
                setSubmittedPaymentIds(paidIds);

            } catch (error) {
                setCategories([]);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Lọc các hóa đơn mà cư dân này được chọn
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : {};
    const residentId = user.resident_id;

    const filteredCategories = categories.filter(
        item =>
            item.active === true &&
            item.resident === residentId &&
            (
                item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchText.toLowerCase())
            )
    );

    return (
        <div
            style={{
                maxWidth: 700,
                margin: "40px auto",
                padding: 24,
                background: "linear-gradient(135deg, #fff 60%, #f8fafc 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
                minHeight: 500,
            }}
        >
            <Title level={3} style={{ color: "#FF6F61", textAlign: "center", marginBottom: 18 }}>
                DANH SÁCH CÁC KHOẢN PHÍ
            </Title>
            <Input
                placeholder="Tìm kiếm khoản phí..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{
                    borderRadius: 8,
                    marginBottom: 18,
                    background: "#fff",
                    fontSize: 16,
                    color: "#222",
                }}
                allowClear
            />
            {loading ? (
                <div style={{ textAlign: "center", margin: "40px 0" }}>
                    <Spin size="large" />
                </div>
            ) : filteredCategories.length === 0 ? (
                <Alert message="Không có khoản phí nào" type="info" showIcon />
            ) : (
                filteredCategories.map(item => {
                    const isSubmitted = submittedPaymentIds.has(item.id);
                    return (
                        <Card
                            key={item.id}
                            style={{
                                borderRadius: 12,
                                background: "#fff",
                                boxShadow: "0 2px 8px #e0e0e0",
                                marginBottom: 20,
                            }}
                        >
                            <Card.Meta
                                title={
                                    <span style={{
                                        fontSize: 18,
                                        fontWeight: "bold",
                                        color: isSubmitted ? "#888" : "#222",
                                        textDecoration: isSubmitted ? "line-through" : "none",
                                        textAlign: "center",
                                        display: "block",
                                        textTransform: "uppercase",
                                    }}>
                                        {item.name}
                                    </span>
                                }
                                description={
                                    <>
                                        <Paragraph>
                                            Số tiền: <Text style={{ color: "#FF6F61", fontWeight: "bold" }}>{parseInt(item.amount).toLocaleString('vi-VN')} VND</Text>
                                        </Paragraph>
                                        <Paragraph>
                                            Tần suất: <Text strong>{frequencyDisplay(item.frequency)}</Text>
                                        </Paragraph>
                                        <Paragraph>
                                            Loại phí: <Text strong>
                                                {item.category_type === "MAINTENANCE" ? "Bảo trì" :
                                                    item.category_type === "UTILITY" ? "Tiện ích" :
                                                        item.category_type === "SERVICE" ? "Dịch vụ" : item.category_type}
                                            </Text>
                                        </Paragraph>
                                        <Paragraph>
                                            Định kỳ: <Text strong>{item.is_recurring ? "Có" : "Không"}</Text>
                                        </Paragraph>
                                        <Paragraph>
                                            Thời gian ân hạn: <Text strong>{item.grace_period} ngày</Text>
                                        </Paragraph>
                                        <Paragraph>
                                            Thuế: <Text strong>{parseInt(item.tax_percentage)}%</Text>
                                        </Paragraph>
                                        {item.description && (
                                            <Paragraph>
                                                Mô tả: <Text>{item.description}</Text>
                                            </Paragraph>
                                        )}
                                        {isSubmitted && item.is_recurring && (
                                            <Tag color="green" style={{ fontStyle: "italic", fontWeight: "bold" }}>
                                                Đã thanh toán cho chu kỳ này
                                            </Tag>
                                        )}
                                        {isSubmitted && !item.is_recurring && (
                                            <Tag color="green" style={{ fontStyle: "italic", fontWeight: "bold" }}>
                                                Đã thanh toán
                                            </Tag>
                                        )}
                                    </>
                                }
                            />
                            {!isSubmitted && (
                                <div style={{ textAlign: "right", marginTop: 10 }}>
                                    <Button
                                        type="primary"
                                        style={{
                                            background: "#FF6F61",
                                            borderRadius: 15,
                                            fontWeight: "bold",
                                            padding: "0 24px"
                                        }}
                                        onClick={() => navigate(`/resident/payment-detail/${item.id}`, {
                                            state: {
                                                categoryName: item.name,
                                                amount: item.amount,
                                            }
                                        })}
                                    >
                                        Thanh toán
                                    </Button>
                                </div>
                            )}
                        </Card>
                    );
                })
            )}
        </div>
    );
}

export default PaymentScreen;