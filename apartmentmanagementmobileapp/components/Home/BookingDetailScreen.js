import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";

const BookingDetailScreen = ({ route, navigation }) => {
    const { myBookings, amenities, resident } = route.params;
    
    // Lọc booking chỉ của cư dân hiện tại
    const filteredBookings = myBookings.filter(
        b => b.resident && (b.resident.id === resident.resident_id)
    );
    
    return (
        <LinearGradient colors={['#ffffff', '#fafafa', '#69ac91']} style={{ flex: 1, padding: 16 }}>
            <Text style={styles.header}>CÁC TIỆN ÍCH ĐÃ ĐẶT</Text>
            <FlatList
                data={filteredBookings}
                keyExtractor={item => item.id?.toString()}
                renderItem={({ item }) => {
                    const amenityObj = amenities.find(a => a.id === item.amenity || a.id === item.amenity?.id);
                    return (
                        <TouchableOpacity style={styles.resultCard}>
                            <Text style={styles.title}>
                                Tên tiện ích: {amenityObj?.name || item.amenity?.name || item.amenity}
                            </Text>
                            <Text>Ngày đặt: {item.booking_date ? new Date(item.booking_date).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" }) : ""}</Text>
                            <Text>Ngày sử dụng: {item.usage_date ? new Date(item.usage_date).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" }) : ""}</Text>
                            <Text>Thời gian: {item.start_time?.slice(0,5)} - {item.end_time?.slice(0,5)}</Text>
                            <Text>
                                Trạng thái:{" "}
                                <Text style={{ fontWeight: "bold", color: item.status === "confirmed" ? "green" : "red" }}>
                                    {item.status === "NEW"
                                    ? "Mới"
                                    : item.status === "APPROVED"
                                    ? "Đồng ý"
                                    : item.status === "REJECTED"
                                    ? "Không đồng ý"
                                    : item.status}
                                </Text>
                            </Text>
                            <Text>Ghi chú: {item.note || "Không có"}</Text>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20 }}>Chưa có lịch sử đặt tiện ích.</Text>}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: {
        fontWeight: "bold",
        fontSize: 25,
        marginBottom: 5,
        textAlign: "center",
        color: "#0F4C75"
    },
    resultCard: {
        backgroundColor: "#e8f5e9",
        borderRadius: 10,
        padding: 14,
        marginTop: 12,
        alignItems: "flex-start",
        width: "100%",
        alignSelf: "stretch",
    },
    title: {
        color: "#388e3c",
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 4,
    }
});

export default BookingDetailScreen;