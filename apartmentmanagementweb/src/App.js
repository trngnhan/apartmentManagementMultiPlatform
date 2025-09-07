import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './components/Login';
import AdminHome from './components/Admin/AdminHome';
import AdminAccount from './components/Admin/AdminAccount';
import AdminResident from './components/Admin/AdminResident';
import ResidentHome from './components/Resident/ResidentHome';
import Feedback from './components/Resident/Feedback';
import ChatScreen from './components/Resident/ChatScreen';
import AdminLocker from './components/Admin/AdminLocker';
import AdminLockerItems from "./components/Admin/AdminLockerItems";
import AdminChatLocker from './components/Admin/AdminChatLocker';
import AdminPayment from "./components/Admin/AdminPayment";
import AdminPaymentTransactionList from "./components/Admin/AdminPaymentTransactionList";
import AdminFeedback from "./components/Admin/AdminFeedback";
import AdminApartment from "./components/Admin/AdminApartment";
import AdminSurvey from "./components/Admin/AdminSurvey";
import AdminSurveyResponses from "./components/Admin/AdminSurveyResponses";
import AdminApartmentTransferHistorys from "./components/Admin/AdminApartmentTransferHistorys";
import AdminAmenity from "./components/Admin/AdminAmenity";
import AdminAmenityBooking from "./components/Admin/AdminAmenityBooking";
import AdminParkingRegistrations from "./components/Admin/AdminParkingRegistrations";
import AdminChatScreen from "./components/Admin/AdminChatScreen";
import AdminChat from "./components/Admin/AdminChat";
import RegisterVehicle from "./components/Resident/RegisterVehicle";
import SurveyListScreen from "./components/Resident/SurveyListScreen";
import AmenityBookingScreen from "./components/Resident/AmenityBookingScreen";
import BookingDetailScreen from "./components/Resident/BookingDetailScreen";
import PaymentScreen from "./components/Resident/PaymentScreen";
import PaymentDetailScreen from "./components/Resident/PaymentDetailScreen";
import LockerItems from "./components/Resident/LockerItems";
import NotificationScreen from "./components/Resident/NotificationScreen";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Login" element={<Login />} />
        {/** Admin Routes */}
        <Route path="/admin/home" element={<AdminHome />} />
        <Route path="/admin/accounts" element={<AdminAccount />} />
        <Route path="/admin/residents" element={<AdminResident />} />
        <Route path="/admin/lockers" element={<AdminLocker />} />
        <Route path="/admin/locker/:lockerId" element={<AdminLockerItems />} />
        <Route path="/admin/chat-locker" element={<AdminChatLocker />} />
        <Route path="/admin/payments" element={<AdminPayment />} />
        <Route path="/admin/payment-transactions/:categoryId/transactions" element={<AdminPaymentTransactionList />} />
        <Route path="/admin/feedbacks" element={<AdminFeedback />} />
        <Route path="/admin/apartments" element={<AdminApartment />} />
        <Route path="/admin/surveys" element={<AdminSurvey />} />
        <Route path="/admin/survey/:surveyId/responses" element={<AdminSurveyResponses />} />
        <Route path="/admin/apartment-transfer-historys" element={<AdminApartmentTransferHistorys />} />
        <Route path="/admin/amenities" element={<AdminAmenity />} />
        <Route path="/admin/amenity-bookings/:amenityId" element={<AdminAmenityBooking />} />
        <Route path="/admin/parking" element={<AdminParkingRegistrations />} />
        <Route path="/admin/chats" element={<AdminChatScreen />} />
        <Route path="/admin/chat/:roomId" element={<AdminChat />} />
        {/** Resident Routes */}
        <Route path="/resident/home" element={<ResidentHome />} />
        <Route path="/resident/feedback" element={<Feedback />} />
        <Route path="/resident/chat" element={<ChatScreen />} />
        <Route path="/resident/register-vehicle" element={<RegisterVehicle />} />
        <Route path="/resident/surveys" element={<SurveyListScreen />} />
        <Route path="/resident/amenity-booking" element={<AmenityBookingScreen />} />
        <Route path="/resident/amenity-booking-history" element={<BookingDetailScreen />} />
        <Route path="/resident/payment" element={<PaymentScreen />} />
        <Route path="/resident/payment-detail/:transactionId" element={<PaymentDetailScreen />} />
        <Route path="/resident/locker-items" element={<LockerItems />} />
        <Route path="/resident/locker-notification" element={<NotificationScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
