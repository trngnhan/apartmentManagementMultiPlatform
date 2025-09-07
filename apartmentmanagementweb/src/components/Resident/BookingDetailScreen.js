import React, { useEffect, useState } from "react";
import { Card, Typography, List, Tag, Spin, Alert } from "antd";
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
                const residentid = user.resident_id;
                const residentId = residentid;

                console.log("Resident ID:", residentId);

                const api = authApis(token);

                // Lấy danh sách tiện ích
                const resAmenities = await api.get(endpoints.amenities);
                setAmenities(resAmenities.data.results || resAmenities.data);

                // Lấy lịch sử đặt tiện ích của cư dân hiện tại
                const resBookings = await api.get(endpoints.myAmenityBookings(residentId));
                setBookings(resBookings.data.results || resBookings.data);
            } catch (err) {
                setBookings([]);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const getAmenityName = (amenityId) => {
        const amenityObj = amenities.find(a => a.id === amenityId || a.id === amenityId?.id);
        return amenityObj?.name || "";
    };

    const getStatusTag = (status) => {
        switch (status) {
            case "NEW":
                return <Tag color="blue">Mới</Tag>;
            case "APPROVED":
                return <Tag color="green">Đồng ý</Tag>;
            case "REJECTED":
                return <Tag color="red">Không đồng ý</Tag>;
            default:
                return <Tag>{status}</Tag>;
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
                                    Ngày đặt: {item.booking_date ? new Date(item.booking_date).toLocaleDateString("vi-VN") : ""}
                                </Text>
                                <br />
                                <Text>
                                    Ngày sử dụng: {item.usage_date ? new Date(item.usage_date).toLocaleDateString("vi-VN") : ""}
                                </Text>
                                <br />
                                <Text>
                                    Thời gian: {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                                </Text>
                                <br />
                                <Text>
                                    Trạng thái: {getStatusTag(item.status)}
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