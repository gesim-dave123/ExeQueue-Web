import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(user ? "/staff/dashboard" : "/");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center space-y-4">
      <h1 className="text-3xl font-semibold text-gray-800">Page Not Found</h1>
      <p className="text-gray-500">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <button
        onClick={handleGoBack}
        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        {user ? "Go Back to Dashboard" : "Go to Home"}
      </button>
    </div>
  );
};

export default NotFound;
