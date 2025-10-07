import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth";
import { useAuth } from "../../context/AuthProvider";
import { useLoading } from "../../context/LoadingProvider";
export default function LoginStaff() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  // const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const { setIsLoading, setProgress, setLoadingText } = useLoading();
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setLoadingText("Logging In...");
    setProgress(0);

    const res = await login(formData);
    if (!res?.success) {
      setIsLoading(false);
      return;
    }

    // Simulate progress
    await new Promise((resolve) => setTimeout(resolve, 100));
    setProgress(100);

    // Wait a bit for the user to see full progress
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Refresh auth and navigate
    await refreshAuth();
    navigate("/staff/dashboard", { replace: true });

    // Give Framer Motion time to animate fade out
    setTimeout(() => setIsLoading(false), 500); // match your exit duration
  };

  // const handleRedirect = async (response) => {
  //   try {
  //     await refreshAuth();
  //     navigate("/staff/dashboard", { replace: true });
  //   } catch (error) {
  //     console.error("Error redirecting after login:", error);
  //   } finally {
  //     setLoading(false);
  //     setShowLoading(false);
  //   }
  // };

  // // Render conditionally
  // if (loading && showLoading) {
  //   return (
  //     <div className="fixed inset-0 z-50">
  //       <Loading text="Logging In..." progress={progress} />
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-gray-100 to-gray-200 px-4">
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side - Image - Responsive */}
        <div className="w-full md:w-1/2 relative">
          <div className="aspect-video md:aspect-auto md:h-full">
            <img
              src="/assets/loginIcon.jpg"
              alt="University of Cebu"
              className="w-full h-full object-cover rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl"
            />
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-8 lg:p-12">
          {/* Logo */}
          <img
            src="/assets/icon.svg"
            alt="ExeQueue Logo"
            className="w-20 h-16 md:w-25 md:h-20 mb-2"
          />

          {/* Welcome Text */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Welcome!
            </h1>
            <p className="text-gray-600">Enter to manage queue</p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-y-4 md:space-y-6"
          >
            {/* Username */}
            <div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="w-full border border-gray-200 bg-gray-100 rounded-xl px-4 py-3 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full border border-gray-200 bg-gray-100 rounded-xl px-4 py-3 md:py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 md:top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              <div className="text-right mt-2">
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-800 transition"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-md 
                  ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
