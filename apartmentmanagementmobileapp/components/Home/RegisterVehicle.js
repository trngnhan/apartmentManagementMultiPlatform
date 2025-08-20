import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { endpoints, authApis } from "../../configs/Apis";

const RegisterVehicle = ({ navigation }) => {
    const [visitorName, setVisitorName] = useState(""); 
    const [vehicleNumber, setVehicleNumber] = useState(""); 
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!visitorName || !vehicleNumber) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const userData = await AsyncStorage.getItem("user");

            if (!userData) {
                Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
                return;
            }

            const user = JSON.parse(userData);
            const api = authApis(token);
            const now = new Date().toISOString();

            const res = await api.post(endpoints.visitorVehicleRegistrations, {
                resident: user.resident_id,
                resident_email: user.email,
                visitor_name: visitorName,
                vehicle_number: vehicleNumber,
                registration_date: now,
            });

            if (res.status === 201 || res.status === 200) {
                Alert.alert("Thành công", "Đăng ký xe thành công.");
                navigation.goBack();
            } else {
                console.error("Lỗi khi gọi API:", res.data);
                Alert.alert("Lỗi", res.data.detail || "Đăng ký xe thất bại.");
            }
        } catch (error) {
            console.error("Lỗi khi gọi API:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#fff', '#fbeee6', '#FFBAC3']}
            style={{ flex: 1 }}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.container}>
                    <Text style={styles.title}>ĐĂNG KÝ XE CHO NGƯỜI THÂN</Text>
                    <View style={styles.noteBox}>
                        <Text style={styles.noteTitle}>LƯU Ý:</Text>
                        <Text style={styles.noteText}>
                            - Đăng ký xe cho người thân trong gia đình. {"\n"}
                            - Không đăng ký xe cho người ngoài.{"\n"}
                            - Không đăng ký xe cho người không có giấy tờ tùy thân.{"\n"}
                            - Không đăng ký xe cho người không có giấy tờ xe.{"\n"}
                            - Không đăng ký xe cho người không có giấy tờ chứng minh quan hệ với người thân.{"\n"}
                            - Chỉ chấp nhận các loại xe được pháp luật cho phép lưu hành.{"\n"}
                            - Người thân của cư dân có đăng ký trước với Ban quản lý.{"\n"}
                            - Xe đăng ký phải có biển số rõ ràng, hợp lệ.{"\n"}
                            - Không đăng ký xe có dấu hiệu bị thay đổi kết cấu trái phép.{"\n"}
                            - Không đăng ký xe đang trong diện tranh chấp, bị báo mất cắp hoặc bị cơ quan chức năng tạm giữ.{"\n"}
                            - Chủ xe chịu trách nhiệm về mọi thông tin đã đăng ký.{"\n"}
                            - Ban quản lý có quyền từ chối hoặc hủy đăng ký nếu phát hiện thông tin sai lệch.{"\n"}
                            - Thời gian đăng ký xe chỉ có hiệu lực trong thời gian cư dân sinh sống tại chung cư.{"\n"}
                            - Khi có thay đổi về thông tin xe hoặc người thân, cư dân phải cập nhật lại với Ban quản lý.{"\n"}
                        </Text>
                    </View>
                    <Text style={styles.subTitle}>
                        Nhập thông tin xe của người thân để đăng ký.
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Tên khách"
                        value={visitorName}
                        onChangeText={setVisitorName}
                        placeholderTextColor="#aaa"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Biển số xe"
                        value={vehicleNumber}
                        onChangeText={setVehicleNumber}
                        placeholderTextColor="#aaa"
                    />
                    <TouchableOpacity
                        style={[styles.button, loading && { backgroundColor: "#ccc" }]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? "Đang xử lý..." : "Đăng ký"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 22,
        justifyContent: "center",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FF6F61",
        marginBottom: 18,
        textAlign: "center",
        letterSpacing: 1,
    },
    noteBox: {
        backgroundColor: "#fff3e6",
        borderLeftWidth: 5,
        borderLeftColor: "#FF6F61",
        borderRadius: 10,
        padding: 12,
        marginBottom: 18,
        elevation: 15,
    },
    noteTitle: {
        fontWeight: "bold",
        color: "#FF6F61",
        marginBottom: 4,
        fontSize: 16,
    },
    noteText: {
        color: "#444",
        fontSize: 14,
        lineHeight: 20,
    },
    subTitle: {
        marginBottom: 12,
        fontSize: 16,
        color: "#333",
        textAlign: "center",
    },
    input: {
        borderWidth: 1,
        borderColor: "#FF6F61",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        backgroundColor: "#fff",
        fontSize: 16,
        color: "#222",
    },
    button: {
        backgroundColor: "#FF6F61",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 8,
        elevation: 3,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 17,
        letterSpacing: 1,
    },
});

export default RegisterVehicle;