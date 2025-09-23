import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { login } from '../../api/auth';
export default function LoginStaff() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
  setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
     console.log("Form submitted:", {
      formData: formData
    });   
  e.preventDefault();

  try {
    const res = await login(formData);
    if (!res || !res.success) {
      return; // error toast already shown
    }

    console.log("Response: ", res);

    if (res.permission === "basic") {
      window.location.href = `/${res.role.toLowerCase()}/dashboard`;
    } 
    else if (res.role === "admin" && res.permission === "admin") {
      window.location.href = `/${res.role.toLowerCase()}/dashboard`;
    } 

  } catch (error) {
    console.error("Error in logging in!, ", error);
  }
};


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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome!</h1>
            <p className="text-gray-600">Enter to manage queue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 md:space-y-6">
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
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition">
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-md"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}