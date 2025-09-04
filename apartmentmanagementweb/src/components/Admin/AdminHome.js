import React from "react";
import { useNavigate } from "react-router-dom";

const adminFeatures = [
    { label: "Quản lý tài khoản", img: "/assets/user.png", path: "/admin/accounts" },
    { label: "Quản lý cư dân", img: "/assets/resident.png", path: "/admin/residents" },
    { label: "Quản lý căn hộ", img: "/assets/apartment.png", path: "/admin/apartments" },
    { label: "Quản lý khảo sát", img: "/assets/survey.png", path: "/admin/surveys" },
    { label: "Quản lý phản ánh", img: "/assets/feedback.png", path: "/admin/feedbacks" },
    { label: "Quản lý tiện ích", img: "/assets/admin-amenity.png", path: "/admin/amenities" },
    { label: "Quản lý tủ đồ", img: "/assets/admin-locker.png", path: "/admin/lockers" },
    { label: "Quản lý thanh toán", img: "/assets/admin_payment.png", path: "/admin/payments" },
    { label: "Quản lý gửi xe", img: "/assets/parkingRegistrations.png", path: "/admin/parking" },
    { label: "Quản lý tin nhắn", img: "/assets/admin-chatscreen.png", path: "/admin/chats" }
];

function AdminHome() {
    const navigate = useNavigate();

    return (
        <div style={{
            maxWidth: 1000,
            margin: "40px auto",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 16px #eee",
            padding: 22
        }}>
            <h2 style={{ textAlign: "center", marginBottom: 32, textTransform: "uppercase" }}>Trang quản trị hệ thống</h2>
            <h4 style={{ textAlign: "center", marginBottom: 24}}>Chào mừng bạn đã đến với Hệ thống Quản lý chung cư</h4>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 32
            }}>
                {adminFeatures.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={() => navigate(item.path)}
                        style={{
                            cursor: "pointer",
                            borderRadius: 16,
                            boxShadow: "0 2px 12px #e0e0e0",
                            background: "#f8fafc",
                            padding: 16,
                            textAlign: "center",
                            transition: "box-shadow 0.2s, transform 0.2s",
                            border: "2px solid #e0e0e0",
                            minHeight: 150
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.boxShadow = "0 4px 24px #b6e0f7";
                            e.currentTarget.style.transform = "translateY(-4px) scale(1.03)";
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.boxShadow = "0 2px 12px #e0e0e0";
                            e.currentTarget.style.transform = "none";
                        }}
                    >
                        <img
                            src={item.img}
                            alt={item.label}
                            style={{
                                width: 80,
                                height: 80,
                                objectFit: "contain",
                                marginBottom: 18,
                                borderRadius: 12,
                                background: "#fff",
                                boxShadow: "0 1px 6px #e0e0e0"
                            }}
                        />
                        <div style={{
                            fontWeight: 600,
                            fontSize: 18,
                            color: "#2d3a4b"
                        }}>
                            {item.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AdminHome;