import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import { Modal, TextInput } from "react-native-paper";
import { Modal as RNModal } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { endpoints, authApis } from "../../configs/Apis";

const AdminPayment = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newName, setNewName] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [newFrequency, setNewFrequency] = useState("");
    const [newTax, setNewTax] = useState("");
    const [newGrace, setNewGrace] = useState("");
    const [newCategoryType, setNewCategoryType] = useState("");
    const [creating, setCreating] = useState(false);
    const navigation = useNavigation();
    const [residents, setResidents] = useState([]);
    const [selectedResident, setSelectedResident] = useState("");
    const [newNote, setNewNote] = useState("");

    const fetchPayments = async (active = "ALL") => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            let url = endpoints.paymentCategories;
            if (active === "ACTIVE") url += "?active=true";
            else if (active === "INACTIVE") url += "?active=false";
            const res = await api.get(url);
            setPayments(res.data.results || res.data);
        } catch (err) {
            Alert.alert("Lỗi", "Không thể tải danh sách giao dịch.");
        } finally {
            setLoading(false);
        }
    };

    const fetchResidents = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.get(endpoints.allResidents);
            setResidents(res.data);
        } catch (err) {
            Alert.alert("Lỗi", "Không thể tải danh sách cư dân.");
        }
    };

    const handleCreatePayment = async () => {
        setCreating(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.post(endpoints.paymentCategories, {
                name: newName,
                amount: newAmount,
                frequency: newFrequency,
                tax_percentage: newTax,
                grace_period: newGrace,
                category_type: newCategoryType,
                active: true,
                description: newNote,
                resident: selectedResident
            });
            if (res.status === 201 || res.status === 200) {
                setCreateModalVisible(false);
                setNewName(""); 
                setNewAmount(""); 
                setNewFrequency(""); 
                setNewTax(""); 
                setNewGrace(""); 
                setNewCategoryType("");
                setSelectedResident("");
                fetchPayments(activeFilter);
                Alert.alert("Thành công", "Đã tạo hóa đơn mới!");
            } else {
                Alert.alert("Lỗi", res.data.detail || "Không thể tạo hóa đơn.");
            }
        } catch (err) {
            Alert.alert("Lỗi", "Có lỗi xảy ra khi tạo hóa đơn.");
        } finally {
            setCreating(false);
        }
    };

    const toggleActivePayment = async (paymentId, currentActive) => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.patch(endpoints.paymentCategoryLock(paymentId), 
                { active: !currentActive });
            if (res.status === 200 || res.status === 204) {
                Alert.alert("Thành công", !currentActive ? "Hóa đơn đã được mở khoá." : "Hóa đơn đã được khoá.");
                setPayments((prevPayments) =>
                    prevPayments.map((payment) =>
                        payment.id === paymentId ? { ...payment, active: !currentActive } : payment
                    )
                );
            } else {
                Alert.alert("Lỗi", "Không thể cập nhật trạng thái hóa đơn. Vui lòng thử lại.");
            }
        } catch (error) {
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi cập nhật trạng thái hóa đơn.");
        }
    };

    const frequencyDisplay = (code) => {
        switch (code) {
            case "ONE_TIME":
                return "Một lần";
            case "MONTHLY":
                return "Hàng tháng";
            case "QUARTERLY":
                return "Hàng quý";
            case "YEARLY":
                return "Hàng năm";
            default:
                return code;
        }
    };
    
    const categoryTypeDisplay = (code) => {
        switch (code) {
            case "MAINTENANCE":
                return "Bảo trì";
            case "UTILITY":
                return "Tiện ích";
            case "SERVICE":
                return "Dịch vụ";
            default:
                return code;
        }
    };

    useEffect(() => {
        fetchPayments(activeFilter);
        if (createModalVisible) fetchResidents();
    }, [activeFilter, createModalVisible]);

    const renderPayment = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() =>
                item.active &&
                navigation.navigate("AdminPaymentTransactionList", {
                    categoryId: item.id,
                    categoryName: item.name,
                })
            }
            disabled={!item.active}
        >
            <Text>Loại phí: {item.name}</Text>
            <Text>
                Số tiền: {parseInt(item.total_amount).toLocaleString("vi-VN")} VNĐ
            </Text>
            <Text>Tần suất thanh toán: {frequencyDisplay(item.frequency)}</Text>
            <Text>VAT: {item.tax_percentage}</Text>
            <Text>Thời gian ân hạn (ngày): {item.grace_period}</Text>
            <Text>Loại phí: {categoryTypeDisplay(item.category_type)}</Text>
            <Text>Ghi chú: {item.description || "Không có"}</Text>
            <Text>Trạng thái: {item.active ? "Hoạt động" : "Đã khoá"}</Text>
            <Text>
                Ngày tạo: {new Date(item.created_date).toLocaleDateString("vi-VN")}
            </Text>
            <Text style={{ marginBottom: 5 }}>
                Cư dân: {item.resident_first_name && item.resident_last_name
                    ? `${item.resident_first_name} ${item.resident_last_name}`
                    : "Chưa có"}
            </Text>

            <TouchableOpacity
                style={[
                    MyStyles.button,
                    {
                        backgroundColor: item.active ? "#4CAF50" : "#FF6F61",
                        marginBottom: 10,
                        opacity: 1,
                    },
                ]}
                onPress={() => toggleActivePayment(item.id, item.active)}
            >
                <Text style={MyStyles.buttonText}>
                    {item.active ? "Khoá" : "Mở khoá"}
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={MyStyles.containerr}>
            <Text style={styles.header}>QUẢN LÝ GIAO DỊCH THANH TOÁN</Text>
            <TouchableOpacity
                style={[MyStyles.button, { backgroundColor: "#4CAF50", marginBottom: 10 }]}
                onPress={() => setCreateModalVisible(true)}
            >
                <Text style={MyStyles.buttonText}>Tạo hóa đơn</Text>
            </TouchableOpacity>

            <RNModal
                visible={createModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        width: '90%'
                    }}>
                        <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 10, textAlign: "center" }}>
                            Tạo hoá đơn mới
                        </Text>
                        <TextInput
                            label="Tên loại phí"
                            value={newName}
                            onChangeText={setNewName}
                            style={{ marginBottom: 10 }}
                        />
                        <TextInput
                            label="Số tiền"
                            value={newAmount}
                            onChangeText={setNewAmount}
                            keyboardType="numeric"
                            style={{ marginBottom: 10 }}
                        />
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ marginBottom: 5, color: "#888" }}>Tần suất thanh toán</Text>
                            <View style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 5,
                                overflow: "hidden"
                            }}>
                                <Picker
                                    selectedValue={newFrequency}
                                    onValueChange={(itemValue) => setNewFrequency(itemValue)}
                                >
                                    <Picker.Item label="Chọn tần suất" value="" />
                                    <Picker.Item label="Một lần" value="ONE_TIME" />
                                    <Picker.Item label="Hàng tháng" value="MONTHLY" />
                                    <Picker.Item label="Hàng quý" value="QUARTERLY" />
                                    <Picker.Item label="Hàng năm" value="YEARLY" />
                                </Picker>
                            </View>
                        </View>
                        <TextInput
                            label="VAT (%)"
                            value={newTax}
                            onChangeText={setNewTax}
                            keyboardType="numeric"
                            style={{ marginBottom: 10 }}
                        />
                        <TextInput
                            label="Thời gian ân hạn (ngày)"
                            value={newGrace}
                            onChangeText={setNewGrace}
                            keyboardType="numeric"
                            style={{ marginBottom: 10 }}
                        />
                        <TextInput
                            label="Ghi chú (tuỳ chọn)"
                            value={newNote}
                            onChangeText={setNewNote}
                            style={{ marginBottom: 10 }}
                        />
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ marginBottom: 5, color: "#888" }}>Loại phí</Text>
                            <View style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 5,
                                overflow: "hidden"
                            }}>
                                <Picker
                                    selectedValue={newCategoryType}
                                    onValueChange={(itemValue) => setNewCategoryType(itemValue)}
                                >
                                    <Picker.Item label="Chọn loại phí" value="" />
                                    <Picker.Item label="Bảo trì" value="MAINTENANCE" />
                                    <Picker.Item label="Tiện ích" value="UTILITY" />
                                    <Picker.Item label="Dịch vụ" value="SERVICE" />
                                </Picker>
                            </View>
                        </View>
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ marginBottom: 5, color: "#888" }}>Chọn cư dân nhận hóa đơn</Text>
                            <View style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 5,
                                overflow: "hidden"
                            }}>
                                <Picker
                                    selectedValue={selectedResident}
                                    onValueChange={(itemValue) => setSelectedResident(itemValue)}
                                >
                                    <Picker.Item label="Chọn cư dân" value="" />
                                    {residents.map(resident => (
                                        <Picker.Item
                                            key={resident.id}
                                            label={`${resident.first_name || ""} ${resident.last_name || ""}`.trim() || `ID: ${resident.id}`}
                                            value={resident.id}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <TouchableOpacity
                                style={[MyStyles.button, { backgroundColor: "#ccc", flex: 1, marginRight: 5 }]}
                                onPress={() => setCreateModalVisible(false)}
                            >
                                <Text style={MyStyles.buttonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[MyStyles.button, { backgroundColor: "#4CAF50", flex: 1, marginLeft: 5 }]}
                                onPress={handleCreatePayment}
                                disabled={creating}
                            >
                                <Text style={MyStyles.buttonText}>{creating ? "Đang tạo..." : "Tạo"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </RNModal>

            <View style={styles.filterRow}>
                <Text>Lọc trạng thái: </Text>
                {["ALL", "ACTIVE", "INACTIVE"].map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[
                            styles.filterBtn,
                            activeFilter === status && styles.filterBtnActive
                        ]}
                        onPress={() => setActiveFilter(status)}
                    >
                        <Text style={{ color: activeFilter === status ? "#fff" : "#333" }}>
                            {status === "ALL" ? "Tất cả" : status === "ACTIVE" ? "Hoạt động" : "Đã khoá"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {loading ? (
                <ActivityIndicator size="large" color="#FF6F61" />
            ) : (
                <FlatList
                    data={payments}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={renderPayment}
                    refreshing={refreshing}
                    onRefresh={() => fetchPayments(activeFilter)}
                    ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20 }}>Không có giao dịch nào.</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center"
    },
    card: {
        backgroundColor: "#f9f9f9",
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    title: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 5,
    },
    filterRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        justifyContent: "center"
    },
    filterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: "#eee",
        marginHorizontal: 5,
    },
    filterBtnActive: {
        backgroundColor: "#FF6F61",
    },
});

export default AdminPayment;