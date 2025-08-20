from cloudinary.utils import now
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from cloudinary.models import CloudinaryField
from datetime import datetime
import calendar

# Base Model
class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_date']

# User Management
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser, BaseModel):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        MANAGEMENT = 'MANAGEMENT', 'Management'
        RESIDENT = 'RESIDENT', 'Resident'

    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.RESIDENT)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    profile_picture = CloudinaryField(null=True, blank=True)
    must_change_password = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    #Sử dụng UserManager để định nghĩa lại phương thức tạo user và superuser.
    objects = UserManager()

    def __str__(self):
        return self.email

# Resident Profile
class Resident(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='resident_profile')
    id_number = models.CharField(max_length=20, blank=True, null=True)
    relationship_status = models.CharField(max_length=50, blank=True, null=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Cư dân: {self.user.email}"

# Apartment
class Apartment(BaseModel):
    class Building(models.TextChoices):
        A = 'A', 'Tòa A'
        B = 'B', 'Tòa B'
        C = 'C', 'Tòa C'
        D = 'D', 'Tòa D'

    code = models.CharField(max_length=20, unique=True)
    building = models.CharField(max_length=1, choices=Building.choices)
    floor = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(20)])
    number = models.CharField(max_length=10)
    owner = models.ForeignKey(Resident, on_delete=models.SET_NULL, null=True, related_name='owned_apartments')

    def __str__(self):
        return f'{self.building} - Tầng {self.floor} - Căn {self.number}'

# Apartment Transfer
class ApartmentTransferHistory(BaseModel):
    apartment = models.ForeignKey(Apartment, on_delete=models.CASCADE, related_name='transfer_history')
    previous_owner = models.ForeignKey(Resident, on_delete=models.SET_NULL, null=True, related_name='previous_apartment_owners')
    new_owner = models.ForeignKey(Resident, on_delete=models.SET_NULL, null=True, related_name='new_apartment_owners')
    transfer_date = models.DateField(default=datetime.now)
    note = models.TextField(blank=True, null=True)

# Payment Category: định nghĩa, quản lý các loại phí
class PaymentCategory(BaseModel):
    class PaymentFrequency(models.TextChoices):
        ONE_TIME = "ONE_TIME", "One Time"
        MONTHLY = "MONTHLY", "Monthly"
        QUARTERLY = "QUARTERLY", "Quarterly"
        YEARLY = "YEARLY", "Yearly"

    class PaymentCategoryType(models.TextChoices):
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        UTILITY = "UTILITY", "Utility"
        SERVICE = "SERVICE", "Service"

    name = models.CharField(max_length=100)  # Tên loại thanh toán, ví dụ "Phí quản lý", "Phí gửi xe"
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # Số tiền phải thanh toán
    is_recurring = models.BooleanField(
        default=True)  # Liệu đây có phải là loại phí định kỳ không (như hàng tháng, hàng năm...)
    description = models.TextField(blank=True, null=True)  # Mô tả chi tiết về loại phí
    frequency = models.CharField(max_length=20, choices=PaymentFrequency.choices) #tần suất thanh toán
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2,
                                         default=0)  # Phần trăm thuế phải trả cho loại phí này
    grace_period = models.IntegerField(default=0)
    category_type = models.CharField(max_length=20, choices=PaymentCategoryType.choices)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    resident = models.ForeignKey('Resident', on_delete=models.CASCADE, related_name='payment_transactions', null=True,
                                 blank=True)

    def save(self, *args, **kwargs):
        self.total_amount = self.amount + (self.amount * self.tax_percentage / 100)
        super().save(*args, **kwargs)

    def __str__(self):
        formatted_amount = f"{self.total_amount:,.0f}".replace(',', '.')
        return f"{self.name} - {formatted_amount} VND"

# Payment Transaction
class PaymentTransaction(BaseModel):
    class Method(models.TextChoices):
        MOMO = 'MOMO', 'MoMo'
        VNPAY = 'VNPAY', 'VNPay'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Chờ xử lý'
        COMPLETED = 'COMPLETED', 'Hoàn tất'
        FAILED = 'FAILED', 'Thất bại'
        REFUNDED = 'REFUNDED', 'Đã hoàn lại'

    apartment = models.ForeignKey(Apartment, on_delete=models.CASCADE, related_name='payments')
    category = models.ForeignKey(PaymentCategory, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=Method.choices)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, default='PENDING')
    payment_proof = CloudinaryField(null=True, blank=True)
    paid_date = models.DateTimeField(null=True, blank=True)
    transaction_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)

    def __str__(self):
        # Định dạng số tiền
        formatted_amount = f"{self.amount:,.0f}".replace(',', '.')
        return f"Transaction {self.transaction_id} - {self.status} - {formatted_amount} VND"

    def process_payment(self):
        if self.status == 'PENDING':
            self.status = 'COMPLETED'
            self.paid_date = now()
            self.save()

# Parcel Locker
class ParcelLocker(BaseModel):
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name='locker_items')

class ParcelItem(BaseModel):
    class PareItemStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RECEIVED = "RECEIVED", "Received"

    locker = models.ForeignKey(ParcelLocker, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=30, choices=PareItemStatus.choices, default=PareItemStatus.PENDING)
    note = models.TextField(blank=True, null=True)

# Feedback
class Feedback(BaseModel):
    class FeedbackStatus(models.TextChoices):
        NEW = "NEW", "New"
        PROCESSING = "PROCESSING", "Processing"
        RESOLVED = "RESOLVED", "Resolved"

    resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name='feedbacks')
    title = models.CharField(max_length=255)
    content = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=FeedbackStatus.choices,
        default=FeedbackStatus.NEW
    )

# Survey
class Survey(BaseModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    deadline = models.DateTimeField()

class SurveyOption(BaseModel):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='options')
    option_text = models.CharField(max_length=255)

class SurveyResponse(BaseModel):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE)
    option = models.ForeignKey(SurveyOption, on_delete=models.CASCADE)
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE)

class Status(models.TextChoices):
    NEW = "NEW", "Mới"
    APPROVED = "APPROVED", "Đồng ý"
    REJECTED = "REJECTED", "Không đồng ý"

# Visitor Vehicle Registration
class VisitorVehicleRegistration(BaseModel):
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE)
    visitor_name = models.CharField(max_length=100)
    vehicle_number = models.CharField(max_length=20)
    registration_date = models.DateTimeField(null=True, blank=True)
    approved = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)

#Tiện ích
class Amenity(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255)
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    max_bookings_per_slot = models.IntegerField(default=1)
    image = CloudinaryField(null=True, blank=True)

    def __str__(self):
        return self.name

#Cư dân đăng ký tiện ích
class AmenityBooking(BaseModel):
    amenity = models.ForeignKey(Amenity, on_delete=models.CASCADE, related_name='bookings')
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name='amenity_bookings')
    booking_date = models.DateField() #ngày đặt tiện ích
    usage_date = models.DateField(null=True, blank=True) #ngày sử dụng tiện ich
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    note = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('amenity', 'resident', 'booking_date', 'start_time')

    def __str__(self):
        return (f"Cư dân: {self.resident.user.first_name} {self.resident.user.last_name} - "
                f"đăng ký {self.amenity.name} - ngày {self.booking_date}")