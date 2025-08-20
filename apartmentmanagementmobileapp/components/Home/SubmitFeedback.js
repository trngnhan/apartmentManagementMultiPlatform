import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert, Text, StyleSheet } from "react-native";
import { TextInput, Button, Title, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import { endpoints, authApis } from "../../configs/Apis";

const SubmitFeedback = () => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [myFeedbacks, setMyFeedbacks] = useState([]);
    const [token, setToken] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const savedToken = await AsyncStorage.getItem("token");
            setToken(savedToken);
            fetchMyFeedbacks(savedToken);
        };
        fetchData();
    }, []);

    const fetchMyFeedbacks = async (tokenParam = token) => {
        try {
            const api = authApis(tokenParam);
            const res = await api.get(endpoints.myFeedbacks);
            if (res.status === 200) {
                setMyFeedbacks(res.data);
            } else {
                console.warn("Không thể tải danh sách phản hồi.");
            }
        } catch (err) {
            console.error("Lỗi khi tải phản hồi:", err);
        }
    };

    const handleSubmit = async () => {
        if (!title || !content) {
            Alert.alert("Thông báo", "Vui lòng nhập đầy đủ tiêu đề và nội dung.");
            return;
        }

        setLoading(true);

        try {
            const api = authApis(token);
            const res = await api.post(endpoints.feedbacks, { title, content });
            if (res.status === 201 || res.status === 200) {
                Alert.alert("Thành công", "Gửi phản hồi thành công.");
                setTitle("");
                setContent("");
                fetchMyFeedbacks();
            } else {
                console.error("Lỗi gửi phản hồi:", res.data);
                Alert.alert("Lỗi", res.data.detail || "Không thể gửi phản hồi.");
            }
        } catch (err) {
            console.error("Lỗi mạng:", err);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi gửi phản hồi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Title style={styles.header}>NỘI DUNG PHẢN ÁNH</Title>

            <TextInput
                label="Tiêu đề"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                mode="outlined"
                theme={{ colors: { primary: "#FF6F61" } }}
            />
            <TextInput
                label="Nội dung"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={5}
                style={styles.input}
                mode="outlined"
                theme={{ colors: { primary: "#FF6F61" } }}
            />

            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitBtn}
                labelStyle={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
            >
                Gửi phản hồi
            </Button>

            <Title style={styles.subHeader}>PHẢN ÁNH CỦA BẠN</Title>

            {myFeedbacks.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có phản hồi nào.</Text>
            ) : (
                myFeedbacks.map((fb) => (
                    <Card
                        key={fb.id}
                        style={styles.feedbackCard}
                    >
                        <Card.Title
                            title={fb.title}
                            titleStyle={styles.feedbackTitle}
                        />
                        <Card.Content>
                            <Text style={styles.feedbackContent}>{fb.content}</Text>
                            <Text style={[
                                styles.feedbackStatus,
                                fb.status === "pending"
                                    ? { color: "#FFA500" }
                                    : fb.status === "approved"
                                    ? { color: "#eaff00ff" }
                                    : { color: "#4CAF50" }
                            ]}>
                                Trạng thái: {fb.status === "pending" ? "Chờ xử lý" : fb.status === "approved" ? "Đã duyệt" : fb.status}
                            </Text>
                        </Card.Content>
                    </Card>
                ))
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 18,
        backgroundColor: "#FFF8F0",
        flexGrow: 1,
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FF6F61",
        textAlign: "center",
        marginBottom: 18,
        marginTop: 8,
        letterSpacing: 1,
    },
    subHeader: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000100ff",
        marginTop: 22,
        textAlign: "center",
    },
    input: {
        marginBottom: 14,
        backgroundColor: "#fff",
        borderRadius: 8,
    },
    submitBtn: {
        marginTop: 8,
        backgroundColor: "#FF6F61",
        borderRadius: 8,
        elevation: 5,
        paddingVertical: 6,
    },
    emptyText: {
        color: "#888",
        marginTop: 12,
        textAlign: "center",
        fontSize: 15,
    },
    feedbackCard: {
        marginVertical: 8,
        backgroundColor: "#fff",
        borderRadius: 12,
        elevation: 2,
        borderLeftWidth: 5,
        borderLeftColor: "#FF6F61",
        shadowColor: "#FF6F61",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    feedbackTitle: {
        fontWeight: "bold",
        fontSize: 18,
        marginTop: 10,
        color: "#FF6F61",
    },
    feedbackContent: {
        marginBottom: 6,
        fontSize: 15,
        color: "#333",
    },
    feedbackStatus: {
        fontSize: 13,
        fontWeight: "bold",
        marginTop: 2,
    },
});

export default SubmitFeedback;