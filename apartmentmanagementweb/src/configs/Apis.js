import axios from "axios";
import { set } from "firebase/database";

const BASE_URL = "http://192.168.1.26:8000/";

export const endpoints = {
    login: "/o/token/",

    users: "/users/",
    admin: "/users/admins/",
    userLock: (id) => `/users/${id}/`,

    "current-user": "/users/current-user/",
    unregisteredUsers: "/users/unregistered-users/",

    apartments: "/apartments/",
    transfer: (id) => `/apartments/${id}/transfer/`,
    residentsWithoutApartment: "/apartments/resident-without-apartment/",
    apartmentTransferHistories: "/apartmentstranshistories/",

    residents: "/residents/",

    feedbacks: "/feedbacks/",
    myFeedbacks: "/feedbacks/my-feedbacks/",

    surveys: "/surveys/",
    surveyResponses: "/surveyresponses/",
    mySurveyResponses: "/surveyresponses/my-responses/",
    setSurveyActive: (id) => `/surveys/${id}/set-active/`,

    countResident: "/residents/count-resident/",
    totalApartments: "/apartments/total-apartments/",

    lockers: "/parcellockers/",
    unregisteredResidentsLocker: "/parcellockers/resident-without-locker/",

    lockerItems: (lockerId) => `/parcellockers/${lockerId}/items/`,
    addLockerItem: (lockerId) => `/parcellockers/${lockerId}/add-item/`,

    updateLockerItemStatus: (lockerId) => `/parcellockers/${lockerId}/update-item-status/`,
    visitorVehicleRegistrations: "/visitorvehicleregistrations/",
    approveVisitorVehicleRegistration: (id) => `/visitorvehicleregistrations/${id}/set-approval/`,

    updateFeedbackStatus: (id) => `/feedbacks/${id}/update-status/`,

    paymentCategories: "/paymentcategories/",
    paymentCategoryLock: (id) => `/paymentcategories/${id}/`,
    paymentsTransactions: "/paymenttransactions/",
    updatePaymentStatus: (id) => `/paymenttransactions/${id}/update-payment/`,

    surveyOptions: "/surveyoptions/",
    surveyResponsesBySurvey: (surveyId) => `/surveys/${surveyId}/get-responses/`,

    myVehicleRegistrations: "/visitorvehicleregistrations/my-registrations/",
    getApartment: "/apartments/get-apartment/",

    amenities: "/amenities/",

    amenityBooking: "/amenitybookings/",
    myAmenityBookings: (residentId) => `/amenitybookings/?resident=${residentId}`,
    amenityBookings: (amenityId) => `/amenitybookings/${amenityId}/`,

    myPayments: "/paymenttransactions/my-payments/",
    getTransaction: (transaction_id) => `/paymenttransactions/transaction/${transaction_id}/`,
    createMomoPayment: (categoryId) => `/paymenttransactions/${categoryId}/create-momo-payment/`,
    updatePaymentStatusGeneral: "/paymenttransactions/update-status/",
    adminUpdatePayment: (id) => `/paymenttransactions/${id}/update-payment/`,
    allResidents: "/paymentcategories/all-residents/"
};

export const authApis = (token) => {
  if (!token) {
    throw new Error("Token is required");
  }
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const api = axios.create({
  baseURL: BASE_URL,
});

export default api;