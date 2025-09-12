import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MyStyles from '../../styles/MyStyles';
import { useNavigation } from '@react-navigation/native';

const Storage = {
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('Storage getItem error:', e.toString());
      return null;
    }
  },
};

const PaymentDetailScreen = ({ route }) => {
  const { categoryId, categoryName, amount, taxPercentage } = route.params;
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Định nghĩa hàm handleDeepLink trước khi dùng
  const handleDeepLink = (event) => {
    const url = event.url;
    if (url && url.startsWith('apartmentmanagementmobileapp://payment-result')) {
      Alert.alert('Thanh toán thành công!', 'Bạn đã thanh toán thành công qua VNPay.');
      navigation.navigate('PaymentScreen');
    }
  };

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url && url.startsWith('apartmentmanagementmobileapp://payment-result')) {
        Alert.alert('Thanh toán thành công!', 'Bạn đã thanh toán thành công qua VNPay.');
        navigation.navigate('PaymentScreen');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  const handlePayOnline = async () => {
    setLoading(true);
    try {
      const token = await Storage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }
      const url = `https://4c82c6baf7b5.ngrok-free.app/paymenttransactions/${categoryId}/create-vnpay-payment/`;
      const response = await axios.post(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const paymentUrl = response.data.payment_url;
      if (paymentUrl && typeof paymentUrl === 'string') {
        Linking.openURL(paymentUrl);
      } else {
        Alert.alert('Lỗi', 'Không nhận được link thanh toán VNPay hợp lệ từ server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      Alert.alert('Lỗi', `Khởi tạo thanh toán thất bại: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={[MyStyles.sectionTitle, { marginBottom: 10 }]}>Thanh toán phí</Text>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Khoản phí: {categoryName}</Text>
      <Text style={{ fontSize: 16, marginVertical: 10 }}>
  Số tiền: {(
    parseInt(amount) +
    Math.round(parseInt(amount) * parseFloat(taxPercentage) / 100)
  ).toLocaleString('vi-VN')} VND
</Text>
      <Button
        title={loading ? "Đang xử lý..." : "Thanh toán VNPay"}
        onPress={handlePayOnline}
        disabled={loading}
        color="#1976D2"
      />
      {loading && <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 20 }} />}
      <Text style={{ marginTop: 30, color: "#888", textAlign: "center" }}>
        Nhấn "Thanh toán VNPay" để mở trang thanh toán trên web VNPay.
      </Text>
    </View>
  );
};

export default PaymentDetailScreen;