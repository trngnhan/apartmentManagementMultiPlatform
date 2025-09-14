import React, { useEffect, useState } from "react";
import { Card, Typography, List, Spin, Alert } from "antd";
import { endpoints, authApis } from "../../configs/Apis";

const { Title, Text } = Typography;

function BookingDetailScreen() {
    const [bookings, setBookings] = useState([]);
    const [amenities, setAmenities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const userStr = localStorage.getItem("user");
                const token = localStorage.getItem("access_token");
                if (!userStr || !token) {
                    setLoading(false);
                    return;
                }
                const user = JSON.parse(userStr);
                const residentId = user.resident_id;

                const api = authApis(token);

                const resAmenities = await api.get(endpoints.amenities);
                setAmenities(resAmenities.data.results || resAmenities.data);

                const resBookings = await api.get(endpoints.myAmenityBookings(residentId));
                const allBookings = resBookings.data.results || resBookings.data;
                
                const filteredBookings = allBookings.filter(
                    b => (typeof b.resident === "object" ? b.resident.id : b.resident) === residentId
                );
                setBookings(filteredBookings);
            } catch (err) {
                setBookings([]);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const getStatusText = (status) => {
        switch (status) {
            case "NEW":
                return <span style={{ fontWeight: "bold", color: "blue" }}>Mới</span>;
            case "APPROVED":
                return <span style={{ fontWeight: "bold", color: "green" }}>Đồng ý</span>;
            case "REJECTED":
                return <span style={{ fontWeight: "bold", color: "red" }}>Không đồng ý</span>;
            default:
                return <span>{status}</span>;
        }
    };

    return (
        <div
            style={{
                maxWidth: 700,
                margin: "40px auto",
                padding: 24,
                background: "linear-gradient(135deg, #fff 60%, #b0e3c4 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
                minHeight: 500,
            }}
        >
            <Title level={3} style={{ color: "#0F4C75", textAlign: "center", marginBottom: 18 }}>
                CÁC TIỆN ÍCH ĐÃ ĐẶT
            </Title>
            {loading ? (
                <div style={{ textAlign: "center", margin: "40px 0" }}>
                    <Spin size="large" />
                </div>
            ) : bookings.length === 0 ? (
                <Alert message="Chưa có lịch sử đặt tiện ích." type="info" showIcon />
            ) : (
                <List
                    dataSource={bookings}
                    renderItem={item => {
                        const amenityObj = amenities.find(a => a.id === item.amenity || a.id === item.amenity?.id);
                        return (
                            <Card
                                style={{
                                    marginBottom: 18,
                                    borderRadius: 12,
                                    background: "#e8f5e9",
                                    boxShadow: "0 2px 8px #e0e0e0",
                                }}
                            >
                                <Title level={5} style={{ color: "#388e3c", marginBottom: 4 }}>
                                    Tên tiện ích: {amenityObj?.name || item.amenity?.name || item.amenity}
                                </Title>
                                <Text>
                                    Ngày đặt: {item.booking_date ? new Date(item.booking_date).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" }) : ""}
                                </Text>
                                <br />
                                <Text>
                                    Ngày sử dụng: {item.usage_date ? new Date(item.usage_date).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" }) : ""}
                                </Text>
                                <br />
                                <Text>
                                    Giá: {amenityObj && amenityObj.fee !== undefined && amenityObj.fee !== null
                                    ? Number(amenityObj.fee).toLocaleString("vi-VN") + " VND"
                                    : "Không xác định"}
                                </Text>
                                <br />
                                <Text>
                                    Thời gian: {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                                </Text>
                                <br />
                                <Text>
                                    Trạng thái: {getStatusText(item.status)}
                                </Text>
                                <br />
                                <Text>
                                    Ghi chú: {item.note || "Không có"}
                                </Text>
                            </Card>
                        );
                    }}
                />
            )}
        </div>
    );
}

export default BookingDetailScreen;