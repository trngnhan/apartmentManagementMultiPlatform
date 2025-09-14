import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { endpoints, authApis } from "../../configs/Apis";
import DatePicker from "expo-datepicker";
import MyStyles from "../../styles/MyStyles";
import { Image } from "react-native";
import { useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const AmenityBookingScreen = ({navigation}) => {
    const route = useRoute();
    const resident = route.params?.resident;
    const [amenities, setAmenities] = useState([]);
    const [usageDate, setUsageDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedAmenity, setSelectedAmenity] = useState(null);
    const [booking, setBooking] = useState(null);
    const [note, setNote] = useState("");
    const [myBookings, setMyBookings] = useState([]);
    const residentId = resident.resident_id;
    console.log("Resident ID for booking:", residentId);  

    useEffect(() => {
        fetchAmenities();
        if (resident) fetchMyBookings();
    }, [resident, booking]);

    const fetchMyBookings = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.get(endpoints.myAmenityBookings(residentId));
            setMyBookings(res.data.results || res.data);
            console.log("My bookings fetched:", res.data);
        } catch (err) {
            setMyBookings([]);
        }
    };

    const fetchAmenities = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.get(endpoints.amenities);
            //console.log("Amenities fetched:", res.data);
            setAmenities(res.data.results || res.data);
        } catch (err) {
            setAmenities([]);
        }
        setLoading(false);
    };

    const handleBooking = async () => {
        if (!selectedAmenity) {
            Alert.alert("Lỗi", "Vui lòng chọn tiện ích.");
            return;
        }
        if (!usageDate || !startTime || !endTime) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ ngày sử dụng và giờ.");
            return;
        }
        if (!resident) {
            Alert.alert("Lỗi", "Không tìm thấy thông tin cư dân.");
            return;
        }
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);

            const payload = {
                amenity: selectedAmenity.id,
                resident: residentId,
                booking_date: new Date().toISOString().slice(0, 10),
                usage_date: usageDate,
                start_time: startTime,
                end_time: endTime,
                note: note,
                status: "NEW",
            };
            console.log("Booking payload:", payload);
            const res = await api.post(endpoints.amenityBooking, payload);
            if (res.status === 201 || res.status === 200) {
                setBooking(res.data);
                Alert.alert("Thành công", "Đã gửi yêu cầu đặt tiện ích!");
            } else {
                // Nếu backend trả về lỗi, hiển thị lỗi chi tiết
                const errorMsg = res.data?.detail || "Không thể đặt tiện ích.";
                Alert.alert("Lỗi", errorMsg);
            }
        } catch (err) {
            let errorMsg = "Có lỗi xảy ra khi đặt tiện ích.";
            if (err?.response?.data) {
                // Nếu là JSON, hiển thị chi tiết
                if (typeof err.response.data === "object") {
                    errorMsg = JSON.stringify(err.response.data, null, 2);
                } else if (typeof err.response.data === "string" && err.response.data.startsWith("{")) {
                    try {
                        errorMsg = JSON.stringify(JSON.parse(err.response.data), null, 2);
                    } catch {
                        errorMsg = err.response.data;
                    }
                } else {
                    // Nếu là HTML hoặc text, chỉ hiển thị thông báo chung
                    errorMsg = "Lỗi hệ thống hoặc dữ liệu gửi lên không hợp lệ.";
                }
            } else if (err.message) {
                errorMsg = err.message;
            }
            console.log("Booking error:", err?.response?.data || err.message || err);
            Alert.alert("Lỗi", errorMsg);
        }
    };

    if (loading) {
        return (
            <View style={MyStyles.container}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text>Đang tải danh sách tiện ích...</Text>
            </View>
        );
    }

    return (
            <LinearGradient colors={['#ffffffff', '#b0e3c4ff', '#69ac91ff']} 
            style={[MyStyles.container, { padding: 20 }]}
            >
                <Text style={styles.header}>ĐẶT TIỆN TÍCH CHUNG CƯ</Text>
                <Text style={{ marginBottom: 8, fontWeight: "bold"}}>CHỌN TIỆN ÍCH</Text>
                <FlatList
                    data={amenities}
                    horizontal
                    style={{ height: "0", width: "100%", marginBottom: 16 }}
                    keyExtractor={item => item.id?.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.amenityCard,
                                selectedAmenity?.id === item.id && styles.selectedAmenityCard
                            ]}
                            onPress={() => setSelectedAmenity(item)}
                        >
                            {item.image ? (
                                <Image
                                    source={{ uri: typeof item.image === "string" ? item.image : item.image?.url }}
                                    style={{ width: 200, height: 350, borderRadius: 8, marginBottom: 6 }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text style={{ color: "#aaa", textAlign: "center", marginBottom: 6 }}>Không có ảnh</Text>
                            )}
                            <Text style={{ fontSize: 14, color: "#e67e22", fontWeight: "bold" }}>
                                Giá: {item.fee !== undefined && item.fee !== null ? Number(item.fee).toLocaleString("vi-VN") : "0"} VNĐ
                            </Text>
                            <Text style={{ fontWeight: "bold", color: "#4A90E2" }}>{item.name}</Text>
                            <Text style={{ fontSize: 12 }}>{item.location}</Text>
                            <Text style={{ fontSize: 12 }}>{item.opening_time} - {item.closing_time}</Text>
                        </TouchableOpacity>
                    )}
                    showsHorizontalScrollIndicator={false}
                />

                <TextInput
                    style={[styles.input, { minHeight: 8, width: "70%" }]}
                    placeholder="Ngày sử dụng (YYYY-MM-DD)"
                    value={usageDate}
                    onChangeText={setUsageDate}
                />

                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.inputHalf, { marginRight: 8 }]}
                        placeholder="Giờ bắt đầu (HH:mm)"
                        value={startTime}
                        onChangeText={setStartTime}
                    />
                    <TextInput
                        style={[styles.input, styles.inputHalf]}
                        placeholder="Giờ kết thúc (HH:mm)"
                        value={endTime}
                        onChangeText={setEndTime}
                    />
                </View>

                <TextInput
                    style={[styles.input, { minHeight: 8, width: "100%" }]}
                    placeholder="Ghi chú (nếu có)"
                    value={note}
                    onChangeText={setNote}
                    multiline
                />

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                    <TouchableOpacity
                        style={[styles.button, { flex: 1, marginRight: 8 }]}
                        onPress={handleBooking}
                    >
                        <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>Đặt tiện ích</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.buttonn, { flex: 1 }]}
                        onPress={() => navigation.navigate("BookingDetailScreen", { myBookings, amenities, residentId })}
                    >
                        <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>Các tiện ích đã đặt</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    };

const styles = StyleSheet.create({
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#0F4C75",
        textAlign: "center"
    },
    amenityCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 12,
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#4A90E2",
        minWidth: 120,
        alignItems: "center"
    },
    selectedAmenityCard: {
        backgroundColor: "#e3f2fd",
        borderColor: "#1976d2"
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: "#fff"
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    inputHalf: {
        flex: 1,
    },
    button: {
        backgroundColor: "#4A90E2",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10
    },
    resultCard: {
        backgroundColor: "#e8f5e9",
        borderRadius: 10,
        padding: 14,
        marginTop: 18,
        alignItems: "center"
    },
    buttonn: {
        backgroundColor: "#e70909ff",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10
    }
});

export default AmenityBookingScreen;