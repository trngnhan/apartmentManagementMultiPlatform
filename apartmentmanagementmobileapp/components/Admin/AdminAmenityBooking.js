import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { Picker } from "@react-native-picker/picker";
import { Alert } from "react-native";
import { LinearGradient } from "react-native-svg";

const AdminAmenityBooking = ({route}) => {
    const amenityId = route?.params?.amenityId;
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatuses, setSelectedStatuses] = useState({});
    const [residents, setResidents] = useState([]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            console.log(endpoints.amenityBookings(amenityId));
            const res = await api.get(endpoints.amenityBookings(amenityId));
            setBookings(res.data.results || res.data);
            console.log("Bookings:", res.data.results || res.data);
        } catch (err) {
            setBookings([]);
        }
        setLoading(false);
    };

    const fetchResidents = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.get("/residents/"); // endpoint trả về danh sách resident
            setResidents(res.data.results || res.data);
        } catch (err) {
            setResidents([]);
        }
    };

    const handleUpdateStatus = async (bookingId, newStatus) => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.patch(`/amenitybookings/${bookingId}/set-status/`, {
                status: newStatus
            });
            if (res.status === 200) {
                Alert.alert("Thành công", "Đã cập nhật trạng thái!");
                fetchBookings();
            } else {
                Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
            }
        } catch (err) {
            Alert.alert("Lỗi", "Có lỗi xảy ra khi cập nhật trạng thái.");
        }
    };

    const getResidentName = (residentId) => {
        const resident = residents.find(r => r.id === residentId);
        if (resident) {
            if (resident.user) {
                return resident.user.username || resident.user.email || "Không xác định";
            }
            return resident.email || "Không xác định";
        }
        return "Không xác định";
    };

    useEffect(() => {
        fetchBookings();
        fetchResidents();
    }, [amenityId]);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.title}>
                Cư dân: {getResidentName(item.resident?.id || item.resident)}
            </Text>
            <Text>
                Ngày đặt: {item.booking_date ? new Date(item.booking_date).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }) : ""}
            </Text>
            <Text>Ngày sử dụng: {item.usage_date ? new Date(item.usage_date).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }) : ""}</Text>
            <Text>
                Thời gian: {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
            </Text>
            <Text>Ghi chú: {item.note || "Chưa có ghi chú"}</Text>
            <View>
                <Text>Trạng thái:</Text>
                <Picker
                    selectedValue={selectedStatuses[item.id] || item.status || "NEW"}
                    onValueChange={async (value) => {
                        const updated = { ...selectedStatuses, [item.id]: value };
                        setSelectedStatuses(updated);
                        if (value !== item.status) {
                            await handleUpdateStatus(item.id, value);
                        }
                    }}
                    style={{
                        backgroundColor: "#f0f0f0",
                        borderWidth: 1,
                        borderColor: "#ccc",
                        color: "green",
                        width: 300,
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
        </View>
    );

    return (
        <View style={[MyStyles.container, { padding: 5 }]}>
            <Text style={styles.header}>DANH SÁCH CƯ DÂN ĐĂNG KÝ TIỆN ÍCH</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#4A90E2" />
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={renderItem}
                    ListEmptyComponent={<Text style={{ textAlign: "center" }}>Không có đăng ký nào.</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        fontSize: 20,
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
        fontSize: 20,
        marginBottom: 6,
        color: "#4A90E2",
    },
});

export default AdminAmenityBooking;
