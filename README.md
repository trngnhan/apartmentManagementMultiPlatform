# Hệ thống quản lý cư dân chung cư đa nền tảng

## 🏠 Giới thiệu

Đây là một hệ thống quản lý cư dân chung cư đa nền tảng, bao gồm **trang web dành cho quản trị viên** và **ứng dụng di động và website dành cho cư dân**. Hệ thống giúp quản lý tài khoản, phản ánh, khảo sát, thanh toán điện tử, và tương tác thời gian thực giữa cư dân và ban quản trị.

- 🌐 Web (Admin): Xây dựng bằng **Django** + Django REST Framework
- 🌐 Web (Resident Web App): Xây dụng bằng **ReactJS**
- 📱 Mobile (Resident App): Xây dựng bằng **React Native**
- ☁️ Dịch vụ thời gian thực và thông báo: **Firebase**
- 💰 Thanh toán: Tích hợp **MoMo, VNPAY**
- 🗺️ Định vị: Tích hợp **react-native-maps**

---

## 🔧 Các chức năng chính

### 🎯 Quản trị viên (Website - Django Admin Panel)
- Quản lý tài khoản cư dân, cấp và khóa tài khoản khi chuyển nhượng căn hộ
- Tiếp nhận và xử lý các phản ánh từ cư dân
- Quản lý thông tin người thân nhận thẻ gửi xe
- Tạo khảo sát và thống kê kết quả
- Nhận thông báo khi có hàng được gửi vào tủ đồ cư dân (qua FCM)
- Chat thời gian thực với cư dân (Firebase Realtime Chat)

### 👤 Cư dân (Mobile App và Web App - React)
- Đăng nhập hệ thống và cập nhật hồ sơ cá nhân
- Đóng phí (quản lý, gửi xe, dịch vụ) qua chuyển khoản hoặc thanh toán online
- Tra cứu hóa đơn
- Đăng ký người thân nhận thẻ gửi xe
- Gửi phản ánh về các vấn đề trong chung cư
- Tham gia khảo sát dịch vụ
- Nhận thông báo và trạng thái món hàng gửi vào tủ đồ
- Chat trực tiếp với ban quản trị

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|-----------|-----------|
| Backend   | Django, Django REST Framework |
| Frontend (Web App) | ReactJS |
| Frontend (Mobile App) | React Native, Expo |
| Realtime Chat + Notifications | Firebase Realtime Database, Firebase Cloud Messaging (FCM) |
| Thanh toán | MoMo API, VNPAY API |
| Lưu trữ ảnh | Cloudinary |
| Định vị và bản đồ | react-native-maps |

---

## 🌍 Triển khai

### Backend (Django)
- Triển khai trên [PythonAnywhere](https://www.pythonanywhere.com)
- Giao tiếp bằng REST API

### Mobile App (React Native)
- Dùng Expo để phát triển và chạy ứng dụng Android
- Có thể build APK để cài đặt thủ công

---
