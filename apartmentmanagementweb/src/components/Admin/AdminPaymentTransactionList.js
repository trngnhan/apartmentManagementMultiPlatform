import React, { useEffect, useState } from "react";
import { endpoints, authApis } from "../../configs/Apis";
import { useLocation } from "react-router-dom";

function AdminPaymentTransactionList() {
    const location = useLocation();
    const { categoryId, categoryName } = location.state || {};
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("access_token");
                const api = authApis(token);
                const res = await api.get(`${endpoints.paymentsTransactions}?category=${categoryId}`);
                setTransactions(res.data.results || res.data);
            } catch (err) {
                alert("Không thể tải danh sách giao dịch.");
            } finally {
                setLoading(false);
            }
        };
        if (categoryId) fetchTransactions();
    }, [categoryId]);

    const updateStatus = async (transactionId, newStatus) => {
        try {
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            const res = await api.patch(`${endpoints.updatePaymentStatus(transactionId)}`, { status: newStatus });
            if (res.status === 200 || res.status === 204) {
                setTransactions((prev) =>
                    prev.map((item) =>
                        item.id === transactionId ? { ...item, status: newStatus } : item
                    )
                );
                alert("Cập nhật trạng thái thành công!");
            } else {
                alert("Không thể cập nhật trạng thái.");
            }
        } catch (err) {
            alert("Có lỗi xảy ra khi cập nhật trạng thái.");
        }
    };

    const STATUS_OPTIONS = [
        { value: "PENDING", label: "Chờ xử lý" },
        { value: "COMPLETED", label: "Hoàn tất" },
        { value: "FAILED", label: "Thất bại" },
        { value: "REFUNDED", label: "Đã hoàn lại" },
    ];

    const methodDisplay = (method) => {
        switch (method) {
            case "MOMO": return "MoMo";
            case "VNPAY": return "VNPay";
            default: return method;
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: "40px auto", background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px #e0e0e0", padding: 32 }}>
            <h2 style={{ textAlign: "center", marginBottom: 24 }}>
                Giao dịch của loại phí: {categoryName}
            </h2>
            {loading ? (
                <div style={{ textAlign: "center", marginTop: 40 }}>Đang tải...</div>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f8fafc" }}>
                            <th>Phương thức</th>
                            <th>Số tiền</th>
                            <th>Ngày thanh toán</th>
                            <th>Mã giao dịch</th>
                            <th>Trạng thái</th>
                            <th>Cập nhật</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>Không có giao dịch nào.</td>
                            </tr>
                        ) : (
                            transactions.map(item => (
                                <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                                    <td>{methodDisplay(item.method)}</td>
                                    <td>{parseInt(item.amount).toLocaleString("vi-VN")} VNĐ</td>
                                    <td>{item.paid_date ? new Date(item.paid_date).toLocaleString("vi-VN") : "Chưa thanh toán"}</td>
                                    <td>{item.transaction_id || ""}</td>
                                    <td>
                                        <select
                                            value={item.status}
                                            onChange={e => {
                                                if (e.target.value !== item.status) updateStatus(item.id, e.target.value);
                                            }}
                                            style={{ padding: "4px 10px", borderRadius: 6 }}
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            style={{
                                                background: "#4CAF50",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 8,
                                                padding: "6px 14px",
                                                cursor: "pointer"
                                            }}
                                            onClick={() => updateStatus(item.id, item.status)}
                                        >
                                            Lưu
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminPaymentTransactionList;