import React, { useEffect, useState } from "react";
import { Table, Select, Spin, message, Typography } from "antd";
import { endpoints, authApis } from "../../configs/Apis";
import { useParams } from "react-router-dom";

const { Option } = Select;
const { Title } = Typography;

function AdminAmenityBooking() {
    const { amenityId } = useParams();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatuses, setSelectedStatuses] = useState({});

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.get(endpoints.amenityBookings(amenityId));
            setBookings(res.data.results || res.data);
        } catch (err) {
            setBookings([]);
        }
        setLoading(false);
    };

    const handleUpdateStatus = async (bookingId, newStatus) => {
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            // Sửa endpoint PATCH vào từng booking
            const res = await api.patch(`/amenitybookings/${bookingId}/`, {
                status: newStatus
            });
            if (res.status === 200) {
                alert("Cập nhật trạng thái thành công!");
                fetchBookings();
            } else {
                alert("Không thể cập nhật trạng thái.");
            }
        } catch (err) {
            alert("Có lỗi xảy ra khi cập nhật trạng thái.");
        }
    };

    useEffect(() => {
        fetchBookings();
        // eslint-disable-next-line
    }, [amenityId]);

    const columns = [
        {
            title: "Cư dân",
            dataIndex: "resident",
            key: "resident",
            render: (resident) =>
                resident && resident.user
                    ? `${resident.user.first_name || ""} ${resident.user.last_name || ""}`.trim() || "Không xác định"
                    : "Không xác định"
        },
        {
            title: "Ngày đặt",
            dataIndex: "booking_date",
            key: "booking_date",
            render: (date) =>
                date
                    ? new Date(date).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                    })
                    : ""
        },
        {
            title: "Ngày sử dụng",
            dataIndex: "usage_date",
            key: "usage_date",
            render: (date) =>
                date
                    ? new Date(date).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                    })
                    : ""
        },
        {
            title: "Thời gian",
            key: "time",
            render: (_, record) =>
                `${record.start_time?.slice(0, 5) || ""} - ${record.end_time?.slice(0, 5) || ""}`
        },
        {
            title: "Ghi chú",
            dataIndex: "note",
            key: "note",
            render: (note) => note || "Chưa có ghi chú"
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status, record) => (
                <Select
                    value={selectedStatuses[record.id] || status || "NEW"}
                    style={{ 
                        width: 140,
                    }}
                    onChange={async (value) => {
                        setSelectedStatuses((prev) => ({ ...prev, [record.id]: value }));
                        if (value !== status) {
                            await handleUpdateStatus(record.id, value);
                        }
                    }}
                >
                    <Option value="NEW">Mới</Option>
                    <Option value="APPROVED">Đồng ý</Option>
                    <Option value="REJECTED">Không đồng ý</Option>
                </Select>
            )
        }
    ];

    return (
        <div
            style={{
                maxWidth: 1000,
                margin: "40px auto",
                padding: 32,
                background: "linear-gradient(135deg, #f8fafc 60%, #e3e6e8 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
                minHeight: 600,
            }}
        >
            <Title 
                level={3} 
                style={{
                    textAlign: "center",
                    color: "#1976d2",
                    marginBottom: 32,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                DANH SÁCH CƯ DÂN ĐĂNG KÝ TIỆN ÍCH
            </Title>
            {loading ? (
                <div style={{ textAlign: "center", margin: "40px 0" }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Table
                    dataSource={bookings}
                    columns={columns}
                    rowKey={(record) => record.id}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: "Không có đăng ký nào." }}
                    bordered
                    style={{
                        background: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 2px 12px #e0e0e0",
                        overflow: "hidden",
                    }}
                />
            )}
        </div>
    );
}

export default AdminAmenityBooking;