import { View, Text } from "react-native";
import MyStyles from "../../styles/MyStyles";
import React from "react";

const AdminAmenityBooking = ({route}) => {
    const amenityId = route?.params?.amenityId;

    return (
        <View style={MyStyles.container}>
            <Text>Chào mừng bạn đã đăng nhập thành công!</Text>
            <Text>ID tiện ích: {amenityId}</Text>
            <Text>Thông tin chi tiết về tiện ích sẽ được hiển thị ở đây.</Text>
        </View>
    );
};

export default AdminAmenityBooking;
