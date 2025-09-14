import React, { useState } from "react";
import { Typography, Input, Button, Upload, message, Card } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { endpoints, authApis } from "../configs/Apis";

const { Title } = Typography;

function UpdateProfile() {
    const [photo, setPhoto] = useState(null);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const navigate = useNavigate();

    const handleUploadPhoto = (info) => {
        if (info.file.status === "done" || info.file.status === "uploading") {
            setPhoto(info.file.originFileObj);
        }
    };

    const handleUpdateProfile = async () => {
        if (!password) {
            setMsg("Please enter a new password.");
            return;
        }
        setMsg(null);
        setLoading(true);
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                message.error("User data not found. Please log in again.");
                navigate("/login");
                return;
            }
            const parsedUser = JSON.parse(userStr);

            const formData = new FormData();
            formData.append("password", password);
            formData.append("must_change_password", "False");

            if (photo) {
                formData.append("profile_picture", photo);
            }

            const api = authApis(parsedUser.token || localStorage.getItem("access_token"));
            const res = await api.patch(endpoints["current-user"], formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (res.status === 200) {
                const updatedUser = {
                    ...parsedUser,
                    must_change_password: false,
                    profile_picture: res.data.profile_picture,
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                message.success("Cập nhật thành công!");
                if (parsedUser.is_superuser) {
                    navigate("/admin/home");
                } else {
                    navigate("/resident/home");
                }
            } else {
                message.error(`Failed to update profile: ${res.data.detail || "Unknown error"}`);
            }
        } catch (error) {
            message.error("An error occurred while updating your profile. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div
            style={{
                maxWidth: 400,
                margin: "40px auto",
                padding: 24,
                background: "linear-gradient(135deg, #fff 60%, #d7d2cc 100%)",
                borderRadius: 18,
                boxShadow: "0 6px 32px #e0e0e0",
            }}
        >
            <Card>
                <Title level={3} style={{ color: "#1976D2", marginBottom: 10 }}>
                    Update Your Profile
                </Title>
                {msg && <div style={{ color: "red", marginBottom: 10 }}>{msg}</div>}
                {photo && (
                    <img
                        src={URL.createObjectURL(photo)}
                        alt="avatar"
                        style={{ width: 100, height: 100, marginBottom: 10, borderRadius: 10, objectFit: "cover" }}
                    />
                )}
                <Upload
                    beforeUpload={() => false}
                    showUploadList={false}
                    onChange={handleUploadPhoto}
                    accept="image/*"
                >
                    <Button icon={<UploadOutlined />}>Upload Photo</Button>
                </Upload>
                <Input.Password
                    style={{ marginTop: 16, marginBottom: 16 }}
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <Button
                    type="primary"
                    block
                    onClick={handleUpdateProfile}
                    loading={loading}
                >
                    Update Profile
                </Button>
            </Card>
        </div>
    );
}

export default UpdateProfile;