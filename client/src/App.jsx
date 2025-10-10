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
                <Manage_Queue/>
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
                <Analytics/>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
