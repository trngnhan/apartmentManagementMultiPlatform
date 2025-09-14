import React, { useEffect, useState } from "react";
import { Card, Typography, Select, DatePicker, TimePicker, Input, Button, message, Spin, Row, Col, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { endpoints, authApis } from "../../configs/Apis";
import dayjs from "dayjs";
import { set } from "firebase/database";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

function AmenityBookingScreen() {
    const [amenities, setAmenities] = useState([]);
    const [selectedAmenity, setSelectedAmenity] = useState(null);
    const [usageDate, setUsageDate] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
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
        fetchAmenities();
    }, []);

    const handleBooking = async () => {
        if (!selectedAmenity) {
            message.warning("Vui lòng chọn tiện ích.");
            return;
        }
        if (!usageDate || !startTime || !endTime) {
            message.warning("Vui lòng nhập đầy đủ ngày sử dụng và giờ.");
            return;
        }
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            message.error("Không tìm thấy thông tin cư dân.");
            return;
        }
        const user = JSON.parse(userStr);
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const payload = {
                amenity: selectedAmenity,
                resident: user.resident_id,
                booking_date: dayjs().format("YYYY-MM-DD"),
                usage_date: usageDate.format("YYYY-MM-DD"),
                start_time: startTime.format("HH:mm"),
                end_time: endTime.format("HH:mm"),
                note: note,
                status: "NEW"
            };
            const res = await api.post(endpoints.amenityBooking, payload);
            if (res.status === 201 || res.status === 200) {
                alert("Đã gửi yêu cầu đặt tiện ích!");
                setSelectedAmenity(null);
                setUsageDate(null);
                setStartTime(null);
                setEndTime(null);
                setNote("");
                Modal.success({
                    title: "Thành công",
                    content: "Đã gửi yêu cầu đặt tiện ích!",
                    onOk: () => navigate("/resident/amenity-booking-history", { state: { residentId: user.resident_id } })
                });
            } else {
                message.error("Không thể đặt tiện ích.");
            }
        } catch (err) {
            if (err?.response?.data?.non_field_errors) {
                // Nếu lỗi trùng unique, backend sẽ trả về non_field_errors
                alert(
                    err.response.data.non_field_errors[0] ===
                    "The fields amenity, resident, booking_date, start_time must make a unique set."
                        ? "Bạn đã đặt tiện ích này vào khung giờ này rồi. Vui lòng chọn thời gian khác!"
                        : err.response.data.non_field_errors[0]
                );
            } else if (err?.response?.data?.detail) {
                alert(err.response.data.detail);
            } else {
                alert("Có lỗi xảy ra khi đặt tiện ích.");
            }
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
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <Button
                    type="default"
                    onClick={() => navigate("/resident/amenity-booking-history")}
                    style={{ fontWeight: 600 }}
                >
                    Xem các tiện ích đã đặt
                </Button>
            </div>
            <Title level={3} style={{ color: "#0F4C75", textAlign: "center", marginBottom: 18 }}>
                ĐẶT TIỆN TÍCH CHUNG CƯ
            </Title>
            {loading ? (
                <div style={{ textAlign: "center", margin: "40px 0" }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Card style={{ borderRadius: 12, boxShadow: "0 2px 8px #e0e0e0" }}>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Text strong>Chọn tiện ích</Text>
                            <Select
                                showSearch
                                style={{ width: "100%", marginBottom: 16, marginTop: 8 }}
                                placeholder="Chọn tiện ích"
                                optionFilterProp="children"
                                value={selectedAmenity}
                                onChange={setSelectedAmenity}
                                filterOption={(input, option) =>
                                    (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {amenities.map(item => (
                                    <Option key={item.id} value={item.id}>
                                        {item.name}
                                    </Option>
                                ))}
                            </Select>
                            {selectedAmenity && (
                                <div style={{ marginBottom: 16 }}>
                                    {(() => {
                                        const amenity = amenities.find(a => a.id === selectedAmenity);
                                        return amenity ? (
                                            <>
                                                {amenity.image && (
                                                    <img
                                                        src={typeof amenity.image === "string" ? amenity.image : amenity.image?.url}
                                                        alt={amenity.name}
                                                        style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
                                                    />
                                                )}
                                                <div style={{ fontWeight: "bold", color: "#4A90E2" }}>{amenity.name}</div>
                                                <div style={{ fontSize: 13 }}>{amenity.location}</div>
                                                <div style={{ fontSize: 13 }}>
                                                    {amenity.opening_time?.slice(0, 5)} - {amenity.closing_time?.slice(0, 5)}
                                                </div>
                                            </>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </Col>
                        <Col xs={24} md={12}>
                            <Text strong>Ngày sử dụng</Text>
                            <DatePicker
                                style={{ width: "100%", marginBottom: 12, marginTop: 8 }}
                                value={usageDate}
                                onChange={setUsageDate}
                                format="YYYY-MM-DD"
                                placeholder="Chọn ngày sử dụng"
                            />
                            <Row gutter={8}>
                                <Col span={12}>
                                    <Text strong>Giờ bắt đầu</Text>
                                    <TimePicker
                                        style={{ width: "100%", marginBottom: 12, marginTop: 8 }}
                                        value={startTime}
                                        onChange={setStartTime}
                                        format="HH:mm"
                                        placeholder="Giờ bắt đầu"
                                    />
                                </Col>
                                <Col span={12}>
                                    <Text strong>Giờ kết thúc</Text>
                                    <TimePicker
                                        style={{ width: "100%", marginBottom: 12, marginTop: 8 }}
                                        value={endTime}
                                        onChange={setEndTime}
                                        format="HH:mm"
                                        placeholder="Giờ kết thúc"
                                    />
                                </Col>
                            </Row>
                            <Text strong>Ghi chú (nếu có)</Text>
                            <TextArea
                                rows={2}
                                style={{ marginBottom: 12, marginTop: 8 }}
                                placeholder="Ghi chú"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                            <Button
                                type="primary"
                                block
                                style={{
                                    background: "#4A90E2",
                                    border: "none",
                                    fontWeight: "bold",
                                    borderRadius: 8,
                                    marginTop: 8
                                }}
                                onClick={handleBooking}
                            >
                                Đặt tiện ích
                            </Button>
                        </Col>
                    </Row>
                </Card>
            )}
        </div>
    );
}

export default AmenityBookingScreen;