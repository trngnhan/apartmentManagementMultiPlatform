import logging
from cloudinary.utils import now
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import (
    authenticate, login, update_session_auth_hash, get_user_model
)
from django.utils import timezone

from rest_framework import viewsets, generics, permissions, status, parsers
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter, OrderingFilter

from django_filters.rest_framework import DjangoFilterBackend

from apartmentmanagement import settings

from .permissions import IsAdminRole, IsAdminOrSelf, IsAdminOrManagement
from .pagination import Pagination
from .models import (
    Resident, Apartment, ApartmentTransferHistory, PaymentCategory,
    PaymentTransaction, ParcelLocker, ParcelItem,
    Feedback, Survey, SurveyOption, SurveyResponse, VisitorVehicleRegistration, AmenityBooking, Amenity, PaymentForm
)
from .serializers import PaymentCategorySerializer, PaymentTransactionSerializer, AmenityBookingSerializer, \
    AmenitySerializer

from apartments.serializers import (
    UserSerializer, ResidentSerializer, ApartmentSerializer,
    ApartmentTransferHistorySerializer, ParcelItemSerializer, ParcelLockerSerializer,
    FeedbackSerializer, SurveySerializer, SurveyOptionSerializer, SurveyResponseSerializer,
    VisitorVehicleRegistrationSerializer
)
from django.db import transaction
import hashlib
import hmac
import json
import random
import requests
from datetime import datetime
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render, redirect
from .vnpay import vnpay

logger = logging.getLogger(__name__)

User = get_user_model()

class UserViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering_fields = ['email', 'date_joined']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAdminRole()]
        elif self.action in ['update', 'partial_update', 'retrieve']:
            return [IsAdminOrSelf()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='unregistered-users')
    def unregistered_users(self, request):
        # Lấy danh sách user chưa liên kết với resident
        unregistered_users = User.objects.filter(
            resident_profile__isnull=True,
            active=True,
            is_superuser=False
        )
        serializer = self.get_serializer(unregistered_users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='admins')
    def get_admins(self, request):
        #  để lấy thông tin Admin trong chat user
        admins = User.objects.filter(role='ADMIN', active=True)

        if not admins.exists():
            return Response({"detail": "Không tìm thấy Admin nào."}, status=404)

        first_admin = admins.first()
        return Response({
            "admin_id": first_admin.id,
            "admin_name": f"{first_admin.first_name} {first_admin.last_name}",
            "admin_email": first_admin.email,
            "avatar_url": first_admin.profile_picture.url if first_admin.profile_picture else None
        })

    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated],
            parser_classes=[MultiPartParser, FormParser])
    def get_current_user(self, request):
        u = request.user

        if request.method == 'PATCH':
            for k, v in request.data.items():
                if k in ['first_name', 'last_name']:
                    setattr(u, k, v)
                elif k == 'password':
                    u.set_password(v)
                elif k == 'must_change_password':
                    u.must_change_password = v.lower() == 'true' if isinstance(v, str) else bool(v)

            if 'profile_picture' in request.FILES:
                u.profile_picture = request.FILES['profile_picture']

            u.save()

        serializer = UserSerializer(u)
        return Response(serializer.data)

class ResidentViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.UpdateAPIView):
    queryset = Resident.objects.filter(active=True)
    serializer_class = ResidentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['active']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'id_number']

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAdminRole()]
        elif self.action in ['update', 'partial_update', 'retrieve']:
            return [IsAdminOrSelf()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='count-resident')
    def count_resident(self, request):
        count = Resident.objects.filter(active=True).count()
        return Response({'count': count}, status=status.HTTP_200_OK)

    @action(methods=['get', 'patch'], url_path='current-resident', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def get_current_resident(self, request):
        # Lấy thông tin cư dân liên kết với người dùng hiện tại
        resident = Resident.objects.filter(user=request.user).first()
        if not resident:
            return Response(
                {"detail": "Không tìm thấy thông tin cư dân cho người dùng này."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Xử lý PATCH nếu cần
        if request.method == 'PATCH':
            serializer = self.get_serializer(resident, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        # Trả về thông tin cư dân
        serializer = self.get_serializer(resident)
        return Response(serializer.data)

# Apartment ViewSet
class ApartmentViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = Apartment.objects.filter(active=True)
    serializer_class = ApartmentSerializer
    pagination_class = Pagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['building', 'floor', 'active']
    search_fields = ['code', 'building', 'number', 'owner__email']
    ordering_fields = ['building', 'floor', 'number']

    def get_permissions(self):
        # Cấp quyền cho admin với quyền xem, tạo, cập nhật và chuyển nhượng căn hộ
        if self.action in ['create', 'destroy', 'update', 'partial_update', 'transfer_apartment']:
            return [IsAdminUser()]
        elif self.action in ['list', 'retrieve']:
            return [IsAdminOrManagement()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        query = self.queryset.filter()

        building = self.request.query_params.get('building')
        if building:
            query = query.filter(building__icontains=building)

        floor = self.request.query_params.get('floor')
        if floor:
            query = query.filter(floor=floor)

        return query

    @action(detail=False, methods=['get'], url_path='total-apartments')
    def total_apartments(self, request):
        total_apartments = Apartment.objects.filter(active=True).count()
        return Response({"count": total_apartments}, status=status.HTTP_200_OK)

    @action(methods=['get'], detail=False, url_path='resident-without-apartment')
    def get_resident_without_apartment(self, request):
        # Lọc cư dân chưa sở hữu căn hộ
        residents = Resident.objects.filter(owned_apartments__isnull=True, active=True)

        # Serialize dữ liệu từ user liên kết
        data = [
            {
                "id": resident.id,
                "first_name": resident.user.first_name,
                "last_name": resident.user.last_name,
                "email": resident.user.email,
            }
            for resident in residents
        ]

        # Trả về danh sách cư dân
        return Response(data, status=status.HTTP_200_OK)


    @action(methods=['get'], detail=False, url_path='get-apartment')
    def get_apartments(self, request):
        try:
            resident = Resident.objects.get(user=request.user)
        except Resident.DoesNotExist:
            return Response({"detail": "Không tìm thấy thông tin cư dân."}, status=404)

        apartments = Apartment.objects.filter(owner=resident, active=True)
        page = self.paginate_queryset(apartments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(apartments, many=True)
        return Response(serializer.data)

    @action(methods=['post'], detail=True, url_path='transfer')
    def transfer_apartment(self, request, pk=None):
        apartment = self.get_object()

        # Lấy ID người nhận căn hộ mới và ghi chú chuyển nhượng từ request
        new_owner_id = request.data.get("new_owner_id")
        note = request.data.get("note", "")

        if not new_owner_id:
            return Response(
                {"detail": "Vui lòng cung cấp ID người nhận (new_owner_id)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Kiểm tra xem người nhận có tồn tại trong hệ thống không (Resident)
        try:
            new_owner = Resident.objects.get(id=new_owner_id)
        except Resident.DoesNotExist:
            return Response({"detail": "Người nhận không tồn tại."},
                            status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra xem người nhận có phải là chủ sở hữu hiện tại căn hộ này không
        if new_owner == apartment.owner:
            return Response({"detail": "Người nhận đã là chủ sở hữu căn hộ này."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Tạo lịch sử chuyển nhượng căn hộ
        ApartmentTransferHistory.objects.create(
            apartment=apartment,
            previous_owner=apartment.owner,
            new_owner=new_owner,
            transfer_date=timezone.now().date(),
            note=note
        )

        # Cập nhật chủ sở hữu mới cho căn hộ
        apartment.owner = new_owner
        apartment.save()

        # Trả về thông tin cư dân mới sau khi chuyển nhượng
        return Response({
            "detail": "Chuyển nhượng căn hộ thành công.",
            "new_owner": {
                "id": new_owner.id,
                "first_name": new_owner.user.first_name,
                "last_name": new_owner.user.last_name,
                "email": new_owner.user.email,
            }
        }, status=status.HTTP_200_OK)


# Apartment Transfer History ViewSet
class ApartmentTransferHistoryViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = ApartmentTransferHistory.objects.filter(active=True)
    serializer_class = ApartmentTransferHistorySerializer
    pagination_class = Pagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]  # Thêm SearchFilter vào đây!
    search_fields = ['apartment__code', 'previous_owner__email', 'new_owner__email']
    filterset_fields = ['apartment', 'previous_owner', 'new_owner', 'active']
    ordering_fields = ['transfer_date', 'created_date']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        apartment = self.request.query_params.get('apartment')
        if apartment:
            queryset = queryset.filter(apartment=apartment)
        return queryset

    @action(methods=['post'], detail=True, url_path='add-transfer-history')
    def add_transfer_history(self, request, pk=None):
        # Tạo lịch sử chuyển nhượng cho một căn hộ. Chỉ quản trị viên mới có thể thực hiện.

        apartment = Apartment.objects.get(id=pk)
        new_owner_id = request.data.get('new_owner_id')

        if not new_owner_id:
            return Response({"detail": "Vui lòng cung cấp ID người nhận."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra người nhận có tồn tại (Resident)
        try:
            new_owner = Resident.objects.get(id=new_owner_id)
        except Resident.DoesNotExist:
            return Response({"detail": "Người nhận không tồn tại."},
                            status=status.HTTP_404_NOT_FOUND)

        # Tạo lịch sử chuyển nhượng
        transfer_history = ApartmentTransferHistory.objects.create(
            apartment=apartment,
            previous_owner=apartment.owner,
            new_owner=new_owner,
            transfer_date=now().date(),
            note=request.data.get('note', '')
        )

        # Cập nhật chủ sở hữu mới cho căn hộ
        apartment.owner = new_owner
        apartment.save()

        return Response(ApartmentTransferHistorySerializer(transfer_history).data, status=status.HTTP_201_CREATED)

# Payment Category ViewSet
class PaymentCategoryViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.UpdateAPIView):
    queryset = PaymentCategory.objects.filter()
    serializer_class = PaymentCategorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_recurring', 'active']
    search_fields = ['amount', 'description']

    @action(methods=['get'], detail=False, url_path='all-residents')
    def get_all_residents(self, request):
        residents = Resident.objects.filter(active=True)
        data = [
            {
                "id": resident.id,
                "first_name": resident.user.first_name,
                "last_name": resident.user.last_name,
                "email": resident.user.email,
            }
            for resident in residents
        ]
        return Response(data, status=status.HTTP_200_OK)

    @action(methods=['get'], detail=False, url_path='resident-active-categories')
    def resident_active_categories(self, request):
        categories = PaymentCategory.objects.filter(active=True)
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return self.queryset

class PaymentTransactionViewSet(viewsets.GenericViewSet, generics.ListAPIView):
    queryset = PaymentTransaction.objects.filter(active=True)
    serializer_class = PaymentTransactionSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['apartment', 'category', 'method', 'status', 'active']
    ordering_fields = ['paid_date', 'created_date', 'amount']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'mark_completed']:
            return [IsAdminUser()]
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrManagement()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = self.queryset
        if not self.request.user.is_staff:
            try:
                resident = Resident.objects.get(user=self.request.user)
                queryset = queryset.filter(apartment__owner=resident)
            except Resident.DoesNotExist:
                queryset = queryset.none()

        if status := self.request.query_params.get('status'):
            queryset = queryset.filter(status=status)
        return queryset

    @action(methods=['post'], detail=True, url_path='create-vnpay-payment')
    def create_vnpay_payment(self, request, pk=None):
        try:
            # Lấy thông tin cư dân và loại phí
            resident = Resident.objects.get(user=request.user)
            category = get_object_or_404(PaymentCategory, pk=pk)
            apartment = Apartment.objects.filter(owner=resident).first()
            if apartment is None:
                return Response({"detail": "Cư dân chưa được gán căn hộ."}, status=status.HTTP_400_BAD_REQUEST)

            # Tạo transaction
            transaction = PaymentTransaction.objects.create(
                apartment=apartment,
                category=category,
                amount=category.total_amount,
                method='VNPAY',
                status='PENDING'
            )

            vnp = vnpay()
            vnp.requestData['vnp_Version'] = '2.1.0'
            vnp.requestData['vnp_Command'] = 'pay'
            vnp.requestData['vnp_TmnCode'] = settings.VNPAY_TMN_CODE
            vnp.requestData['vnp_Amount'] = int(category.total_amount * 100)
            vnp.requestData['vnp_CurrCode'] = 'VND'
            vnp.requestData['vnp_TxnRef'] = str(transaction.id)
            vnp.requestData['vnp_OrderInfo'] = f"Thanh toan phi {category.name}"
            vnp.requestData['vnp_OrderType'] = 'apartment_Fee'
            vnp.requestData['vnp_Locale'] = 'vn'
            vnp.requestData['vnp_CreateDate'] = datetime.now().strftime('%Y%m%d%H%M%S')
            vnp.requestData['vnp_IpAddr'] = get_client_ip(request)
            vnp.requestData['vnp_ReturnUrl'] = settings.VNPAY_RETURN_URL

            vnpay_payment_url = vnp.get_payment_url(settings.VNPAY_PAYMENT_URL, settings.VNPAY_HASH_SECRET_KEY)

            return Response({
                "payment_url": vnpay_payment_url,
                "amount": category.total_amount,
                "transaction_id": transaction.id,
                "message": "Vui lòng thanh toán qua VNPay."
            }, status=status.HTTP_200_OK)
        except Resident.DoesNotExist:
            return Response({"detail": "Tài khoản không phải cư dân."}, status=status.HTTP_400_BAD_REQUEST)
        except PaymentCategory.DoesNotExist:
            return Response({"detail": "Không tìm thấy loại phí"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(methods=['get'], detail=False, url_path='transaction/(?P<transaction_id>[^/.]+)')
    def get_transaction(self, request, transaction_id=None):
        try:
            resident = Resident.objects.get(user=request.user)
            transaction = PaymentTransaction.objects.get(
                transaction_id=transaction_id, apartment__owner=resident)
            serializer = self.get_serializer(transaction)
            logger.info(f"Retrieved transaction {transaction_id} for user {request.user.username}")
            return Response(serializer.data)
        except Resident.DoesNotExist:
            return Response({"detail": "Tài khoản không phải cư dân."}, status=status.HTTP_400_BAD_REQUEST)
        except PaymentTransaction.DoesNotExist:
            logger.error(f"Transaction {transaction_id} not found for user {request.user.username}")
            return Response({"detail": "Không tìm thấy giao dịch"}, status=status.HTTP_404_NOT_FOUND)

    @action(methods=['post'], detail=False, url_path='update-status')
    def update_status(self, request):
        transaction_id = request.data.get('transaction_id')
        result_code = request.data.get('result_code')
        try:
            resident = Resident.objects.get(user=request.user)
            transaction = PaymentTransaction.objects.get(
                transaction_id=transaction_id, apartment__owner=resident)
            transaction.status = 'COMPLETED' if result_code == '0' else 'FAILED'
            if transaction.status == 'COMPLETED':
                transaction.paid_date = timezone.now()
            transaction.save()
            logger.info(f"Transaction {transaction_id} updated to {transaction.status}")
            return Response({"message": "Cập nhật trạng thái thành công"}, status=status.HTTP_200_OK)
        except Resident.DoesNotExist:
            return Response({"detail": "Tài khoản không phải cư dân."}, status=status.HTTP_400_BAD_REQUEST)
        except PaymentTransaction.DoesNotExist:
            logger.error(f"Transaction {transaction_id} not found for user {request.user.username}")
            return Response({"detail": "Không tìm thấy giao dịch"}, status=status.HTTP_404_NOT_FOUND)

    @action(methods=['patch'], detail=True, url_path='update-payment', permission_classes=[IsAdminUser])
    def update_payment(self, request, pk=None):
        transaction = self.get_object()
        new_status = request.data.get("status")
        if new_status not in ["PENDING", "COMPLETED", "FAILED", "REFUNDED"]:
            return Response(
                {"detail": "Trạng thái không hợp lệ."},
                status=status.HTTP_400_BAD_REQUEST
            )
        transaction.status = new_status
        transaction.save()
        return Response(
            {"detail": f"Trạng thái đã được cập nhật thành {new_status}."},
            status=status.HTTP_200_OK
        )

    @action(methods=['get'], detail=False, url_path='my-payments')
    def my_payments(self, request):
        try:
            resident = Resident.objects.get(user=request.user)
        except Resident.DoesNotExist:
            return Response({"detail": "Tài khoản không phải cư dân."}, status=status.HTTP_400_BAD_REQUEST)

        payments = PaymentTransaction.objects.filter(apartment__owner=resident)
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)

class VNPayViewSet(viewsets.ViewSet):
    @transaction.atomic
    @action(detail=False, methods=['get'], url_path='vnpay-return')
    def vnpay_return(self, request):
        inputData = request.GET
        if not inputData:
            return render(request, "payment_return.html", {"title": "Kết quả thanh toán", "result": ""})

        vnp = vnpay()
        vnp.responseData = inputData.dict()
        order_id = inputData.get('vnp_TxnRef')
        amount = int(inputData.get('vnp_Amount', 0)) / 100
        order_desc = inputData.get('vnp_OrderInfo', '')
        vnp_TransactionNo = inputData.get('vnp_TransactionNo', '')
        vnp_ResponseCode = inputData.get('vnp_ResponseCode', '')
        vnp_TmnCode = inputData.get('vnp_TmnCode', '')
        vnp_PayDate = inputData.get('vnp_PayDate', '')
        vnp_BankCode = inputData.get('vnp_BankCode', '')
        vnp_CardType = inputData.get('vnp_CardType', '')

        # Đổi 'pending' thành 'PENDING' cho đúng với DB
        STATUS_PENDING = 'PENDING'

        # Kiểm tra checksum
        if not vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
            try:
                payment_log = PaymentTransaction.objects.get(id=order_id, status=STATUS_PENDING)
                payment_log.status = 'FAILED'
                payment_log.transaction_id = vnp_TransactionNo
                payment_log.save()
            except PaymentTransaction.DoesNotExist:
                pass
            return render(request, "payment_return.html", {
                "title": "Kết quả thanh toán",
                "result": "Lỗi",
                "order_id": order_id,
                "amount": amount,
                "order_desc": order_desc,
                "vnp_TransactionNo": vnp_TransactionNo,
                "vnp_ResponseCode": vnp_ResponseCode,
                "msg": "Sai checksum",
            })

        if vnp_ResponseCode != "00":
            try:
                payment_log = PaymentTransaction.objects.get(id=order_id, status=STATUS_PENDING)
                payment_log.status = 'FAILED'
                payment_log.transaction_id = vnp_TransactionNo
                payment_log.save()
            except PaymentTransaction.DoesNotExist:
                pass
            return render(request, "payment_return.html", {
                "title": "Kết quả thanh toán",
                "result": "Lỗi",
                "order_id": order_id,
                "amount": amount,
                "order_desc": order_desc,
                "vnp_TransactionNo": vnp_TransactionNo,
                "vnp_ResponseCode": vnp_ResponseCode
            })

        try:
            with transaction.atomic():
                payment_log = PaymentTransaction.objects.get(id=order_id, status=STATUS_PENDING)
                payment_log.status = 'COMPLETED'
                payment_log.transaction_id = vnp_TransactionNo
                payment_log.save()
        except PaymentTransaction.DoesNotExist:
            print(f"[VNPay] Không tìm thấy đơn hàng id={order_id}, status={STATUS_PENDING}")
            all_logs = PaymentTransaction.objects.filter(id=order_id)
            print(f"[VNPay] Các bản ghi có id={order_id}: {[ (x.id, x.status) for x in all_logs ]}")
            return render(request, "payment_return.html", {
                "title": "Kết quả thanh toán",
                "result": "Đơn hàng không tồn tại hoặc đã được xử lý",
                "order_id": order_id,
                "amount": amount,
                "order_desc": order_desc,
                "vnp_TransactionNo": vnp_TransactionNo,
                "vnp_ResponseCode": vnp_ResponseCode,
            })
        except Exception as e:
            return render(request, "payment_return.html", {
                "title": "Kết quả thanh toán",
                "result": "Lỗi khi cập nhật trạng thái giao dịch",
                "order_id": order_id,
                "amount": amount,
                "order_desc": order_desc,
                "vnp_TransactionNo": vnp_TransactionNo,
                "vnp_ResponseCode": vnp_ResponseCode,
                "msg": str(e)
            })
        return render(request, "payment_return.html", {
            "title": "Kết quả thanh toán",
            "result": "Thành công",
            "order_id": order_id,
            "amount": amount,
            "order_desc": order_desc,
            "vnp_TransactionNo": vnp_TransactionNo,
            "vnp_ResponseCode": vnp_ResponseCode,
        })

class ParcelLockerViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.DestroyAPIView):
    queryset = ParcelLocker.objects.filter(active=True)
    serializer_class = ParcelLockerSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['resident', 'active']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminRole()]
        if self.action in ['add-item', 'update-item-status', 'list', 'retrieve']:
            return [IsAdminOrManagement()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = ParcelLocker.objects.all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(resident__user=self.request.user)
        return queryset

    def get_serializer(self, *args, **kwargs):
        return self.serializer_class(*args, **kwargs)

    def get_object(self):
        try:
            # Lấy đối tượng từ queryset bằng cách sử dụng pk từ URL
            return self.queryset.get(pk=self.kwargs["pk"])
        except ParcelLocker.DoesNotExist:
            raise NotFound("Không tìm thấy tủ đồ với ID này.")

    @action(methods=['get'], detail=False, url_path='resident-without-locker')
    def get_resident_without_locker(self, request):
        # Lấy danh sách id các Resident đã có tủ đồ
        residents_with_lockers = ParcelLocker.objects.values_list('resident_id', flat=True)

        # Lọc Resident chưa có tủ đồ
        residents = Resident.objects.filter(
            user__role=User.Role.RESIDENT,
            user__active=True
        ).exclude(id__in=residents_with_lockers)

        # Trả về Resident.id và thông tin từ user
        data = [
            {
                "id": resident.id,
                "email": resident.user.email,
            }
            for resident in residents
        ]

        return Response(data, status=status.HTTP_200_OK)

    @action(methods=['get'], detail=True, url_path='items')
    def get_items(self, request, pk=None):
        # Trả về danh sách đồ trong tủ
        locker = self.get_object()
        # Quan hệ related_name='items' từ model
        items = locker.items.all()
        serializer = ParcelItemSerializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['post'], detail=True, url_path='add-item')
    def add_item(self, request, pk=None):
        locker = self.get_object()
        item_name = request.data.get('item_name')
        note = request.data.get('note', '')
        if not item_name:
            return Response({"detail": "Tên món đồ là bắt buộc."}, status=status.HTTP_400_BAD_REQUEST)

        item = locker.items.create(name=item_name, note=note)
        serializer = ParcelItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['patch'], detail=True, url_path='update-item-status')
    def update_item_status(self, request, pk=None):
        #Cập nhật trạng thái của món đồ trong tủ đồ.
        #Chỉ cho phép admin cập nhật trạng thái từ PENDING sang trạng thái khác.
        if not request.user.is_staff:
            return Response(
                {"detail": "Bạn không có quyền thực hiện hành động này."},
                status=status.HTTP_403_FORBIDDEN
            )

        item_id = request.data.get('item_id')
        new_status = request.data.get('status')

        print("Request method:", request.method)
        print("Request content-type:", request.content_type)
        print("Request body:", request.body)
        print("Parsed data:", request.data)

        if new_status not in ['PENDING', 'RECEIVED']:
            return Response(
                {"detail": "Trạng thái không hợp lệ."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            locker = self.get_object()  # Lấy tủ đồ hiện tại
            item = locker.items.get(id=item_id)  # Tìm món đồ trong tủ đồ

            # Cập nhật trạng thái món đồ
            item.status = new_status
            item.save()

            # Trả về dữ liệu đã cập nhật
            serializer = ParcelItemSerializer(item)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except ParcelItem.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy món đồ này."},
                status=status.HTTP_404_NOT_FOUND
            )
        except ParcelLocker.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy tủ đồ này."},
                status=status.HTTP_404_NOT_FOUND
            )


# Feedback ViewSet
class FeedbackViewSet(viewsets.ViewSet, generics.ListAPIView, generics.DestroyAPIView):
    queryset = Feedback.objects.filter(active=True)
    serializer_class = FeedbackSerializer
    pagination_class = Pagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['resident', 'status', 'active']
    search_fields = ['title', 'content']
    ordering_fields = ['created_date', 'updated_date']

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]  # Cư dân gửi phản ánh
        elif self.action in ['update', 'partial_update', 'list', 'update-status', 'destroy']:
            return [IsAdminOrManagement()]  # Admin + Management được sửa, xem tất cả
        return [permissions.IsAuthenticated()]  # Mặc định các quyền khác

    def get_queryset(self):
        #Nếu người dùng không phải admin, chỉ hiển thị các phản hồi của họ
        query = self.queryset
        if not self.request.user.is_staff:
            query = query.filter(resident__user=self.request.user)
        return query

    def create(self, request, *args, **kwargs):
        #Tạo phản hồi mới
        try:
            resident = Resident.objects.get(user=request.user)
        except Resident.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy thông tin cư dân cho người dùng này."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(resident=resident)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['patch'], detail=True, url_path='update-status')
    def update_status(self, request, pk=None):
        try:
            feedback = Feedback.objects.get(pk=pk, active=True)
        except Feedback.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy phản hồi."},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {"detail": "Thiếu dữ liệu 'status'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        feedback.status = new_status
        feedback.save()

        return Response(
            {"detail": "Cập nhật trạng thái thành công.", "status": feedback.status},
            status=status.HTTP_200_OK
        )

    @action(methods=['get'], detail=False, url_path='my-feedbacks')
    def my_feedbacks(self, request):
        #Trả về danh sách phản hồi của người dùng hiện tại
        feedbacks = Feedback.objects.filter(resident__user=request.user)
        serializer = self.get_serializer(feedbacks, many=True)
        return Response(serializer.data)

    @action(methods=['patch'], detail=True, url_path='update-my-feedback')
    def update_my_feedback(self, request, pk=None):
        #Cho phép cư dân cập nhật nội dung phản hồi của chính họ.
        try:
            feedback = self.get_queryset().get(pk=pk)
        except Feedback.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy phản hồi."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Kiểm tra quyền: phải là cư dân sở hữu phản hồi
        if not request.user.is_staff and feedback.resident.user != request.user:
            return Response(
                {"detail": "Bạn không có quyền chỉnh sửa phản hồi này."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(feedback, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

# Survey ViewSet: Phiếu khảo sát: hiển thị phiếu khảo sát và tạo khảo sát
class SurveyViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Survey.objects.filter()
    serializer_class = SurveySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['active']
    search_fields = ['title', 'description', 'deadline']
    ordering_fields = ['deadline', 'created_date']

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update', 'post']:
            return [IsAdminOrManagement()]
        elif self.action == 'list':
            return [permissions.IsAuthenticated()]
        elif self.action in ['get-responses']:
            return [IsAdminOrManagement()]
        return [permissions.IsAuthenticated()]

    def get_object(self):
        try:
            return Survey.objects.get(pk=self.kwargs["pk"])
        except Survey.DoesNotExist:
            raise NotFound("Không tìm thấy phiếu khảo sát.")

    def create(self, request, *args, **kwargs):
        #Tạo khảo sát với các tùy chọn
        options_data = request.data.pop('options', [])
        serializer = self.get_serializer(data=request.data, context={'options': options_data})
        serializer.is_valid(raise_exception=True)
        survey = serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    #Phần trăm tỷ lệ phản hồi các khảo sát của cư dân
    @action(detail=True, methods=['get'], url_path='response-rate')
    def response_rate(self, request, pk=None):
        survey = self.get_object()

        total_responses = SurveyResponse.objects.filter(survey=survey).count()

        total_invited = Resident.objects.count()

        response_rate = (total_responses / total_invited) * 100 if total_invited else 0

        return Response({'response_rate': response_rate})

    @action(methods=['get'], detail=True, url_path='get-options')
    def get_options(self, request, pk):
        survey = self.get_object()
        options = survey.options.filter(active=True)
        return Response(SurveyOptionSerializer(options, many=True).data)

    @action(methods=['get'], detail=True, url_path='get-responses')
    def get_responses(self, request, pk):
        if not request.user.is_staff:
            return Response(
                {"detail": "Bạn không có quyền thực hiện hành động này."},
                status=status.HTTP_403_FORBIDDEN
            )

        survey = self.get_object()
        responses = SurveyResponse.objects.filter(survey=survey)
        return Response(SurveyResponseSerializer(responses, many=True).data)

    @action(methods=['patch'], detail=True, url_path='set-active')
    def set_active(self, request, pk=None):
        survey = self.get_object()
        active = request.data.get("active")
        if active is None:
            return Response({"error": "Thiếu trường active."}, status=status.HTTP_400_BAD_REQUEST)
        survey.active = bool(active)
        survey.save()
        return Response({"id": survey.id, "active": survey.active})


# Survey Option ViewSet: Hiển thị các lựa chọn và tạo các lựa chọn trong khảo sát
class SurveyOptionViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.RetrieveAPIView):
    queryset = SurveyOption.objects.filter()
    serializer_class = SurveyOptionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['survey', 'active']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAdminOrManagement()]
        if self.action in ['destroy']:
            return [IsAdminRole]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        survey_id = request.data.get('id') or request.data.get('surveyId')
        option_text = request.data.get('option_text')

        if not survey_id or not option_text:
            return Response({"error": "Thiếu thông tin bắt buộc."}, status=400)

        survey = get_object_or_404(Survey, id=survey_id)
        option = SurveyOption.objects.create(survey=survey, option_text=option_text)
        print("Dữ liệu nhận được:", request.data)
        print("Token nhận được:", request.headers.get('Authorization'))
        return Response(SurveyOptionSerializer(option).data, status=201)


# Survey Response ViewSet: Phản hồi của cư dân khi tham gia khảo sát
class SurveyResponseViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = SurveyResponse.objects.filter(active=True)
    serializer_class = SurveyResponseSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['survey', 'option', 'resident', 'active']

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        elif self.action in ['destroy']:
            return [IsAdminRole]
        elif self.action in ['update', 'partial_update', 'list', 'retrieve']:
            return [IsAdminOrManagement()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        #Nếu người dùng không phải admin, chỉ hiển thị các phản hồi khảo sát của họ
        query = self.queryset
        if not self.request.user.is_staff:
            query = query.filter(resident__user=self.request.user)
        return query

    def create(self, request, *args, **kwargs):
        #Tạo phản hồi khảo sát mới
        try:
            resident = Resident.objects.get(user=request.user)
        except Resident.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy thông tin cư dân cho người dùng này."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Kiểm tra xem người dùng đã phản hồi khảo sát này chưa
        survey_id = request.data.get('survey')
        existing_response = SurveyResponse.objects.filter(survey_id=survey_id, resident=resident).first()
        if existing_response:
            return Response(
                {"detail": "Bạn đã phản hồi khảo sát này rồi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(resident=resident)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['get'], detail=False, url_path='my-responses')
    def my_responses(self, request):
        #Trả về danh sách phản hồi khảo sát của người dùng hiện tại
        responses = SurveyResponse.objects.filter(resident__user=request.user)
        serializer = self.get_serializer(responses, many=True)
        return Response(serializer.data)


# Visitor Vehicle Registration ViewSet
class VisitorVehicleRegistrationViewSet(viewsets.ViewSet, generics.ListAPIView, generics.DestroyAPIView):
    queryset = VisitorVehicleRegistration.objects.filter(active=True)
    serializer_class = VisitorVehicleRegistrationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['resident', 'approved', 'active']
    search_fields = ['visitor_name', 'vehicle_number']
    ordering_fields = ['registration_date', 'created_date']

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve', 'my_registrations']:
            # Cư dân và quản lý đều có quyền tạo và xem
            return [permissions.IsAuthenticated()]
        elif self.action in ['approve', 'reject', 'update', 'partial_update', 'destroy']:
            # Chỉ admin hoặc management mới có quyền duyệt, từ chối hoặc chỉnh sửa
            return [IsAdminOrManagement()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        #Nếu người dùng không phải admin, chỉ hiển thị các đăng ký xe của họ
        query = self.queryset
        if not self.request.user.is_staff:
            query = query.filter(resident__user=self.request.user)
        return query

    def create(self, request, *args, **kwargs):
        #Tạo đăng ký xe mới
        try:
            resident = Resident.objects.get(user=request.user)
        except Resident.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy thông tin cư dân cho người dùng này."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(resident=resident)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['patch'], detail=True, url_path='set-approval')
    def set_approval(self, request, pk):
        registration = self.get_object()

        # Kiểm tra quyền
        if not request.user.is_staff and getattr(request.user, 'role', '') != 'MANAGEMENT':
            return Response(
                {"detail": "Bạn không có quyền thực hiện hành động này."},
                status=status.HTTP_403_FORBIDDEN
            )

        approved = request.data.get("approved", None)
        if approved is None:
            return Response(
                {"detail": "Thiếu trường approved."},
                status=status.HTTP_400_BAD_REQUEST
            )

        registration.approved = approved
        registration.save()
        serializer = self.get_serializer(registration)
        return Response(serializer.data)

    @action(methods=['get'], detail=False, url_path='my-registrations')
    def my_registrations(self, request):
        #Trả về danh sách đăng ký xe của người dùng hiện tại
        registrations = VisitorVehicleRegistration.objects.filter(resident__user=request.user)
        serializer = self.get_serializer(registrations, many=True)
        return Response(serializer.data)

class AmenityViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.DestroyAPIView, generics.UpdateAPIView):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer

    def get_permissions(self):
        admin_actions = ['create', 'update', 'partial_update', 'destroy']
        if self.action in admin_actions:
            return [permissions.IsAdminUser()]
        # Các action xem/list, cư dân và admin đều được phép
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]


class AmenityBookingListViewSet(viewsets.ViewSet, generics.RetrieveUpdateAPIView, generics.ListCreateAPIView):
    queryset = AmenityBooking.objects.select_related('amenity', 'resident', 'resident__user').all() 
    serializer_class = AmenityBookingSerializer

    def get_permissions(self):
        admin_actions = ['set-status']
        if hasattr(self, 'action') and self.action in admin_actions:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def retrieve(self, request, pk=None):
        bookings = AmenityBooking.objects.filter(amenity_id=pk)
        serializer = self.serializer_class(bookings, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        queryset = super().get_queryset()
        resident_id = self.request.query_params.get('resident')
        if resident_id:
            queryset = queryset.filter(resident_id=resident_id)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()

        # Tạo hoặc lấy PaymentCategory cho tiện ích này
        amenity = booking.amenity
        resident = booking.resident

        category, _ = PaymentCategory.objects.get_or_create(
            name=f"Phí tiện ích {amenity.name}",
            resident=resident,
            defaults={
                "amount": getattr(amenity, "fee", 0),
                "is_recurring": False,
                "frequency": "ONE_TIME",
                "category_type": "UTILITY",
            }
        )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(methods=['patch'], detail=True, url_path='set-status')
    def set_status(self, request, pk=None):
        booking = self.get_object()

        # Kiểm tra quyền
        if not request.user.is_staff and getattr(request.user, 'role', '') != 'MANAGEMENT':
            return Response(
                {"detail": "Bạn không có quyền thực hiện hành động này."},
                status=status.HTTP_403_FORBIDDEN
            )

        status_value = request.data.get("status", None)
        if status_value is None:
            return Response(
                {"detail": "Thiếu trường status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = status_value
        booking.save()

        serializer = self.get_serializer(booking)
        return Response(serializer.data, status=status.HTTP_200_OK)


def index(request):
    return render(request, "index.html", {"title": "Danh sách demo"})


def hmacsha512(key, data):
    byteKey = key.encode('utf-8')
    byteData = data.encode('utf-8')
    return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()


def payment(request):
    if request.method == 'POST':
        # Process input data and build url payment
        form = PaymentForm(request.POST)
        if form.is_valid():
            order_type = form.cleaned_data['order_type']
            order_id = form.cleaned_data['order_id']
            amount = form.cleaned_data['amount']
            order_desc = form.cleaned_data['order_desc']
            bank_code = form.cleaned_data['bank_code']
            language = form.cleaned_data['language']
            ipaddr = get_client_ip(request)
            # Build URL Payment
            vnp = vnpay()
            vnp.requestData['vnp_Version'] = '2.1.0'
            vnp.requestData['vnp_Command'] = 'pay'
            vnp.requestData['vnp_TmnCode'] = settings.VNPAY_TMN_CODE
            vnp.requestData['vnp_Amount'] = amount * 100
            vnp.requestData['vnp_CurrCode'] = 'VND'
            vnp.requestData['vnp_TxnRef'] = order_id
            vnp.requestData['vnp_OrderInfo'] = order_desc
            vnp.requestData['vnp_OrderType'] = order_type
            # Check language, default: vn
            if language and language != '':
                vnp.requestData['vnp_Locale'] = language
            else:
                vnp.requestData['vnp_Locale'] = 'vn'
            # Check bank_code, if bank_code is empty, customer will be selected bank on VNPAY
            # if bank_code:
            #     vnp.requestData['vnp_BankCode'] = bank_code

            if bank_code and bank_code != "":
                vnp.requestData['vnp_BankCode'] = bank_code

            vnp.requestData['vnp_CreateDate'] = datetime.now().strftime('%Y%m%d%H%M%S')
            vnp.requestData['vnp_IpAddr'] = ipaddr
            vnp.requestData['vnp_ReturnUrl'] = settings.VNPAY_RETURN_URL
            vnpay_payment_url = vnp.get_payment_url(settings.VNPAY_PAYMENT_URL, settings.VNPAY_HASH_SECRET_KEY)
            print(vnpay_payment_url)
            # Redirect to VNPAY
            return redirect(vnpay_payment_url)
        else:
            print("Form input not validate")
    return render(request, "payment.html", {"title": "Thanh toán"})


def payment_ipn(request):
    inputData = request.GET
    if inputData:
        vnp = vnpay()
        vnp.responseData = inputData.dict()
        order_id = inputData['vnp_TxnRef']
        amount = inputData['vnp_Amount']
        order_desc = inputData['vnp_OrderInfo']
        vnp_TransactionNo = inputData['vnp_TransactionNo']
        vnp_ResponseCode = inputData['vnp_ResponseCode']
        vnp_TmnCode = inputData['vnp_TmnCode']
        vnp_PayDate = inputData['vnp_PayDate']
        vnp_BankCode = inputData['vnp_BankCode']
        vnp_CardType = inputData['vnp_CardType']
        if vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
            # Check & Update Order Status in your Database
            # Your code here
            firstTimeUpdate = True
            totalamount = True
            if totalamount:
                if firstTimeUpdate:
                    if vnp_ResponseCode == '00':
                        print('Payment Success. Your code implement here')
                    else:
                        print('Payment Error. Your code implement here')

                    # Return VNPAY: Merchant update success
                    result = JsonResponse({'RspCode': '00', 'Message': 'Confirm Success'})
                else:
                    # Already Update
                    result = JsonResponse({'RspCode': '02', 'Message': 'Order Already Update'})
            else:
                # invalid amount
                result = JsonResponse({'RspCode': '04', 'Message': 'invalid amount'})
        else:
            # Invalid Signature
            result = JsonResponse({'RspCode': '97', 'Message': 'Invalid Signature'})
    else:
        result = JsonResponse({'RspCode': '99', 'Message': 'Invalid request'})

    return result


def payment_return(request):
    inputData = request.GET
    if inputData:
        vnp = vnpay()
        vnp.responseData = inputData.dict()
        order_id = inputData.get('vnp_TxnRef', '')
        amount = int(inputData.get('vnp_Amount', 0)) / 100
        order_desc = inputData.get('vnp_OrderInfo', '')
        vnp_TransactionNo = inputData.get('vnp_TransactionNo', '')
        vnp_ResponseCode = inputData.get('vnp_ResponseCode', '')  # Có thể rỗng!
        vnp_TransactionStatus = inputData.get('vnp_TransactionStatus', '')  # Luôn có!
        vnp_TmnCode = inputData.get('vnp_TmnCode', '')
        vnp_PayDate = inputData.get('vnp_PayDate', '')
        vnp_BankCode = inputData.get('vnp_BankCode', '')
        vnp_CardType = inputData.get('vnp_CardType', '')
        print("VNPay return data:", inputData)
        if vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
            # Ưu tiên kiểm tra TransactionStatus nếu thiếu ResponseCode
            if vnp_ResponseCode == "00" or vnp_TransactionStatus == "00":
                try:
                    payment_log = PaymentTransaction.objects.get(id=order_id)
                    payment_log.status = 'COMPLETED'
                    payment_log.transaction_id = vnp_TransactionNo
                    payment_log.paid_date = timezone.now()
                    payment_log.save()
                except PaymentTransaction.DoesNotExist:
                    pass  # Có thể log lỗi nếu cần
                result = "Thành công"
            else:
                result = "Lỗi"
            return render(request, "payment_return.html", {
                "title": "Kết quả thanh toán",
                "result": result,
                "order_id": order_id,
                "amount": amount,
                "order_desc": order_desc,
                "vnp_TransactionNo": vnp_TransactionNo,
                "vnp_ResponseCode": vnp_ResponseCode or vnp_TransactionStatus
            })
        else:
            return render(request, "payment_return.html", {
                "title": "Kết quả thanh toán",
                "result": "Lỗi",
                "order_id": order_id,
                "amount": amount,
                "order_desc": order_desc,
                "vnp_TransactionNo": vnp_TransactionNo,
                "vnp_ResponseCode": vnp_ResponseCode or vnp_TransactionStatus,
                "msg": "Sai checksum"
            })
    else:
        return render(request, "payment_return.html", {"title": "Kết quả thanh toán", "result": ""})


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

n = random.randint(10**11, 10**12 - 1)
n_str = str(n)
while len(n_str) < 12:
    n_str = '0' + n_str


def query(request):
    if request.method == 'GET':
        return render(request, "query.html", {"title": "Kiểm tra kết quả giao dịch"})

    url = settings.VNPAY_API_URL
    secret_key = settings.VNPAY_HASH_SECRET_KEY
    vnp_TmnCode = settings.VNPAY_TMN_CODE
    vnp_Version = '2.1.0'

    vnp_RequestId = n_str
    vnp_Command = 'querydr'
    vnp_TxnRef = request.POST['order_id']
    vnp_OrderInfo = 'kiem tra gd'
    vnp_TransactionDate = request.POST['trans_date']
    vnp_CreateDate = datetime.now().strftime('%Y%m%d%H%M%S')
    vnp_IpAddr = get_client_ip(request)

    hash_data = "|".join([
        vnp_RequestId, vnp_Version, vnp_Command, vnp_TmnCode,
        vnp_TxnRef, vnp_TransactionDate, vnp_CreateDate,
        vnp_IpAddr, vnp_OrderInfo
    ])

    secure_hash = hmac.new(secret_key.encode(), hash_data.encode(), hashlib.sha512).hexdigest()

    data = {
        "vnp_RequestId": vnp_RequestId,
        "vnp_TmnCode": vnp_TmnCode,
        "vnp_Command": vnp_Command,
        "vnp_TxnRef": vnp_TxnRef,
        "vnp_OrderInfo": vnp_OrderInfo,
        "vnp_TransactionDate": vnp_TransactionDate,
        "vnp_CreateDate": vnp_CreateDate,
        "vnp_IpAddr": vnp_IpAddr,
        "vnp_Version": vnp_Version,
        "vnp_SecureHash": secure_hash
    }

    headers = {"Content-Type": "application/json"}

    response = requests.post(url, headers=headers, data=json.dumps(data))

    if response.status_code == 200:
        response_json = json.loads(response.text)
    else:
        response_json = {"error": f"Request failed with status code: {response.status_code}"}

    return render(request, "query.html", {"title": "Kiểm tra kết quả giao dịch", "response_json": response_json})

def refund(request):
    if request.method == 'GET':
        return render(request, "refund.html", {"title": "Hoàn tiền giao dịch"})

    url = settings.VNPAY_API_URL
    secret_key = settings.VNPAY_HASH_SECRET_KEY
    vnp_TmnCode = settings.VNPAY_TMN_CODE
    vnp_RequestId = n_str
    vnp_Version = '2.1.0'
    vnp_Command = 'refund'
    vnp_TransactionType = request.POST['TransactionType']
    vnp_TxnRef = request.POST['order_id']
    vnp_Amount = request.POST['amount']
    vnp_OrderInfo = request.POST['order_desc']
    vnp_TransactionNo = '0'
    vnp_TransactionDate = request.POST['trans_date']
    vnp_CreateDate = datetime.now().strftime('%Y%m%d%H%M%S')
    vnp_CreateBy = 'user01'
    vnp_IpAddr = get_client_ip(request)

    hash_data = "|".join([
        vnp_RequestId, vnp_Version, vnp_Command, vnp_TmnCode, vnp_TransactionType, vnp_TxnRef,
        vnp_Amount, vnp_TransactionNo, vnp_TransactionDate, vnp_CreateBy, vnp_CreateDate,
        vnp_IpAddr, vnp_OrderInfo
    ])

    secure_hash = hmac.new(secret_key.encode(), hash_data.encode(), hashlib.sha512).hexdigest()

    data = {
        "vnp_RequestId": vnp_RequestId,
        "vnp_TmnCode": vnp_TmnCode,
        "vnp_Command": vnp_Command,
        "vnp_TxnRef": vnp_TxnRef,
        "vnp_Amount": vnp_Amount,
        "vnp_OrderInfo": vnp_OrderInfo,
        "vnp_TransactionDate": vnp_TransactionDate,
        "vnp_CreateDate": vnp_CreateDate,
        "vnp_IpAddr": vnp_IpAddr,
        "vnp_TransactionType": vnp_TransactionType,
        "vnp_TransactionNo": vnp_TransactionNo,
        "vnp_CreateBy": vnp_CreateBy,
        "vnp_Version": vnp_Version,
        "vnp_SecureHash": secure_hash
    }

    headers = {"Content-Type": "application/json"}

    response = requests.post(url, headers=headers, data=json.dumps(data))

    if response.status_code == 200:
        response_json = json.loads(response.text)
    else:
        response_json = {"error": f"Request failed with status code: {response.status_code}"}

    return render(request, "refund.html", {"title": "Kết quả hoàn tiền giao dịch", "response_json": response_json})