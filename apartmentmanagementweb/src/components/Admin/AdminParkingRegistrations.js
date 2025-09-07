import React, { useEffect, useState } from "react";
import { Table, Select, Button, Popconfirm, message, Typography, Spin } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { endpoints, authApis } from "../../configs/Apis";

const { Option } = Select;
const { Title } = Typography;

function AdminParkingRegistrations() {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatuses, setSelectedStatuses] = useState({});
    const [updatingId, setUpdatingId] = useState(null);

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.get(endpoints.visitorVehicleRegistrations);
            setRegistrations(res.data.results || res.data);
        } catch (err) {
            setRegistrations([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRegistrations();
        // eslint-disable-next-line
    }, []);

    const approveRegister = async (id, status) => {
        setUpdatingId(id);
        setSelectedStatuses(prev => ({ ...prev, [id]: status }));
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.patch(endpoints.approveVisitorVehicleRegistration(id), {
                approved: status
            });
            if (res.status === 200 || res.status === 204) {
                alert("Cập nhật trạng thái thành công!");
                fetchRegistrations();
            } else {
                alert("Không thể cập nhật trạng thái.");
            }
        } catch (err) {
            alert("Có lỗi xảy ra.");
        }
        setUpdatingId(null);
    };

    const handleDeleteRegistration = async (id) => {
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.delete(`${endpoints.visitorVehicleRegistrations}${id}/`);
            if (res.status === 204 || res.status === 200) {
                setRegistrations(prev => prev.filter(item => item.id !== id));
                message.success("Đã xoá đăng ký gửi xe.");
            } else {
                message.error("Không thể xoá đăng ký gửi xe.");
            }
        } catch (err) {
            message.error("Có lỗi xảy ra khi xoá đăng ký gửi xe.");
        }
    };

    const columns = [
        {
            title: "Tên khách",
            dataIndex: "visitor_name",
            key: "visitor_name",
            render: (text) => <b style={{ color: "#ff4081" }}>{text}</b>
        },
        {
            title: "Biển số xe",
            dataIndex: "vehicle_number",
            key: "vehicle_number"
        },
        {
            title: "Cư dân đăng ký",
            key: "resident",
            render: (_, record) =>
                `${record.first_name || ""} ${record.last_name || ""}`.trim() || "Không xác định"
        },
        {
            title: "Ngày gửi",
            dataIndex: "registration_date",
            key: "registration_date",
            render: (date) =>
                date
                    ? new Date(date).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                    })
                    : ""
        },
        {
            title: "Trạng thái",
            dataIndex: "approved",
            key: "approved",
            render: (status, record) => (
                <Select
                    value={selectedStatuses[record.id] || status || "NEW"}
                    style={{
                        width: 140,
                        background: "#f0f0f0",
                        borderRadius: 6,
                        fontWeight: 600
                    }}
                    onChange={async (value) => {
                        setSelectedStatuses((prev) => ({ ...prev, [record.id]: value }));
                        if (value !== status) {
                            await approveRegister(record.id, value);
                        }
                    }}
                    loading={updatingId === record.id}
                >
                    <Option value="NEW">Mới</Option>
                    <Option value="APPROVED">Đồng ý</Option>
                    <Option value="REJECTED">Không đồng ý</Option>
                </Select>
            )
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Popconfirm
                    title="Bạn có chắc muốn xoá đăng ký gửi xe này?"
                    onConfirm={() => handleDeleteRegistration(record.id)}
                    okText="Xoá"
                    cancelText="Hủy"
                >
                    <Button
                        style={{ width: 80, height: 32, fontWeight: "bold" }}
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                    >
                        Xoá
                    </Button>
                </Popconfirm>
            )
        }
    ];

    return (
        <div
            style={{
                maxWidth: 1100,
                margin: "40px auto",
                padding: 32,
                background: "linear-gradient(135deg, #f8fafc 60%, #fdd301ff 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
                minHeight: 600
            }}
        >
            <Title
                level={3}
                style={{
                    textAlign: "center",
                    color: "#0F4C75",
                    marginBottom: 32,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    fontWeight: 700
                }}
            >
                Danh sách đăng ký gửi xe
            </Title>
            {loading ? (
                <div style={{ textAlign: "center", margin: "40px 0" }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 12 }}>Đang tải danh sách đăng ký gửi xe...</div>
                </div>
            ) : (
                <Table
                    dataSource={registrations}
                    columns={columns}
                    rowKey={(record) => record.id}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: "Không có đăng ký nào." }}
                    bordered
                    style={{
                        background: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 2px 12px #e0e0e0",
                        overflow: "hidden"
                    }}
                />
            )}
        </div>
    );
}

export default AdminParkingRegistrations;