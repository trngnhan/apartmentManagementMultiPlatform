import React, { useState } from "react";
import api, { authApis, endpoints } from "../configs/Apis";
import { useNavigate } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            // Gửi yêu cầu lấy token
            const res = await api.post(
                endpoints.login,
                {
                    grant_type: "password",
                    username,
                    password,
                    client_id: "fSVZKEXevRpuWBe2OsdrbiOUEglfk2NvWmWeSixY",
                    client_secret: "w4sBJ4bSQo1xHfk9K7QGDwOsZgxXjsO2z2UGFpus2550d4gIY6JFovlPfnUP4NOBYsmNsoqwhOlSEStGmvstMNE4Zmbg9h6F8m1pVqjzcJgz7IIZyAktB1IhsHuwld1E"
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            console.log(res.data);

            if (res.data.access_token) {
                localStorage.setItem("access_token", res.data.access_token);

                const userRes = await authApis(res.data.access_token).get(endpoints["current-user"]);
                const user = userRes.data;

                if (user.active === false) {
                    setError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
                    setLoading(false);
                    return;
                }

                localStorage.setItem("user", JSON.stringify({
                    token: res.data.access_token,
                    ...user,
                }));

                setSuccess("Đăng nhập thành công!");
                setError("");
                if (user.is_superuser) {
                    navigate("/admin/home");
                } else {
                    navigate("/resident/home");
                }
            } else {
                setError("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
            }
        } catch (err) {
            if (err.response) {
                console.log("Lỗi từ server:", err.response.data);
                setError(err.response.data.error_description || "Tên đăng nhập hoặc mật khẩu không đúng.");
            } else {
                setError("Có lỗi xảy ra. Vui lòng thử lại.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Segoe UI, Arial, sans-serif",
            }}
        >
            <div
                style={{
                    background: "#fff",
                    padding: "40px 60px",
                    borderRadius: 16,
                    boxShadow: "0 8px 32px rgba(44, 62, 80, 0.15)",
                    width: 350,
                }}
            >
                <h2 style={{ textAlign: "center", marginBottom: 22, color: "#2d3a4b" }}>
                    Đăng nhập
                </h2>
                <h4 style={{ textAlign: "center", marginBottom: 32, color: "#2d3a4b" }}>
                    Chào mừng bạn đã trở lại! Vui lòng đăng nhập để tiếp tục.
                </h4>
                {error && (
                    <div style={{ color: "red", marginBottom: 16, textAlign: "center" }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{ color: "green", marginBottom: 16, textAlign: "center" }}>
                        {success}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ fontWeight: 500, color: "#2d3a4b" }}>
                            Tên đăng nhập
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                marginTop: 8,
                                border: "1px solid #dbeafe",
                                borderRadius: 8,
                                outline: "none",
                                fontSize: 16,
                                transition: "border 0.2s",
                            }}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ fontWeight: 500, color: "#2d3a4b" }}>
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                marginTop: 8,
                                border: "1px solid #dbeafe",
                                borderRadius: 8,
                                outline: "none",
                                fontSize: 16,
                                transition: "border 0.2s",
                            }}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            width: "100%",
                            padding: "12px 0",
                            background: "linear-gradient(90deg, #74ebd5 0%, #ACB6E5 100%)",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 16,
                            border: "none",
                            borderRadius: 8,
                            cursor: loading ? "not-allowed" : "pointer",
                            boxShadow: "0 2px 8px rgba(44, 62, 80, 0.08)",
                            transition: "background 0.2s",
                            opacity: loading ? 0.7 : 1,
                        }}
                        disabled={loading}
                    >
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;