import hmac
import hashlib
from urllib.parse import quote
from datetime import datetime

def create_vnpay_payment(amount, order_id, order_info, return_url):
    vnp_TmnCode = "JDAC1OV8"
    vnp_HashSecret = "3U50K0K5HPKDQJB7G3MVNZVAGBU3OVL1"
    vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    vnp_ReturnUrl = return_url

    vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': vnp_TmnCode,
        'vnp_Amount': str(int(amount) * 100),
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': str(order_id),
        'vnp_OrderInfo': order_info,
        'vnp_OrderType': 'other',
        'vnp_Locale': 'vn',
        'vnp_ReturnUrl': vnp_ReturnUrl,
        'vnp_IpAddr': '192.168.44.103',
        'vnp_CreateDate': datetime.now().strftime('%Y%m%d%H%M%S'),
    }

    sorted_params = sorted(vnp_Params.items())
    hashdata = '&'.join([f"{k}={v}" for k, v in sorted_params])
    print("VNPay hashdata:", hashdata)

    secure_hash = hmac.new(
        bytes(vnp_HashSecret, 'utf-8'),
        bytes(hashdata, 'utf-8'),
        hashlib.sha512
    ).hexdigest()
    print("VNPay secure_hash:", secure_hash)

    query_string = '&'.join([f"{k}={quote(str(v), safe='')}" for k, v in sorted_params])
    pay_url = f"{vnp_Url}?{query_string}&vnp_SecureHash={secure_hash}"
    print("VNPay pay_url:", pay_url)
    return pay_url

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import hmac
import hashlib

@api_view(['GET'])
def vnpay_ipn(request):
    # Lấy tất cả tham số từ VNPay gửi về
    vnp_data = request.query_params.dict()
    vnp_secure_hash = vnp_data.pop('vnp_SecureHash', None)
    vnp_secure_hash_type = vnp_data.pop('vnp_SecureHashType', None)

    # Sắp xếp tham số theo alphabet
    sorted_params = sorted(vnp_data.items())
    hashdata = '&'.join([f"{k}={v}" for k, v in sorted_params])

    # Tạo lại secure_hash để kiểm tra
    vnp_HashSecret = "3U50K0K5HPKDQJB7G3MVNZVAGBU3OVL1"
    generated_hash = hmac.new(
        bytes(vnp_HashSecret, 'utf-8'),
        bytes(hashdata, 'utf-8'),
        hashlib.sha512
    ).hexdigest().upper()

    if generated_hash == (vnp_secure_hash or '').upper():
        # Kiểm tra trạng thái giao dịch (vnp_ResponseCode == '00' là thành công)
        if vnp_data.get('vnp_ResponseCode') == '00':
            # TODO: Cập nhật trạng thái giao dịch trong DB tại đây
            return Response({'RspCode': '00', 'Message': 'Confirm Success'}, status=status.HTTP_200_OK)
        else:
            return Response({'RspCode': '00', 'Message': 'Confirm Fail'}, status=status.HTTP_200_OK)
    else:
        return Response({'RspCode': '97', 'Message': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)