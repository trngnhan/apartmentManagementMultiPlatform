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
        {/** Resident Routes */}
        <Route path="/resident/home" element={<ResidentHome />} />
        <Route path="/resident/feedback" element={<Feedback />} />
        <Route path="/resident/chat" element={<ChatScreen />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
