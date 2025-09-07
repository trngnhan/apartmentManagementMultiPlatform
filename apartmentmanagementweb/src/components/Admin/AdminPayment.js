import React, { useEffect, useState } from "react";
import { endpoints, authApis } from "../../configs/Apis";
import { useNavigate } from "react-router-dom";

function AdminPayment() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const fetchPayments = async (active = "ALL") => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            let url = endpoints.paymentCategories;
            if (active === "ACTIVE") url += "?active=true";
            else if (active === "INACTIVE") url += "?active=false";
            const res = await api.get(url);
            setPayments(res.data.results || res.data);
        } catch (err) {
            setError("Không thể tải danh sách loại phí.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments(activeFilter);
    }, [activeFilter]);

    const frequencyDisplay = (code) => {
        switch (code) {
            case "ONE_TIME": return "Một lần";
            case "MONTHLY": return "Hàng tháng";
            case "QUARTERLY": return "Hàng quý";
            case "YEARLY": return "Hàng năm";
            default: return code;
        }
    };

    const categoryTypeDisplay = (code) => {
        switch (code) {
            case "MAINTENANCE": return "Bảo trì";
            case "UTILITY": return "Tiện ích";
            case "SERVICE": return "Dịch vụ";
            default: return code;
        }
    };

    const toggleActivePayment = async (paymentId, currentActive) => {
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.patch(endpoints.paymentCategoryLock(paymentId), { active: !currentActive });
            if (res.status === 200 || res.status === 204) {
                setPayments((prevPayments) =>
                    prevPayments.map((payment) =>
                        payment.id === paymentId ? { ...payment, active: !currentActive } : payment
                    )
                );
                alert(!currentActive ? "Hóa đơn đã được mở khoá." : "Hóa đơn đã được khoá.");
                fetchPayments(activeFilter);
            } else {
                alert("Không thể cập nhật trạng thái hóa đơn.");
            }
        } catch (error) {
            alert("Đã xảy ra lỗi khi cập nhật trạng thái hóa đơn.");
        }
    };

    return (
        <div style={{ maxWidth: "100%", margin: "40px auto", background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px #e0e0e0", padding: 32 }}>
            <h2 style={{ textAlign: "center", marginBottom: 24 }}>QUẢN LÝ LOẠI PHÍ</h2>
            <div style={{ display: "flex", gap: 12, marginBottom: 18, justifyContent: "center" }}>
                {["ALL", "ACTIVE", "INACTIVE"].map((status) => (
                    <button
                        key={status}
                        style={{
                            padding: "8px 18px",
                            borderRadius: 20,
                            background:
                                activeFilter === status
                                    ? status === "ACTIVE"
                                        ? "#4CAF50"
                                        : status === "INACTIVE"
                                        ? "#FF6F61"
                                        : "#2196F3"
                                    : "#eee",
                            color: activeFilter === status ? "#fff" : "#333",
                            border: "none",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                        onClick={() => setActiveFilter(status)}
                    >
                        {status === "ALL" ? "Tất cả" : status === "ACTIVE" ? "Hoạt động" : "Đã khoá"}
                    </button>
                ))}
            </div>
            {loading ? (
                <div style={{ textAlign: "center", marginTop: 40 }}>Đang tải...</div>
            ) : error ? (
                <div style={{ color: "red", textAlign: "center" }}>{error}</div>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f8fafc" }}>
                            <th>Tên loại phí</th>
                            <th>Số tiền</th>
                            <th>Tần suất</th>
                            <th>VAT (%)</th>
                            <th>Ân hạn</th>
                            <th>Loại phí</th>
                            <th>Ghi chú</th>
                            <th>Trạng thái</th>
                            <th>Cư dân</th>
                            <th>Ngày tạo</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map(item => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td>{item.name}</td>
                                <td>{parseInt(item.total_amount).toLocaleString("vi-VN")} VNĐ</td>
                                <td>{frequencyDisplay(item.frequency)}</td>
                                <td>{item.tax_percentage}</td>
                                <td>{item.grace_period}</td>
                                <td>{categoryTypeDisplay(item.category_type)}</td>
                                <td>{item.description || "Không có"}</td>
                                <td>{item.active ? "Hoạt động" : "Đã khoá"}</td>
                                <td>{item.resident_first_name && item.resident_last_name
                                    ? `${item.resident_first_name} ${item.resident_last_name}`
                                    : "Chưa có"}</td>
                                <td>{item.created_date ? new Date(item.created_date).toLocaleDateString("vi-VN") : ""}</td>
                                <td>
                                    <button
                                        style={{
                                            background: item.active ? "#FF6F61" : "#4CAF50",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 8,
                                            padding: "6px 14px",
                                            cursor: "pointer",
                                            marginRight: 8
                                        }}
                                        onClick={() => toggleActivePayment(item.id, item.active)}
                                    >
                                        {item.active ? "Khoá" : "Mở khoá"}
                                    </button>
                                    {item.active && (
                                        <button
                                            style={{
                                                background: "#2196F3",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 8,
                                                padding: "6px 14px",
                                                cursor: "pointer"
                                            }}
                                            onClick={() => navigate(`/admin/payment-transactions/${item.id}/transactions`, {
                                                state: {
                                                    categoryId: item.id,
                                                    categoryName: item.name
                                                }
                                            })}
                                        >
                                            Xem giao dịch
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminPayment;