import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { endpoints, authApis } from "../../configs/Apis";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";

const AdminParkingRegistrations = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedStatuses, setSelectedStatuses] = useState({});

    useFocusEffect(
        useCallback(() => {
            fetchRegistrations();
        }, [])
    );

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.get(endpoints.visitorVehicleRegistrations);
            const data = res.data;
            setRegistrations(data.results || data);
        } catch (err) {
            setRegistrations([]);
        }
        setLoading(false);
    };

    const approveRegister = async (id, status) => {
        setUpdatingId(id);

        setRegistrations(prev =>
            prev.map(item =>
                item.id === id ? { ...item, approved: status } : item
            )
        );

        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.patch(endpoints.approveVisitorVehicleRegistration(id), {
                approved: status
            });
            if (res.status === 200 || res.status === 204) {
                Alert.alert("Thành công", status === "APPROVED" ? "Đã duyệt đăng ký!" : status === "REJECTED" ? "Đã từ chối đăng ký!" : "Trạng thái đã cập nhật!");
                fetchRegistrations();
            } else {
                Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
            }
        } catch (err) {
            Alert.alert("Lỗi", "Có lỗi xảy ra.");
        }
        setUpdatingId(null);
    };

    const handleDeleteRegistration = async (id) => {
        Alert.alert(
            "Xác nhận",
            "Bạn có chắc muốn xoá đăng ký gửi xe này?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xoá",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("token");
                            const api = authApis(token);
                            const res = await api.delete(`${endpoints.visitorVehicleRegistrations}${id}/`);
                            if (res.status === 204 || res.status === 200) {
                                setRegistrations(prev => prev.filter(item => item.id !== id));
                                Alert.alert("Thành công", "Đã xoá đăng ký gửi xe.");
                            } else {
                                Alert.alert("Lỗi", "Không thể xoá đăng ký gửi xe.");
                            }
                        } catch (err) {
                            Alert.alert("Lỗi", "Có lỗi xảy ra khi xoá đăng ký gửi xe.");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.title}>Tên khách: {item.visitor_name}</Text>
            <Text>Biển số xe: {item.vehicle_number}</Text>
            <Text>Cư dân đăng ký: {item.first_name} {item.last_name}</Text>
            <Text>
                Ngày gửi: {item.registration_date ? new Date(item.registration_date).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }) : ""}
            </Text>
            <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center" }}>
                <Text style={{ marginRight: 8 }}>Trạng thái:</Text>
                <Picker
                    selectedValue={selectedStatuses[item.id] || item.approved || "NEW"}
                    onValueChange={async (value) => {
                        const updated = { ...selectedStatuses, [item.id]: value };
                        setSelectedStatuses(updated);
                        if (value !== item.approved) {
                            await approveRegister(item.id, value);
                        }
                    }}
                    style={{
                        backgroundColor: "#f0f0f0",
                        borderWidth: 1,
                        borderColor: "#ccc",
                        color: "green",
                        width: 160,
                        borderRadius: 6,
                        marginBottom: 8,
                        marginTop: 8,
                    }}
                    enabled={true}
                >
                    <Picker.Item label="Mới" value="NEW" />
                    <Picker.Item label="Đồng ý" value="APPROVED" />
                    <Picker.Item label="Không đồng ý" value="REJECTED" />
                </Picker>
            </View>
            <TouchableOpacity
                style={{
                    backgroundColor: "#F44336",
                    padding: 8,
                    borderRadius: 6,
                    marginTop: 10,
                    alignSelf: "flex-end"
                }}
                onPress={() => handleDeleteRegistration(item.id)}
            >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Xoá đăng ký</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FFBAC3"/>
                <Text>Đang tải danh sách đăng ký gửi xe...</Text>
            </View>
        );
    }

    return (
        <LinearGradient colors={["#f2f2f2", "#fafacaff", "#fdd301ff"]} style={{ flex: 1, padding: 10 }}>
            <Text style={styles.header}>Danh sách đăng ký gửi xe</Text>
            <FlatList
                data={registrations}
                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={{ textAlign: "center" }}>Không có đăng ký nào.</Text>}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#0F4C75",
        textAlign: "center"
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    title: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 6,
        color: "#ff4081",
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15,
    },
});

export default AdminParkingRegistrations;