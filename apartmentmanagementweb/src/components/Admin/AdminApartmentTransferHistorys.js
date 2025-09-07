import React, { useState, useEffect, useCallback } from "react";
import { endpoints, authApis } from "../../configs/Apis";

function AdminApartmentTransferHistorys() {
    const [transferHistory, setTransferHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nextPage, setNextPage] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState(""); // Thêm state cho từ khóa tìm kiếm
    const [searchTimeout, setSearchTimeout] = useState(null);

    const fetchTransferHistory = async (url = endpoints.apartmentTransferHistories, searchValue = "") => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");
            const api = authApis(token);
            let apiUrl = url;
            if (searchValue) {
                // Nếu url đã có dấu ?, thêm &search=..., nếu chưa thì thêm ?search=...
                apiUrl += (apiUrl.includes("?") ? "&" : "?") + "search=" + encodeURIComponent(searchValue);
            }
            const response = await api.get(apiUrl);
            const data = response.data;
            setTransferHistory(data.results || []);
            setNextPage(data.next);
        } catch (error) {
            setTransferHistory([]);
            setNextPage(null);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (nextPage && !loadingMore) {
            setLoadingMore(true);
            fetchTransferHistory(nextPage, search);
        }
    };

    useEffect(() => {
        fetchTransferHistory(endpoints.apartmentTransferHistories, search);
        // eslint-disable-next-line
    }, [search]);

    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target.documentElement;
        if (scrollHeight - scrollTop - clientHeight < 100 && nextPage && !loadingMore) {
            loadMore();
        }
    }, [nextPage, loadingMore, search]);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    // Xử lý debounce tìm kiếm
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => {
            fetchTransferHistory(endpoints.apartmentTransferHistories, value);
        }, 400));
    };

    const renderItem = (item) => (
        <div key={item.id} style={{
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 8px #e0e0e0",
            padding: 20,
            marginBottom: 18
        }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 6 }}>Căn hộ: {item.apartment_code}</div>
            <div>Chủ sở hữu trước: {item.previous_owner_email || "Không xác định"}</div>
            <div>Chủ sở hữu mới: {item.new_owner_email || "Không xác định"}</div>
            <div>Ngày chuyển nhượng:{" "}
                {item.transfer_date ? new Date(item.transfer_date).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                }) : "Không xác định"}
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(180deg, #fff, #d7d2cc, #FFBAC3)",
            padding: "40px 0"
        }}>
            <div style={{
                maxWidth: 700,
                margin: "0 auto",
                background: "#f8fafc",
                borderRadius: 16,
                boxShadow: "0 4px 24px #e0e0e0",
                padding: 32
            }}>
                <h2 style={{
                    textAlign: "center",
                    marginBottom: 32,
                    color: "#FF6F61",
                    textTransform: "uppercase",
                    letterSpacing: 1.5
                }}>
                    LỊCH SỬ CHUYỂN NHƯỢNG CĂN HỘ
                </h2>
                <div style={{ marginBottom: 24, textAlign: "center" }}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo căn hộ, email chủ sở hữu..."
                        value={search}
                        onChange={handleSearchChange}
                        style={{
                            width: "80%",
                            padding: 10,
                            borderRadius: 8,
                            border: "1px solid #bbb",
                            fontSize: 16
                        }}
                    />
                </div>
                {loading ? (
                    <div style={{ textAlign: "center", margin: "40px 0" }}>
                        <span className="spinner-border text-danger" role="status" />
                        <span style={{ marginLeft: 12 }}>Đang tải...</span>
                    </div>
                ) : transferHistory.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#888" }}>
                        Không có lịch sử chuyển nhượng nào để hiển thị.
                    </div>
                ) : (
                    <div>
                        {transferHistory.map(renderItem)}
                        {loadingMore && (
                            <div style={{ textAlign: "center", margin: "20px 0" }}>
                                <span className="spinner-border text-danger" role="status" />
                                <span style={{ marginLeft: 12 }}>Đang tải thêm...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminApartmentTransferHistorys;