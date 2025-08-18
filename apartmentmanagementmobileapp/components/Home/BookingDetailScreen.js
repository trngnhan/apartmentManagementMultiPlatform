import React from "react";
import { View, Text, StyleSheet } from "react-native";

const BookingDetailScreen = ({ route }) => {
    const { booking } = route.params;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Chi tiết đặt tiện ích</Text>
            <Text style={styles.label}>Tên tiện ích:</Text>
            <Text style={styles.value}>
                {booking.amenity?.name || booking.amenityObj?.name || `ID: ${booking.amenity}`}
            </Text>
            <Text style={styles.label}>Ngày sử dụng:</Text>
            <Text style={styles.value}>{booking.booking_date}</Text>
            <Text style={styles.label}>Thời gian:</Text>
            <Text style={styles.value}>
                {booking.start_time?.slice(0,5)} - {booking.end_time?.slice(0,5)}
            </Text>
            <Text style={styles.label}>Trạng thái:</Text>
            <Text style={styles.value}>{booking.status}</Text>
            <Text style={styles.label}>Ghi chú:</Text>
            <Text style={styles.value}>{booking.note || "Không có ghi chú"}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: "#f8f8f8"
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        color: "#0F4C75",
        textAlign: "center"
    },
    label: {
        fontWeight: "bold",
        marginTop: 10,
        color: "#333"
    },
    value: {
        fontSize: 16,
        marginBottom: 6,
        color: "#222"
    }
});

export default BookingDetailScreen;