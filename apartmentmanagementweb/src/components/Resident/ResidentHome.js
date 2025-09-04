import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { endpoints, authApis } from "../../configs/Apis";
import { set } from "firebase/database";

function ResidentHome() {
    const [user, setUser] = useState(null);
    const [apartments, setApartments] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);

    const getToken = () => localStorage.getItem("access_token");

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            navigate("/login");
        }
    }, [navigate]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const api = authApis(getToken());
                const [apartmentRes, regisRes] = await Promise.all([
                    api.get(endpoints.getApartment),
                    api.get(endpoints.myVehicleRegistrations),
                    api.get(endpoints.admin)
                ]);
                setApartments(apartmentRes.data.results || apartmentRes.data);
                setRegistrations(regisRes.data);
                setAdmin(admin.data);
                console.log(admin);
            } catch (err) {
                // Xử lý lỗi nếu cần
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    if (!user) return <div style={{ textAlign: "center", marginTop: 40 }}>Đang tải...</div>;

    // Card style cho chức năng
    const featureCard = {
        background: "linear-gradient(135deg, #f3f6fa 60%, #e0e7ff 100%)",
        borderRadius: 18,
        boxShadow: "0 4px 24px #e0e0e0",
        padding: 15,
        width: 170,
        minHeight: 170,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "pointer",
        border: "1.5px solid #e0e7ff"
    };

    const featureCardHover = {
        transform: "translateY(-6px) scale(1.04)",
        boxShadow: "0 8px 32px #b6e0f7"
    };

    return (
        <div style={{
            maxWidth: 1000,
            margin: "40px auto",
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 4px 32px #e0e0e0",
            padding: 40,
            fontFamily: "Segoe UI, Arial, sans-serif"
        }}>
            <h2 style={{
                textAlign: "center",
                marginBottom: 28,
                color: "#FF6F61",
                fontWeight: 800,
                fontSize: 32,
                letterSpacing: 1
            }}>
                Xin chào, {user.first_name} {user.last_name}
            </h2>
            <h3 style={{ color: "#222", marginBottom: 16, fontWeight: 700, fontSize: 22 }}>Căn hộ của bạn:</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 24 }}>
                {apartments.length === 0 ? (
                    <div style={{
                        color: "#888", fontSize: 16, background: "#f8fafc", borderRadius: 10, padding: 18
                    }}>Bạn chưa sở hữu căn hộ nào.</div>
                ) : (
                    apartments.map((apartment, idx) => (
                        <div key={idx} style={{
                            minWidth: 260,
                            background: "linear-gradient(90deg, #e0e7ff 0%, #f3f6fa 100%)",
                            borderRadius: 14,
                            padding: 18,
                            boxShadow: "0 2px 12px #e0e0e0",
                            fontWeight: 500,
                            color: "#222"
                        }}>
                            <div><b>Căn hộ:</b> {apartment.code}</div>
                            <div><b>Tòa:</b> {apartment.building} &nbsp; <b>Tầng:</b> {apartment.floor}</div>
                            <div><b>Căn số:</b> {apartment.number}</div>
                        </div>
                    ))
                )}
            </div>

            {/* Các chức năng chuyển trang bằng card hình ảnh */}
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 32,
                margin: "32px 0 16px 0"
            }}>
                {[
                    {
                        img: "/assets/register_vehicle.png",
                        label: "Đăng ký xe cho người thân",
                        onClick: () => navigate("/resident/register-vehicle")
                    },
                    {
                        img: "/assets/locker_items.png",
                        label: "Tủ đồ",
                        onClick: () => navigate("/resident/locker-items")
                    },
                    {
                        img: "/assets/feedback.png",
                        label: "Gửi phản hồi",
                        onClick: () => navigate("/resident/feedback")
                    },
                    {
                        img: "/assets/survey-feedback-checklist.png",
                        label: "Phản hồi khảo sát",
                        onClick: () => navigate("/resident/survey-list")
                    },
                    {
                        img: "/assets/chat-user.png",
                        label: "Chat trực tuyến",
                        onClick: () => navigate("/resident/chat")
                    },
                    {
                        img: "/assets/amenitybooking.png",
                        label: "Đặt tiện ích chung cư",
                        onClick: () => navigate("/resident/amenity-booking")
                    },
                    {
                        img: "/assets/payment.png",
                        label: "Thanh toán phí chung cư",
                        onClick: () => navigate("/resident/payment")
                    }
                ].map((item, idx) => (
                    <div
                        key={idx}
                        style={featureCard}
                        onClick={item.onClick}
                        onMouseOver={e => {
                            Object.assign(e.currentTarget.style, featureCardHover);
                        }}
                        onMouseOut={e => {
                            Object.assign(e.currentTarget.style, featureCard);
                        }}
                    >
                        <img src={item.img} alt={item.label} style={{
                            width: 64, height: 64, objectFit: "contain", marginBottom: 18, borderRadius: 12, background: "#fff", boxShadow: "0 1px 6px #e0e0e0"
                        }} />
                        <div style={{
                            fontWeight: 600,
                            fontSize: 16,
                            color: "#2d3a4b",
                            textAlign: "center"
                        }}>
                            {item.label}
                        </div>
                    </div>
                ))}
            </div>

            <h3 style={{ color: "#222", margin: "32px 0 12px 0", fontWeight: 700, fontSize: 22 }}>Danh sách đăng ký giữ xe:</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
                {registrations.length === 0 ? (
                    <div style={{
                        color: "#888", fontSize: 16, background: "#f8fafc", borderRadius: 10, padding: 18
                    }}>Bạn chưa có đăng ký giữ xe nào.</div>
                ) : (
                    registrations.map((registration, idx) => (
                        <div key={idx} style={{
                            minWidth: 260,
                            background: "linear-gradient(90deg, #e0e7ff 0%, #f3f6fa 100%)",
                            borderRadius: 14,
                            padding: 18,
                            boxShadow: "0 2px 12px #e0e0e0",
                            fontWeight: 500,
                            color: "#222"
                        }}>
                            <div><b>Khách:</b> {registration.visitor_name}</div>
                            <div><b>Biển số xe:</b> {registration.vehicle_number}</div>
                            <div><b>Ngày đăng ký:</b> {registration.registration_date ? new Date(registration.registration_date).toLocaleDateString("vi-VN") : ""}</div>
                            <div>
                                <b>Trạng thái:</b> {
                                    registration.approved === "NEW" ? <span style={{ color: "#FFA500" }}>Mới</span> :
                                    registration.approved === "APPROVED" ? <span style={{ color: "#4CAF50" }}>Đồng ý</span> :
                                    <span style={{ color: "#FF6F61" }}>Không đồng ý</span>
                                }
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={logout}
                style={{
                    background: "linear-gradient(90deg, #FF6F61 0%, #ffb88c 100%)",
                    borderRadius: 15,
                    padding: "14px 0",
                    width: 320,
                    display: "block",
                    margin: "40px auto 0 auto",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 18,
                    border: "none",
                    boxShadow: "0 2px 12px #e0e0e0",
                    cursor: "pointer",
                    letterSpacing: 1,
                    transition: "background 0.2s"
                }}
            >
                Đăng xuất
            </button>
        </div>
    );
}

export default ResidentHome;