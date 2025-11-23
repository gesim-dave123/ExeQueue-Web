import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../../api/auth.js";
import { showToast } from "../../../components/toast/ShowToast.jsx";
import { useAuth } from "../../../context/AuthProvider";
import { useLoading } from "../../../context/LoadingProvider";

export default function StaffLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [formData, setFormData] = useState({ username: "", password: "" });

  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const { setIsLoading, setProgress, setLoadingText } = useLoading();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      setErrors({
        username: "Please fill out all required fields",
        password: "Please fill out all required fields",
      });
      showToast("Please fill out all required fields", "error");
      return false;
    }
    if (formData.password.trim().length < 8) {
      setErrors({
        username: "",
        password: "Password must be at least 8 characters",
      });
      showToast("Password must be at least 8 characters", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoading(true);
    setLoadingText("Logging In...");
    setProgress(0);

    // Start progress animation immediately and independently
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Gradually increase progress, but cap at 90% until API completes
        if (prev < 90) {
          return prev + Math.random() * 15;
        }
        return prev;
      });
    }, 200);

    try {
      const res = await login(formData);

      // Clear the interval once API completes
      clearInterval(progressInterval);

      if (res?.success) {
        // Animate to 100% and WAIT for it to complete
        setProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 800)); // Wait for progress to visually reach 100%

        await refreshAuth();
        showToast(res?.message, "success");

        // Optional: brief pause at 100% so user sees completion
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Now navigate
        navigate("/staff/dashboard", { replace: true });

        // Clean up loading states after navigation
        setTimeout(() => {
          setIsLoading(false);
          setLoading(false);
        }, 100);
        return;
      }

      if (!res?.hasAccount) {
        console.log("Login failed:", res);
        setErrors({
          username: res?.message || "Account not found!",
          password: res?.message || "Account not found!",
        });
        setFormData({ ...formData, password: "" });
        showToast(res?.message, "error");
      } else if (res?.invalidCred) {
        console.log("Login failed:", res);
        setErrors({
          username: res?.message || "Invalid Credentials",
          password: res?.message || "Invalid Credentials",
        });
        setFormData({ username: "", password: "" });
        showToast(res?.message, "error");
      } else {
        showToast(res?.message || "Login failed", "error");
      }

      setIsLoading(false);
      setLoading(false);
    } catch (error) {
      clearInterval(progressInterval);
      showToast(error?.message || "An unexpected error occurred", "error");
      setIsLoading(false);
      setLoading(false);
    }
  };

  // Helper functions to determine styling
  const getFieldErrorStyle = (fieldName) => {
    return errors[fieldName]
      ? "border-red-500 border-1 focus:ring-red-500"
      : "border-[#DDEAFC] focus:ring-1 focus:ring-blue-500 focus:border-blue-500";
  };

  const getLabelErrorStyle = (fieldName) => {
    if (errors[fieldName]) {
      return "peer-focus:text-red-500 text-red-500";
    }
    return formData[fieldName]
      ? "peer-focus:text-blue-500 text-blue-500"
      : "peer-focus:text-blue-500";
  };

  const getErrorMessage = () => {
    if (
      errors.username &&
      errors.password &&
      errors.username === errors.password
    ) {
      return errors.username;
    }
    if (errors.username) return errors.username;
    if (errors.password) return errors.password;
    return "";
  };

  const hasError = errors.username || errors.password;

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-transparent p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-20 mt-5">
          <img src="/assets/login-logo.png" alt="Logo" className="w-14 h-13" />
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            ExeQueue
          </h1>
        </div>

        <h1 className="text-3xl text-gray-900 font-semibold text-center mb-6">
          Welcome!
        </h1>
        <p className="text-gray-600 text-center mb-8 text-sm">
          Enter to manage queue
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* USERNAME */}
          <div className="relative">
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder=" "
              className={`peer w-full px-4 py-3 border rounded-2xl bg-white 
                focus:outline-none transition-all ${getFieldErrorStyle(
                  "username"
                )}`}
            />
            <label
              htmlFor="username"
              className={`absolute left-5 transition-all duration-200 bg-white px-1 pointer-events-none 
                text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:text-xs 
                -top-2.5 text-xs ${getLabelErrorStyle("username")}`}
            >
              Username
            </label>
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder=" "
              className={`peer w-full px-4 py-3 pr-12 border rounded-2xl bg-white 
                focus:outline-none transition-all ${getFieldErrorStyle(
                  "password"
                )}`}
            />
            <label
              htmlFor="password"
              className={`absolute left-5 transition-all duration-200 bg-white px-1 pointer-events-none 
                text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:text-xs 
                -top-2.5 text-xs ${getLabelErrorStyle("password")}`}
            >
              Password
            </label>

            {formData.password && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer`}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            )}
          </div>

          {/* Error Message and Forgot Password */}
          <div
            className={`flex -mt-2 ${
              hasError ? "justify-between" : "justify-end"
            }`}
          >
            {hasError && (
              <p className="text-red-500 text-left text-xs">
                {getErrorMessage()}
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate("/staff/forgot-password")}
              className="text-sm text-[#1A73E8] cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3 rounded-xl transition-all cursor-pointer ${
              loading
                ? "bg-[#1A73E8] cursor-not-allowed text-white"
                : "bg-[#1A73E8] hover:bg-[#1557B0] text-white"
            }`}
          >
            {loading ? "Please wait..." : "Login"}
          </button>
        </form>

        {/* Back to Homepage */}
        <div className="flex justify-center items-center mt-6">
          <ArrowLeft size={16} className="mr-2 text-gray-700" />
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-700 cursor-pointer"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
