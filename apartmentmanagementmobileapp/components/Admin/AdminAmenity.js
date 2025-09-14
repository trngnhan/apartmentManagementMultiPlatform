import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, TextInput, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

const AdminAmenity = () => {
    const [amenities, setAmenities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        location: "",
        opening_time: "",
        closing_time: "",
        max_bookings_per_slot: "1",
        image: "",
        fee: ""
    });
    const [editId, setEditId] = useState(null);
    const navigation = useNavigation();
    const [search, setSearch] = useState("");

    const fetchAmenities = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.get(endpoints.amenities);
            setAmenities(res.data.results || res.data);
            console.log("Fetched amenities:", res.data.results || res.data);
        } catch (err) {
            setAmenities([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAmenities();
    }, []);

    const handleAddAmenity = async () => {
        if (!form.name || !form.location || !form.opening_time || !form.closing_time) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin bắt buộc.");
            return;
        }
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const payload = {
                ...form,
                max_bookings_per_slot: parseInt(form.max_bookings_per_slot) || 1,
                fee: parseFloat(form.fee) || 0
            };
            let res;
            if (editId) {
                res = await api.put(`${endpoints.amenities}${editId}/`, payload);
            } else {
                res = await api.post(endpoints.amenities, payload);
            }
            if (res.status === 201 || res.status === 200) {
                Alert.alert("Thành công", editId ? "Đã sửa tiện ích!" : "Đã thêm tiện ích mới!");
                setShowModal(false);
                setForm({
                    name: "",
                    description: "",
                    location: "",
                    opening_time: "",
                    closing_time: "",
                    max_bookings_per_slot: "1",
                    image: ""
                });
                setEditId(null);
                fetchAmenities();
            } else {
                Alert.alert("Lỗi", "Không thể lưu tiện ích.");
            }
        } catch (err) {
            Alert.alert("Lỗi", "Có lỗi xảy ra khi lưu tiện ích.");
        }
    };

    const handleDeleteAmenity = async (id) => {
        Alert.alert(
            "Xác nhận",
            "Bạn có chắc muốn xoá tiện ích này?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xoá",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("token");
                            const api = authApis(token);
                            const res = await api.delete(`${endpoints.amenities}${id}/`);
                            if (res.status === 204 || res.status === 200) {
                                Alert.alert("Thành công", "Đã xoá tiện ích.");
                                fetchAmenities();
                            } else {
                                Alert.alert("Lỗi", "Không thể xoá tiện ích.");
                            }
                        } catch (err) {
                            Alert.alert("Lỗi", "Có lỗi xảy ra khi xoá tiện ích.");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate("AdminAmenityBooking", { amenityId: item.id })} style={styles.card}>
            {console.log("Rendering item:", item)}
            <Text style={[styles.title, {textAlign: "center"}]}>{item.name}</Text>
            {item.image ? (
                <Image
                    source={{ uri: typeof item.image === "string" ? item.image : item.image?.url }}
                    style={{ width: "100%", height: 140, borderRadius: 8, marginBottom: 8 }}
                    resizeMode="cover"
                />
            ) : (
                <Text style={{ color: "#aaa", textAlign: "center" }}>Không có ảnh</Text>
            )}
            <Text>Vị trí: {item.location}</Text>
            <Text>
            Giá: {item.fee !== undefined && item.fee !== null ? Number(item.fee).toLocaleString("vi-VN") : "0"} VNĐ
            </Text>
            <Text>Mô tả: {item.description || "Không có mô tả"}</Text>
            <Text style={{ textDecorationColor: "#086bdcff", textDecorationLine: "underline" }}>
                Giờ mở cửa: {item.opening_time?.slice(0, 5)} - {item.closing_time?.slice(0, 5)}
            </Text>
            <Text style={{ textDecorationColor: "#086bdcff", textDecorationLine: "underline" }}>
                Số lượt đặt tối đa mỗi khung: {item.max_bookings_per_slot} người
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
                <TouchableOpacity
                style={{
                    backgroundColor: "#FFA500",
                    padding: 8,
                    borderRadius: 6,
                    marginTop: 10,
                    alignSelf: "flex-end",
                    marginRight: 10,
                }}
                onPress={() => {
                    setForm({
                        name: item.name,
                        description: item.description,
                        location: item.location,
                        fee: item.fee ? item.fee.toString() : "",
                        opening_time: item.opening_time,
                        closing_time: item.closing_time,
                        max_bookings_per_slot: item.max_bookings_per_slot.toString(),
                        image: item.image || ""
                    });
                    setEditId(item.id);
                    setShowModal(true);
                }}
            >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Sửa tiện ích</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    backgroundColor: "#F44336",
                    padding: 8,
                    borderRadius: 6,
                    marginTop: 10,
                    alignSelf: "flex-end"
                }}
                onPress={() => handleDeleteAmenity(item.id)}
            >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Xoá tiện ích</Text>
            </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#fad390', '#fad0c4', '#ff9a9e']} style={MyStyles.container}>
            <Text style={styles.header}>QUẢN LÝ TIỆN ÍCH</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, marginTop: 4, justifyContent: "space-between" }}>
                <TextInput
                    style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderRadius: 8,
                        padding: 8,
                        marginRight: 8,
                        backgroundColor: "#fff",
                    }}
                    placeholder="Tìm kiếm tiện ích..."
                    value={search}
                    onChangeText={setSearch}
                />
                <TouchableOpacity
                    style={{
                        backgroundColor: "#4A90E2",
                        padding: 10,
                        borderRadius: 8,
                        alignSelf: "center",
                    }}
                    onPress={() => setShowModal(true)}
                >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Thêm tiện ích</Text>
                </TouchableOpacity>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color="#fad0c4" />
            ) : (
                <FlatList
                    data={amenities.filter(item =>
                        item.name.toLowerCase().includes(search.toLowerCase()) ||
                        (item.location && item.location.toLowerCase().includes(search.toLowerCase()))
                    )}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={renderItem}
                    ListEmptyComponent={<Text style={{ textAlign: "center" }}>Không có tiện ích nào.</Text>}
                />
            )}

            {/* Modal thêm tiện ích */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.title}>
                            {editId ? "Sửa tiện ích" : "Thêm tiện ích mới"}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Tên tiện ích*"
                            value={form.name}
                            onChangeText={t => setForm({ ...form, name: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Vị trí*"
                            value={form.location}
                            onChangeText={t => setForm({ ...form, location: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Giá"
                            keyboardType="numeric"
                            value={form.fee}
                            onChangeText={t => setForm({ ...form, fee: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Giờ mở cửa (hh:mm:ss)*"
                            value={form.opening_time}
                            onChangeText={t => setForm({ ...form, opening_time: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Giờ đóng cửa (hh:mm:ss)*"
                            value={form.closing_time}
                            onChangeText={t => setForm({ ...form, closing_time: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Số lượt đặt tối đa mỗi khung"
                            keyboardType="numeric"
                            value={form.max_bookings_per_slot}
                            onChangeText={t => setForm({ ...form, max_bookings_per_slot: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Mô tả"
                            value={form.description}
                            onChangeText={t => setForm({ ...form, description: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Link ảnh (nếu có)"
                            value={form.image}
                            onChangeText={t => setForm({ ...form, image: t })}
                        />
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: "#4A90E2" }]}
                                onPress={handleAddAmenity}
                            >
                                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                                    {editId ? "Lưu thay đổi" : "Thêm"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: "#aaa" }]}
                                onPress={() => {
                                    setShowModal(false);
                                    setEditId(null);
                                    setForm({
                                        name: "",
                                        description: "",
                                        location: "",
                                        opening_time: "",
                                        closing_time: "",
                                        max_bookings_per_slot: "1",
                                        image: ""
                                    });
                                }}
                            >
                                <Text style={{ color: "#fff" }}>Hủy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        color: "#4A90E2",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        width: "90%",
        elevation: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: "center",
    },
});

export default AdminAmenity;