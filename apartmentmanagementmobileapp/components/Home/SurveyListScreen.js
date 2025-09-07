import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert, StyleSheet } from "react-native";
import { Card, Title, Paragraph, Button, RadioButton, Text } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import { endpoints, authApis } from "../../configs/Apis";

const SurveyListScreen = () => {
    const [surveys, setSurveys] = useState([]);
    const [responses, setResponses] = useState({});
    const [submittedSurveyIds, setSubmittedSurveyIds] = useState(new Set());
    const [token, setToken] = useState("");

    const fetchSurveys = async (tokenParam) => {
        try {
            const api = authApis(tokenParam);
            const res = await api.get(endpoints.surveys || "/surveys/");
            if (res.status === 200) {
                setSurveys(res.data);
            } else {
                Alert.alert("Lỗi", "Không thể tải danh sách khảo sát.");
            }
        } catch (err) {
            console.error("Lỗi fetch surveys:", err);
        }
    };

    const fetchMyResponses = async (tokenParam) => {
        try {
            const api = authApis(tokenParam);
            const res = await api.get(endpoints.mySurveyResponses || "/surveyresponses/");
            if (res.status === 200) {
                const data = res.data;
                const surveyIds = new Set(data.map((r) => r.survey));
                setSubmittedSurveyIds(surveyIds);

                const prefillResponses = {};
                data.forEach((r) => {
                    prefillResponses[r.survey] = r.option.toString();
                });
                setResponses(prefillResponses);
            } else {
                console.warn("Không thể lấy phản hồi của cư dân.");
            }
        } catch (err) {
            console.error("Lỗi fetch responses:", err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const savedToken = await AsyncStorage.getItem("token");
                if (savedToken) {
                    setToken(savedToken);
                    await fetchSurveys(savedToken);
                    await fetchMyResponses(savedToken);
                } else {
                    console.warn("Không tìm thấy token.");
                }
            } catch (err) {
                console.error("Lỗi khi lấy token:", err);
            }
        };

        loadData();
    }, []);

    const submitResponse = async (surveyId, optionId) => {
        try {
            const res = await api.post(endpoints.surveyResponses || "/surveyresponses/", {
                survey: surveyId,
                option: optionId,
            });

            if (res.ok) {
                Alert.alert("Thành công", "Bạn đã phản hồi khảo sát.");
                setResponses((prev) => ({ ...prev, [surveyId]: optionId.toString() }));
                setSubmittedSurveyIds((prev) => new Set(prev).add(surveyId));
            } else {
                const error = await res.json();
                Alert.alert("Lỗi", error.detail || "Không thể gửi phản hồi.");
            }
        } catch (err) {
            Alert.alert("Lỗi", "Không thể gửi phản hồi.");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Title style={styles.header}>DANH SÁCH KHẢO SÁT</Title>

            {surveys.map((survey) => {
                const isSubmitted = submittedSurveyIds.has(survey.id);

                return (
                    <Card key={survey.id} style={styles.card}>
                        <Card.Content>
                            <Title style={styles.surveyTitle}>{survey.title}</Title>
                            <Paragraph style={styles.surveyDesc}>{survey.description}</Paragraph>

                            {isSubmitted ? (
                                <Text style={styles.submittedText}>
                                    Cư dân đã thực hiện khảo sát này.
                                </Text>
                            ) : (
                                <>
                                    <RadioButton.Group
                                        onValueChange={(value) =>
                                            setResponses((prev) => ({ ...prev, [survey.id]: value }))
                                        }
                                        value={responses[survey.id]}
                                    >
                                        {survey.options.map((opt) => (
                                            <View
                                                key={opt.id}
                                                style={styles.optionRow}
                                            >
                                                <RadioButton value={opt.id.toString()} color="#FF6F61" />
                                                <Text style={styles.optionText}>{opt.option_text}</Text>
                                            </View>
                                        ))}
                                    </RadioButton.Group>

                                    <Button
                                        mode="contained"
                                        onPress={() => {
                                            if (!responses[survey.id]) {
                                                Alert.alert("Thông báo", "Vui lòng chọn một lựa chọn.");
                                            } else {
                                                submitResponse(
                                                    parseInt(survey.id),
                                                    parseInt(responses[survey.id])
                                                );
                                            }
                                        }}
                                        style={styles.submitBtn}
                                        labelStyle={{ color: "#fff", fontWeight: "bold" }}
                                    >
                                        Gửi phản hồi
                                    </Button>
                                </>
                            )}
                        </Card.Content>
                    </Card>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#FFF8F0",
        flexGrow: 1,
    },
    header: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#FF6F61",
        textAlign: "center",
        marginBottom: 10,
        marginTop: 8,
        letterSpacing: 1,
    },
    card: {
        marginBottom: 18,
        borderRadius: 12,
        backgroundColor: "#fff",
        elevation: 3,
        shadowColor: "#FF6F61",
        shadowOpacity: 0.10,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    surveyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#222",
        marginBottom: 4,
    },
    surveyDesc: {
        color: "#666",
        marginBottom: 10,
        fontSize: 15,
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
        marginLeft: 6,
    },
    optionText: {
        fontSize: 15,
        color: "#333",
    },
    submittedText: {
        marginTop: 8,
        fontStyle: "italic",
        color: "#4CAF50",
        fontWeight: "bold",
        fontSize: 15,
    },
    submitBtn: {
        backgroundColor: "#FF6F61",
        borderRadius: 8,
        marginTop: 10,
        paddingHorizontal: 18,
        paddingVertical: 4,
        alignSelf: "flex-end",
        elevation: 2,
    },
});

export default SurveyListScreen;