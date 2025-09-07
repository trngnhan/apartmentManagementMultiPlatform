import React, { useState } from "react";
import { Form, Input, Button, Alert, Typography, Spin, message } from "antd";
import { CarOutlined, UserOutlined } from "@ant-design/icons";
import { endpoints, authApis } from "../../configs/Apis";

const { Title, Paragraph } = Typography;

function RegisterVehicle({ navigate }) {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem("user");
            const token = localStorage.getItem("access_token");
            if (!userStr) {
                message.error("Không tìm thấy thông tin người dùng.");
                setLoading(false);
                return;
            }
            const user = JSON.parse(userStr);
            const api = authApis(token);
            const now = new Date().toISOString();

            const res = await api.post(endpoints.visitorVehicleRegistrations, {
                resident: user.resident_id,
                resident_email: user.email,
                visitor_name: values.visitorName,
                vehicle_number: values.vehicleNumber,
                registration_date: now,
            });

            if (res.status === 201 || res.status === 200) {
                alert("Đăng ký xe thành công.");
                form.resetFields();
                if (navigate) navigate(-1);
            } else {
                alert(res.data?.detail || "Đăng ký xe thất bại.");
            }
        } catch (error) {
            alert("Đã xảy ra lỗi. Vui lòng thử lại.");
        }
        setLoading(false);
    };

    return (
        <div
            style={{
                maxWidth: 680,
                margin: "40px auto",
                padding: 32,
                background: "linear-gradient(135deg, #fff 60%, #FFBAC3 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
            }}
        >
            <Title level={3} style={{ color: "#FF6F61", textAlign: "center", marginBottom: 18 }}>
                ĐĂNG KÝ XE CHO NGƯỜI THÂN
            </Title>
            <Alert
                message="LƯU Ý"
                description={
                    <Paragraph style={{ margin: 0, fontSize: 14 }}>
                        - Đăng ký xe cho người thân trong gia đình.<br />
                        - Không đăng ký xe cho người ngoài.<br />
                        - Không đăng ký xe cho người không có giấy tờ tùy thân.<br />
                        - Không đăng ký xe cho người không có giấy tờ xe.<br />
                        - Không đăng ký xe cho người không có giấy tờ chứng minh quan hệ với người thân.<br />
                        - Chỉ chấp nhận các loại xe được pháp luật cho phép lưu hành.<br />
                        - Người thân của cư dân có đăng ký trước với Ban quản lý.<br />
                        - Xe đăng ký phải có biển số rõ ràng, hợp lệ.<br />
                        - Không đăng ký xe có dấu hiệu bị thay đổi kết cấu trái phép.<br />
                        - Không đăng ký xe đang trong diện tranh chấp, bị báo mất cắp hoặc bị cơ quan chức năng tạm giữ.<br />
                        - Chủ xe chịu trách nhiệm về mọi thông tin đã đăng ký.<br />
                        - Ban quản lý có quyền từ chối hoặc hủy đăng ký nếu phát hiện thông tin sai lệch.<br />
                        - Thời gian đăng ký xe chỉ có hiệu lực trong thời gian cư dân sinh sống tại chung cư.<br />
                        - Khi có thay đổi về thông tin xe hoặc người thân, cư dân phải cập nhật lại với Ban quản lý.
                    </Paragraph>
                }
                type="warning"
                showIcon
                style={{
                    marginBottom: 18,
                    background: "#fff3e6",
                    borderLeft: "5px solid #FF6F61",
                    borderRadius: 10,
                }}
            />
            <Paragraph style={{ textAlign: "center", marginBottom: 18, fontSize: 16 }}>
                Nhập thông tin xe của người thân để đăng ký.
            </Paragraph>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
                style={{ marginTop: 8 }}
            >
                <Form.Item
                    name="visitorName"
                    label="Tên khách"
                    rules={[{ required: true, message: "Vui lòng nhập tên khách!" }]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="Tên khách"
                        size="large"
                    />
                </Form.Item>
                <Form.Item
                    name="vehicleNumber"
                    label="Biển số xe"
                    rules={[{ required: true, message: "Vui lòng nhập biển số xe!" }]}
                >
                    <Input
                        prefix={<CarOutlined />}
                        placeholder="Biển số xe"
                        size="large"
                    />
                </Form.Item>
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        size="large"
                        style={{
                            background: "#FF6F61",
                            border: "none",
                            fontWeight: "bold",
                            letterSpacing: 1,
                        }}
                        disabled={loading}
                    >
                        {loading ? <Spin /> : "Đăng ký"}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

export default RegisterVehicle;