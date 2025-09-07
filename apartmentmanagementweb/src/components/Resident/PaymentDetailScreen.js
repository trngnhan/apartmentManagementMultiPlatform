import React, { useState } from "react";
import { Typography, Button, Spin, Alert, message, Card } from "antd";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

function PaymentDetailScreen() {
    const { categoryId } = useParams();
    const location = useLocation();
    // Lấy categoryName và amount từ state hoặc query nếu có
    const categoryName = location.state?.categoryName || "";
    const amount = location.state?.amount || "";

    const [loading, setLoading] = useState(false);

    const handlePayOnline = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                message.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                setLoading(false);
                return;
            }
            const url = `https://c899f13fae22.ngrok-free.app/paymenttransactions/${categoryId}/create-vnpay-payment/`;
            const response = await axios.post(
                url,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const payUrl = response.data?.vnpay_response?.payUrl;
            if (payUrl && typeof payUrl === "string") {
                window.open(payUrl, "_blank");
            } else {
                message.error("Không nhận được link thanh toán VNPay hợp lệ từ server.");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            message.error(`Khởi tạo thanh toán thất bại: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                maxWidth: 500,
                margin: "40px auto",
                padding: 24,
                background: "linear-gradient(135deg, #fff 60%, #e3e6e8 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
            }}
        >
            <Card>
                <Title level={3} style={{ color: "#1976D2", marginBottom: 10 }}>
                    Thanh toán phí
                </Title>
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                    Khoản phí: {categoryName}
                </Text>
                <br />
                <Text style={{ fontSize: 16, margin: "10px 0", display: "block" }}>
                    Số tiền: {parseInt(amount).toLocaleString("vi-VN")} VND
                </Text>
                <Button
                    type="primary"
                    size="large"
                    style={{ background: "#1976D2", marginTop: 16, width: "100%" }}
                    onClick={handlePayOnline}
                    disabled={loading}
                >
                    {loading ? <Spin /> : "Thanh toán VNPay"}
                </Button>
                <div style={{ marginTop: 30, color: "#888", textAlign: "center" }}>
                    Nhấn "Thanh toán VNPay" để mở trang thanh toán trên web VNPay.
                </div>
            </Card>
        </div>
    );
}

export default PaymentDetailScreen;