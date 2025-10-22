import { useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";
import Layout from "./components/Layout";
import LayoutDashboard from "./components/LayoutDashboard";
import Loading from "./components/Loading";
import { useLoading } from "./context/LoadingProvider";
import { ProtectedRoute } from "./context/ProtectedRoute";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import Dashboard from "./pages/dashboard/Dashboard";
import Display_Queue from "./pages/dashboard/Display_Queue";
import ManageAccount from "./pages/dashboard/ManageAccount";
import Transactions from "./pages/dashboard/Transactions";
import FAQs from "./pages/FAQs";
import Help from "./pages/Help";
import Landing from "./pages/Landing";
import LiveQueue from "./pages/LiveQueue";
import NotFound from "./pages/NotFound";
import LoginStaff from "./pages/staffs/LoginStaff";
import DisplayQueue from "./pages/students/DisplayQueue";
import GenerateQueue from "./pages/students/GenerateQueue";
import Request from "./pages/students/Request";
import SearchQueue from "./pages/students/SearchQueue";
import SearchQueueResult from "./pages/students/SearchQueueResult";
import Manage_Queue from "./pages/dashboard/Manage_Queue";
import Analytics from "./pages/dashboard/Analytics";
import LayoutProfile from "./components/LayoutProfile";
import Profile from "./pages/dashboard/Profile";
import ReleaseWindow from "./pages/dashboard/ReleaseWindow";
import Reset_Queue from "./pages/dashboard/Reset_Queue";
import StaffLogin from "./pages/staffs/login/StaffLogin";
import ForgotPassword from "./pages/staffs/login/ForgotPassword";
import VerifyOTP from "./pages/staffs/login/VerifyOTP";
import ResetPassword from "./pages/staffs/login/ResetPassword";
import SuccessReset from "./pages/staffs/login/SuccessReset";
import LayoutLogin from "./components/LayoutLogin";
function App() {
  const { isLoading, progress, loadingText } = useLoading();

  return (
    <Router>
      <Toaster richColors position="top-right" expand limit={2} />
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-white flex justify-center items-center">
          <Loading progress={progress} text={loadingText} />
        </div>
      )}

      <Routes>
        {/* Public Routes */}
        <Route element = {<LayoutLogin/>}>
          <Route path="/staff/login" element={<StaffLogin/>} />
          <Route path="/staff/forgot-password" element={<ForgotPassword />} />
          <Route path="/staff/verify-otp" element={<VerifyOTP />} />
          <Route path="/staff/reset-password" element={<ResetPassword />} />
          {/* //for render(testing) raning nas ubos, si successreset */}
          <Route path= "/staff/success-reset" element = {<SuccessReset/>}></Route> 
        </Route>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/help" element={<Help />} />
          <Route path="/faq" element={<FAQs />} />
          <Route path="/footer" element={<Contact />} />
          <Route path="/staff/login" element={<LoginStaff />} />
          <Route path="/student/request" element={<Request />} />
          <Route path="/student/queue/generate" element={<GenerateQueue />} />
          <Route path="/student/queue/live" element={<LiveQueue />} />
          <Route path="/student/queue/display" element={<DisplayQueue />} />
          <Route path="/student/queue/search" element={<SearchQueue />} />
          <Route
            path="/student/queue/search/result"
            element={<SearchQueueResult />}
          />
        </Route>

        {/* Staff Protected Routes */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={["PERSONNEL", "WORKING_SCHOLAR"]}>
            <LayoutDashboard />
          </ProtectedRoute>
        }
      >
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={["PERSONNEL", "WORKING_SCHOLAR"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="queue/manage"
          element={
            <ProtectedRoute allowedRoles={["PERSONNEL", "WORKING_SCHOLAR"]}>
              <Manage_Queue />
            </ProtectedRoute>
          }
        />
        <Route
          path="queue/display"
          element={
            <ProtectedRoute allowedRoles={["PERSONNEL", "WORKING_SCHOLAR"]}>
              <Display_Queue />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage/account"
          element={
            <ProtectedRoute allowedRoles={["PERSONNEL"]}>
              <ManageAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path="transaction/history"
          element={
            <ProtectedRoute allowedRoles={["PERSONNEL", "WORKING_SCHOLAR"]}>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoute allowedRoles={["PERSONNEL"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Profile Routes - Separate from Dashboard Layout */}
      <Route
        path="/staff/profile"
        element={
          <ProtectedRoute allowedRoles={["PERSONNEL", "WORKING_SCHOLAR"]}>
            <LayoutProfile />
          </ProtectedRoute>
        }
      >
        <Route path="profile-settings" element={ 
          <ProtectedRoute allowedRoles={["WORKING_SCHOLAR"]}>
            <Profile />
            </ProtectedRoute>} />
        <Route path="release-window" element={
          <ProtectedRoute allowedRoles={["PERSONNEL"]}>
          <ReleaseWindow />
            </ProtectedRoute>} />
        <Route path="reset-queue" element={
          <ProtectedRoute allowedRoles={["PERSONNEL"]}>
          <Reset_Queue />
           </ProtectedRoute>} />
      </Route>

        {/* <Route element={<LayoutProfile />}>
          <Route path="/profile/profile-settings" element={<Profile />}></Route>
          <Route
            path="/profile/release-window"
            element={<ReleaseWindow />}
          ></Route>
          <Route path= "/profile/reset-queue" element = {<Reset_Queue/>}></Route>
        </Route> */}

        {/* <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={["PERSONNEL", "WORKING_SCHOLAR"]}>
              <LayoutProfile />
            </ProtectedRoute>
          }
        >
          <Route
            path="reset-queue"
            element={
              <ProtectedRoute allowedRoles={["PERSONNEL"]}>
                <Reset_Queue />
              </ProtectedRoute>
            }
          />
        </Route> */}

        {/* Catch-all Not Found */}
        <Route path="/not-found" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
