import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator, Text, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { endpoints, authApis } from '../../configs/Apis';

const PaymentScreen = () => {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const navigation = useNavigation();
  const route = useRoute();
  const residentId = route.params?.residentId;

  // Lấy dữ liệu khi vào màn hình hoặc khi residentId thay đổi
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng đăng nhập lại.');
            return;
          }
          const api = authApis(token);
          const [categoriesRes, transactionsRes] = await Promise.all([
            api.get(endpoints.paymentCategories),
            api.get(endpoints.myPayments)
          ]);
          setCategories(categoriesRes.data);
          setTransactions(transactionsRes.data);
        } catch (error) {
          Alert.alert('Lỗi', 'Không thể tải dữ liệu khoản phí hoặc giao dịch');
        } finally {
          setLoading(false);
        }
      };
      if (residentId) fetchData();
    }, [residentId])
  );

  // Lọc các khoản phí theo resident và tìm kiếm
  const filteredCategories = categories.filter(
    item =>
      item.active === true &&
      item.resident === residentId &&
      (
        item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchText.toLowerCase())
      )
  );

  // Hàm kiểm tra đã thanh toán chưa
  const isPaid = (categoryId, frequency) => {
    const now = new Date();
    return transactions.some(tx => {
      console.log(tx);
      if (
        tx.category === categoryId &&
        (tx.status === 'COMPLETED' || tx.status === 'SUCCESS')
      ) {
        if (frequency === 'MONTHLY') {
          const paidDate = new Date(tx.paid_date);
          return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
        }
        return true;
      }
      return false;
    });
  };

  // Hiển thị từng khoản phí
  const renderCategory = ({ item }) => {
    const paid = isPaid(item.id, item.frequency);
    return (
      <Card key={item.id} style={styles.card}>
        <Card.Content
          style={{ opacity: paid ? 0.6 : 1, paddingBottom: paid ? 10 : 0 }}>
          <Title style={[styles.title, paid && styles.titlePaid]}>{item.name}</Title>
          <Paragraph style={styles.amount}>
            Số tiền:{" "}
            <Text style={styles.amountValue}>
              {(
                parseInt(item.amount) +
                Math.round(parseInt(item.amount) * parseFloat(item.tax_percentage) / 100)
              ).toLocaleString('vi-VN')} VND
            </Text>
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
          {paid && (
            <Text style={styles.paidText}>
              {item.is_recurring ? "Đã thanh toán cho chu kỳ này" : "Đã thanh toán"}
            </Text>
          )}
        </Card.Content>
        {/* Nút chỉ hiện khi chưa thanh toán */}
        {!paid && (
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => {
                navigation.navigate('PaymentDetailScreen', {
                  categoryId: item.id,
                  categoryName: item.name,
                  amount: item.amount,
                  taxPercentage: item.tax_percentage,
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

  // Hàm hiển thị tần suất
  function frequencyDisplay(frequency) {
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
  }

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