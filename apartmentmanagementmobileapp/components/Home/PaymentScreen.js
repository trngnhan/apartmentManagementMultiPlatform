  import React, { useState } from 'react';
  import { ScrollView, StyleSheet, View, Alert } from 'react-native';
  import { Card, Title, Paragraph, Button, ActivityIndicator, Text, TextInput } from 'react-native-paper';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
  import MyStyles from '../../styles/MyStyles';
  import { endpoints, authApis } from '../../configs/Apis';

  const PaymentScreen = () => {
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [submittedPaymentIds, setSubmittedPaymentIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const route = useRoute();
    const residentId = route.params?.residentId;
    const [currentResidentId, setCurrentResidentId] = useState(residentId || null);
    const [searchText, setSearchText] = useState("");

    useFocusEffect(
      React.useCallback(() => {
        if (residentId) setCurrentResidentId(residentId);
      }, [residentId])
    );

    const frequencyDisplay = (frequency) => {
      switch (frequency) {
        case "ONE_TIME":
          return "Một lần";
        case "MONTHLY":
          return "Hàng tháng";
        case "QUARTERLY":
          return "Hàng quý";
        case "YEARLY":
          return "Hàng năm";
        default:
          return frequency;
      }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng đăng nhập lại.');
          return;
        }

        const api = authApis(token);

        const categoriesResponse = await api.get(endpoints.paymentCategories);
        const categoriesData = categoriesResponse.data;

        const transactionsResponse = await api.get(endpoints.myPayments);
        const transactionsData = transactionsResponse.data;

        setCategories(categoriesData);
        setTransactions(transactionsData);

        // Cập nhật danh sách khoản phí đã thanh toán (dựa trên chu kỳ)
        const now = new Date();
        const paidIds = new Set();
        transactionsData.forEach(tx => {
          if (tx.status === 'COMPLETED' || tx.status === 'SUCCESS') {
            const paidDate = new Date(tx.paid_date);
            const isMonthly = categoriesData.find(c => c.id === tx.category.id)?.frequency === 'MONTHLY';
            if (!isMonthly || (paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear())) {
              paidIds.add(tx.category.id);
            }
          }
        });
        setSubmittedPaymentIds(paidIds);

      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error.message);
        Alert.alert('Lỗi', 'Không thể tải danh sách khoản phí hoặc giao dịch');
      } finally {
        setLoading(false);
      }
    };

    useFocusEffect(
      React.useCallback(() => {
        if (currentResidentId) {
          fetchData();
        }
      }, [currentResidentId])
    );

    // Lọc các hóa đơn mà cư dân này được chọn
    const filteredCategories = categories.filter(
      item =>
        item.active === true && // chỉ lấy hóa đơn đang hoạt động
        item.resident === currentResidentId &&
        (
          item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchText.toLowerCase())
        )
    );

    const renderCategory = ({ item }) => {
      const isSubmitted = submittedPaymentIds.has(item.id);
      return (
        <Card key={item.id} style={styles.card}>
          <Card.Content>
            <Title style={[styles.title, isSubmitted && styles.titlePaid]}>{item.name}</Title>
            <Paragraph style={styles.amount}>
              Số tiền: <Text style={styles.amountValue}>{parseInt(item.amount).toLocaleString('vi-VN')} VND</Text>
            </Paragraph>
            <Paragraph style={styles.info}>
              Tần suất: <Text style={styles.infoValue}>{frequencyDisplay(item.frequency)}</Text>
            </Paragraph>
            <Paragraph style={styles.info}>
              Loại phí: <Text style={styles.infoValue}>
                {item.category_type === "MAINTENANCE" ? "Bảo trì" : item.category_type === "UTILITY" ? "Tiện ích" : item.category_type === "SERVICE" ? "Dịch vụ" : item.category_type}
              </Text>
            </Paragraph>
            <Paragraph style={styles.info}>
              Định kỳ: <Text style={styles.infoValue}>{item.is_recurring ? "Có" : "Không"}</Text>
            </Paragraph>
            <Paragraph style={styles.info}>
              Thời gian ân hạn: <Text style={styles.infoValue}>{item.grace_period} ngày</Text>
            </Paragraph>
            <Paragraph style={styles.info}>
              Thuế: <Text style={styles.infoValue}>{parseInt(item.tax_percentage)}%</Text>
            </Paragraph>
            {item.description ? (
              <Paragraph style={styles.info}>
                Mô tả: <Text style={styles.infoValue}>{item.description}</Text>
              </Paragraph>
            ) : null}
            {isSubmitted && item.is_recurring && (
              <Text style={styles.paidText}>Đã thanh toán cho chu kỳ này</Text>
            )}
            {isSubmitted && !item.is_recurring && (
              <Text style={styles.paidText}>Đã thanh toán</Text>
            )}
          </Card.Content>
          {!isSubmitted && (
            <Card.Actions>
              <Button
                mode="contained"
                onPress={() => {
                  navigation.navigate('PaymentDetailScreen', {
                    categoryId: item.id,
                    categoryName: item.name,
                    amount: item.amount,
                  });
                }}
                style={styles.payButton}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              >
                Thanh toán
              </Button>
            </Card.Actions>
          )}
        </Card>
      );
    };

    return (
      <View style={styles.container}>
        <Title style={styles.header}>DANH SÁCH CÁC KHOẢN PHÍ</Title>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm khoản phí..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#aaa"
        />
        {loading && <ActivityIndicator size="large" color="#FF6F61" style={{ marginTop: 5 }} />}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredCategories.length === 0 && !loading ? (
            <Text style={styles.emptyText}>Không có khoản phí nào</Text>
          ) : (
            filteredCategories.map(item => renderCategory({ item }))
          )}
        </ScrollView>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFF8F0',
      paddingTop: 10,
    },
    header: {
      textAlign: 'center',
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FF6F61',
      marginBottom: 10,
      marginTop: 10,
      letterSpacing: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: "#FF6F61",
      borderRadius: 8,
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: "#fff",
      fontSize: 16,
      color: "#222",
    },
    card: {
      borderRadius: 12,
      backgroundColor: '#fff',
      elevation: 3,
      shadowColor: '#FF6F61',
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      textAlign: 'center',
      fontWeight: 'bold',
      color: '#222',
    },
    titlePaid: {
      color: '#888',
      textDecorationLine: 'line-through',
    },
    amount: {
      fontSize: 16,
      color: '#444',
    },
    amountValue: {
      color: '#FF6F61',
      fontWeight: 'bold',
    },
    info: {
      fontSize: 15,
      color: '#666',
    },
    infoValue: {
      color: '#4CAF50',
      fontWeight: 'bold',
    },
    paidText: {
      fontStyle: 'italic',
      color: '#4CAF50',
      fontWeight: 'bold',
    },
    payButton: {
      backgroundColor: '#FF6F61',
      borderRadius: 15,
      margin: 10,
      paddingHorizontal: 18,
      paddingVertical: 4,
      alignSelf: 'flex-end',
      elevation: 15,
    },
    emptyText: {
      textAlign: 'center',
      color: '#767474ff',
      fontSize: 16,
    },
  });

  export default PaymentScreen;