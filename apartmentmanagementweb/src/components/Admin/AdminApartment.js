import React, { useEffect, useState } from "react";
import { endpoints, authApis } from "../../configs/Apis";
import { useNavigate } from "react-router-dom";

function AdminApartment() {
    const [apartments, setApartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nextPage, setNextPage] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedApartment, setSelectedApartment] = useState(null);
    const [newOwnerId, setNewOwnerId] = useState("");
    const [note, setNote] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [residents, setResidents] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState('all');
    const [selectedFloor, setSelectedFloor] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newBuilding, setNewBuilding] = useState("");
    const [newFloor, setNewFloor] = useState("");
    const [newNumber, setNewNumber] = useState("");
    const [newOwnerIdCreate, setNewOwnerIdCreate] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Lấy token từ localStorage
    const getToken = () => localStorage.getItem("access_token");

    const fetchApartments = async (url = endpoints.apartments, isLoadMore = false) => {
        try {
            if (!isLoadMore) setLoading(true);
            const api = authApis(getToken());
            const response = await api.get(url);
            const data = response.data;
            if (isLoadMore) {
                setApartments((prevApartments) => {
                    const newApartments = (data.results || []).filter(
                        (apartment) => !prevApartments.some((prev) => prev.code === apartment.code)
                    );
                    return [...prevApartments, ...newApartments];
                });
            } else {
                setApartments(data.results || []);
            }
            setNextPage(data.next);
        } catch (error) {
            setError("Lỗi khi tải danh sách căn hộ.");
        } finally {
            if (!isLoadMore) setLoading(false);
            setLoadingMore(false);
        }
    };

    // Khi loadMore:
    const loadMore = () => {
        if (nextPage && !loadingMore) {
            setLoadingMore(true);
            fetchApartments(nextPage, true);
        }
    };

    // Khi làm mới dữ liệu (sau khi tạo hoặc chuyển nhượng):
    const reloadApartments = () => {
        setNextPage(null);
        fetchApartments(endpoints.apartments, false); // truyền false để load lại từ đầu
    };

    const fetchResidentsWithoutApartment = async () => {
        try {
            const api = authApis(getToken());
            const response = await api.get(endpoints.residentsWithoutApartment);
            const data = response.data;
            setResidents(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            setError("Lỗi khi tải cư dân chưa có căn hộ.");
        }
    };

    const handleTransfer = async () => {
        if (!newOwnerId) {
            alert("Vui lòng chọn cư dân nhận chuyển nhượng.");
            return;
        }
        try {
            const api = authApis(getToken());
            const response = await api.post(
                endpoints.transfer(selectedApartment.id),
                {
                    new_owner_id: newOwnerId,
                    note: note,
                }
            );
            alert(response.data.detail || "Chuyển nhượng thành công");
            setModalVisible(false);
            reloadApartments();
            setNewOwnerId("");
            setNote("");
        } catch (error) {
            const data = error.response?.data || {};
            alert(data.detail || "Không thể chuyển nhượng căn hộ.");
        }
    };

    const handleCreateApartment = async () => {
        if (!newCode || !newBuilding || !newFloor || !newNumber || !newOwnerIdCreate) {
            alert("Vui lòng nhập đầy đủ thông tin.");
            return;
        }
        try {
            const body = {
                code: newCode,
                building: newBuilding,
                floor: Number(newFloor),
                number: newNumber,
                owner: Number(newOwnerIdCreate),
                active: true,
            };
            const api = authApis(getToken());
            await api.post(endpoints.apartments, body);
            alert("Tạo căn hộ thành công");
            setCreateModalVisible(false);
            setNewCode("");
            setNewBuilding("");
            setNewFloor("");
            setNewNumber("");
            setNewOwnerIdCreate("");
            reloadApartments();
        } catch (error) {
            const data = error.response?.data || {};
            alert(data.detail || "Tạo căn hộ thất bại");
        }
    };

    useEffect(() => {
        fetchApartments();
    }, []);

    useEffect(() => {
        if (createModalVisible || modalVisible) {
            fetchResidentsWithoutApartment();
        }
        // eslint-disable-next-line
    }, [createModalVisible, modalVisible]);

    const filteredApartments = apartments.filter(a => {
        const buildingMatch = selectedBuilding === 'all' || a.building === selectedBuilding;
        const floorMatch = selectedFloor === 'all' || a.floor.toString() === selectedFloor;
        return buildingMatch && floorMatch;
    });

    const buildingOptions = ["A", "B", "C", "D"];
    const floorOptions = Array.from({ length: 20 }, (_, i) => (i + 1).toString());
    const roomNumberOptions = Array.from({ length: 30 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    return (
        <div style={{
            maxWidth: 1100,
            margin: "40px auto",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px #e0e0e0",
            padding: 32,
            fontFamily: "Segoe UI, Arial, sans-serif"
        }}>
            <h2 style={{ textAlign: "center", marginBottom: 24, color: "#FF6F61" }}>QUẢN LÝ CHUNG CƯ</h2>
            <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center" }}>
                {error && <div style={{ color: "red", textAlign: "center" }}>{error}</div>}
                <button
                    style={{
                        background: "#FF6F61",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 24px",
                        fontWeight: 600,
                        cursor: "pointer"
                    }}
                    onClick={() => setCreateModalVisible(true)}
                >
                    Tạo căn hộ
                </button>
                <div>
                    <label style={{ fontWeight: "bold", marginRight: 8 }}>Chọn tòa nhà:</label>
                    <select
                        value={selectedBuilding}
                        onChange={e => setSelectedBuilding(e.target.value)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            background: "#f8fafc",
                            fontSize: "16px",
                            fontWeight: 500,
                            color: "#333",
                            outline: "none",
                            minWidth: 120,
                            transition: "border-color 0.2s"
                        }}
                    >
                        <option value="all">Tất cả</option>
                        {buildingOptions.map(b => (
                            <option key={b} value={b}>Tòa {b}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ fontWeight: "bold", marginRight: 8 }}>Chọn tầng:</label>
                    <select value={selectedFloor} onChange={e => setSelectedFloor(e.target.value)}
                        style={{padding: "8px 16px",
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            background: "#f8fafc",
                            fontSize: "16px",
                            fontWeight: 500,
                            color: "#333",
                            outline: "none",
                            minWidth: 120,
                            transition: "border-color 0.2s"}}>
                        <option value="all">Tất cả tầng</option>
                        {floorOptions.map(f => (
                            <option key={f} value={f}>Tầng {f}</option>
                        ))}
                    </select>
                </div>
            </div>
            {loading ? (
                <div style={{ textAlign: "center", marginTop: 40 }}>Đang tải...</div>
            ) : filteredApartments.length === 0 ? (
                <div style={{ textAlign: "center", color: "#888" }}>Không có apartment nào để hiển thị.</div>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f8fafc" }}>
                            <th>Mã căn hộ</th>
                            <th>Toà</th>
                            <th>Tầng</th>
                            <th>Phòng</th>
                            <th>Chủ sở hữu</th>
                            <th>Email</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredApartments.map(item => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td>{item.code}</td>
                                <td>{item.building}</td>
                                <td>{item.floor}</td>
                                <td>{item.number}</td>
                                <td>{item.first_name && item.last_name
                                    ? `${item.first_name} ${item.last_name}`
                                    : item.owner_email || "Không xác định"}
                                </td>
                                <td>{item.owner_email}</td>
                                <td>{item.active ? "Hoạt động" : "Không hoạt động"}</td>
                                <td>
                                    <button
                                        style={{
                                            background: "#FFCC33",
                                            color: "#333",
                                            border: "none",
                                            borderRadius: 8,
                                            padding: "10px 14px",
                                            cursor: "pointer",
                                            fontWeight: 600
                                        }}
                                        onClick={() => {
                                            setSelectedApartment(item);
                                            setModalVisible(true);
                                        }}
                                    >
                                        Chuyển nhượng
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Modal chuyển nhượng */}
            {modalVisible && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 12, padding: 32, minWidth: 400, boxShadow: "0 4px 24px #e0e0e0"
                    }}>
                        <h3 style={{ marginBottom: 18 }}>Chuyển nhượng căn hộ</h3>
                        <div style={{ marginBottom: 14 }}>
                            <label>Chọn cư dân mới:</label>
                            <select
                                value={newOwnerId}
                                onChange={e => setNewOwnerId(e.target.value)}
                                style={{ width: "100%", padding: 8, borderRadius: 6, marginTop: 6 }}
                            >
                                <option value="">Chọn cư dân</option>
                                {residents.map(resident => (
                                    <option key={resident.id} value={resident.id}>
                                        {resident.first_name} {resident.last_name} ({resident.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label>Ghi chú (tuỳ chọn):</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                style={{ width: "100%", padding: 8, borderRadius: 6, minHeight: 60 }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                            <button
                                style={{
                                    background: "#ccc", color: "#333", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600
                                }}
                                onClick={() => setModalVisible(false)}
                            >Hủy</button>
                            <button
                                style={{
                                    background: "#4CAF50", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600
                                }}
                                onClick={handleTransfer}
                            >Chuyển</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal tạo căn hộ */}
            {createModalVisible && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 12, padding: 32, minWidth: 400, boxShadow: "0 4px 24px #e0e0e0"
                    }}>
                        <h3 style={{ marginBottom: 18 }}>Tạo căn hộ mới</h3>
                        <div style={{ marginBottom: 14 }}>
                            <label>Mã căn hộ:</label>
                            <input
                                value={newCode}
                                onChange={e => setNewCode(e.target.value)}
                                style={{ width: "100%", padding: 8, borderRadius: 6, marginTop: 6 }}
                                placeholder="Nhập mã căn hộ"
                            />
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label>Toà nhà:</label>
                            <select
                                value={newBuilding}
                                onChange={e => setNewBuilding(e.target.value)}
                                style={{ width: "100%", padding: 8, borderRadius: 6, marginTop: 6 }}
                            >
                                <option value="">Chọn toà</option>
                                {buildingOptions.map(building => (
                                    <option key={building} value={building}>{building}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label>Tầng:</label>
                            <select
                                value={newFloor}
                                onChange={e => setNewFloor(e.target.value)}
                                style={{ width: "100%", padding: 8, borderRadius: 6, marginTop: 6 }}
                            >
                                <option value="">Chọn tầng</option>
                                {floorOptions.map(floor => (
                                    <option key={floor} value={floor}>{floor}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label>Số phòng:</label>
                            <select
                                value={newNumber}
                                onChange={e => setNewNumber(e.target.value)}
                                style={{ width: "100%", padding: 8, borderRadius: 6, marginTop: 6 }}
                            >
                                <option value="">Chọn số phòng</option>
                                {roomNumberOptions.map(room => (
                                    <option key={room} value={room}>{room}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label>Chủ sở hữu:</label>
                            <select
                                value={newOwnerIdCreate}
                                onChange={e => setNewOwnerIdCreate(e.target.value)}
                                style={{ width: "100%", padding: 8, borderRadius: 6, marginTop: 6 }}
                            >
                                <option value="">Chọn cư dân</option>
                                {residents.map(resident => (
                                    <option key={resident.id} value={resident.id}>
                                        {resident.first_name} {resident.last_name} ({resident.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                            <button
                                style={{
                                    background: "#ccc", color: "#333", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600
                                }}
                                onClick={() => setCreateModalVisible(false)}
                            >Hủy</button>
                            <button
                                style={{
                                    background: "#4CAF50", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600
                                }}
                                onClick={handleCreateApartment}
                            >Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: 32, textAlign: "center", display: "flex", justifyContent: "center", gap: 24 }}>
                {nextPage && (
                    <button
                        style={{
                            background: "#2196F3",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "10px 32px",
                            fontWeight: 600,
                            fontSize: 16,
                            cursor: "pointer"
                        }}
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? "Đang tải..." : "Tải thêm"}
                    </button>
                )}

                <button
                    style={{
                        background: "#FF6F61",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 24px",
                        fontWeight: 600,
                        fontSize: 16,
                        cursor: "pointer"
                    }}
                    onClick={() => {
                        localStorage.removeItem("access_token");
                        localStorage.removeItem("user");
                        navigate("/login");
                    }}
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}

export default AdminApartment;