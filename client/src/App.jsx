import { useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";
import Layout from "./components/Layout";
import LayoutDashboard from "./components/LayoutDashboard";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import Dashboard from "./pages/dashboard/Dashboard";
import FAQs from "./pages/FAQs";
import Help from "./pages/Help";
import Landing from "./pages/Landing";
import LiveQueue from "./pages/LiveQueue";
import CallNextTest from "./pages/staffs/CallNextTest";
import LoginStaff from "./pages/staffs/LoginStaff";
import SocketTesting from "./pages/staffs/SocketTesting";
import Request from "./pages/students/Request";
import GenerateQueue from "./pages/students/GenerateQueue";
import DisplayQueue from "./pages/students/DisplayQueue";
import Display_Queue from "./pages/dashboard/Display_Queue";
import SearchQueue from "./pages/students/SearchQueue";
import SearchQueueResult from "./pages/students/SearchQueueResult";
import StaffLogin from "./pages/staff/StaffLogin";
import ManageAccount from "./pages/dashboard/ManageAccount";
import Transactions from "./pages/dashboard/Transactions";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Toaster richColors position="top-right" expand limit={2} />
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />}></Route>
            <Route path="/about" element={<AboutUs />}></Route>
            <Route path="/help" element={<Help />}></Route>
            <Route path="/faq" element={<FAQs />}></Route>
            <Route path="/footer" element={<Contact />}></Route>
            <Route path="/staff/login" element={<LoginStaff />}></Route>
            <Route path="/student/request" element={<Request />}></Route>
            <Route
              path="/student/generate-queue"
              element={<GenerateQueue />}
            ></Route>

            <Route path="/student/live-queue" element={<LiveQueue />}></Route>
            <Route
              path="/student/display-queue"
              element={<DisplayQueue />}
            ></Route>
            <Route
              path="/student/search-queue"
              element={<SearchQueue />}
            ></Route>
            <Route
              path="/student/search-queue-result"
              element={<SearchQueueResult />}
            ></Route>
          </Route>
          <Route>
            <Route path="/staff/call-next" element={<CallNextTest />}></Route>
            <Route
              path="/staff/socket-test"
              element={<SocketTesting />}
            ></Route>
            <Route path="/staff-login" element={<StaffLogin />}></Route>
          </Route>
        </Routes>
      </Router>

      <Router>
        <Routes>
          <Route element={<LayoutDashboard />}>
            <Route path="/dashboard" element={<Dashboard />}></Route>
            <Route
              path="/dashboard/display-queue"
              element={<Display_Queue />}
            ></Route>
            <Route
              path="/dashboard/manage-account"
              element={<ManageAccount />}
            ></Route>
            <Route path="/dashboard/transactions" element={<Transactions/>}></Route>
          </Route>
          <Route path="*" element={<div>404 Not Found</div>}>
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
