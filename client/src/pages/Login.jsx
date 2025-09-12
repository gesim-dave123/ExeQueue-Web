import { toast, Toaster } from "sonner";
import { login, logout } from '../api/auth.js'; // your login.js file

export default function Login() {
  const handleLogin = async () => {
    // sample credentials
    const formData = {
      username: "admin",
      password: "admin123456"
    };

    const result = await login(formData);

    if (result?.success) {
      toast.success(`Welcome ${result.role}! 🎉`);
    }
  };

  const handleLogout = async ()=>{
    const res = await logout();

    if(!res) console.log("Error in logging out!")

    window.location.href = "/"; // or use your router
  }

  return (
    <div className="p-6">
      <Toaster richColors position="top-right" />
      <h1 className="text-xl font-bold">Login API Test</h1>
      <button
        onClick={handleLogin}
        className="mt-4 px-4 py-2 rounded bg-blue-500 text-white"
      >
        Test Login
      </button>

      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 rounded bg-blue-500 text-white"
      >
        Test Logout
      </button>
    </div>
  );
}
