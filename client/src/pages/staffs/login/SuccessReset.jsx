// export default function SuccessReset({ imageSrc, onLogin }) {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const message = location.state?.message;

//   useEffect(() => {
//     inputRefs[0].current?.focus();
//   }, [message]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
//       <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
//         {/* Image */}
//         <div className="flex justify-center mb-6">
//           {imageSrc ? (
//             <img
//               src="/assets/success.png"
//               alt="Password Reset Success"
//               className="w-64 h-48 object-contain"
//             />
//           ) : (
//             <div className="w-64 h-48  rounded-lg flex items-center justify-center">
//               <img src="/assets/success.png" alt="" className="w-96" />
//             </div>
//           )}
//         </div>

//         {/* Text Content */}
//         <div className="text-center mb-8">
//           <p className="text-gray-600 text-sm mb-2">
//             Your password has been reset
//           </p>
//           <h1 className="text-3xl font-semibold text-gray-900">Successfully</h1>
//         </div>

//         {/* Login Button */}
//         <button
//           onClick={() => navigate("/staff/login")}
//           className="w-full bg-[#1A73E8]  hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-2xl transition-colors duration-200 cursor-pointer"
//         >
//           Login
//         </button>
//       </div>
//     </div>
//   );
// }
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import Loading from "../../../components/Loading";
import { useLoading } from "../../../context/LoadingProvider";

export default function SuccessReset({ imageSrc }) {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const message = location.state?.message;

  const [isLoading, setLoading] = useState(false);
  const { setIsLoading, setProgress, setLoadingText } = useLoading();

  // const [progress, setProgress] = useState(0);

  const handleLoginClick = () => {
    setIsLoading(true);
    setLoading(true);
    setLoadingText("Redirecting...");
    setProgress(0);

    // Start progress animation immediately and independently
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Gradually increase progress, animate to full 100%
        if (prev < 100) {
          return prev + Math.random() * 15;
        }
        return 100;
      });
    }, 200);

    // Simulate a delay (since there's no API call)
    setTimeout(async () => {
      // Clear the interval
      clearInterval(progressInterval);

      // Ensure progress reaches 100%
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 800)); // Wait for progress to visually reach 100%

      // Optional: brief pause at 100% so user sees completion
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Now navigate
      navigate("/staff/login");

      // Clean up loading states after navigation
      setTimeout(() => {
        setLoading(false);
        setIsLoading(false);
        setProgress(0);
      }, 100);
    }, 2000);
  };
  return (
    <>
      {/* <Loading
        text="Redirecting..."
        progress={progress}
        isVisible={isLoading}
      /> */}

      <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          {/* Image */}
          <div className="flex justify-center mb-6">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Password Reset Success"
                className="w-64 h-48 object-contain"
              />
            ) : (
              <div className="w-64 h-48 rounded-lg flex items-center justify-center">
                <img src="/assets/success.png" alt="Success" className="w-96" />
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="text-center mb-8">
            <p className="text-gray-600 text-sm mb-2">
              Your password has been reset
            </p>
            <h1 className="text-3xl font-semibold text-gray-900">
              Successfully
            </h1>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLoginClick}
            disabled={isLoading}
            className={`w-full font-medium py-3 px-4 rounded-2xl transition-colors duration-200 ${
              isLoading
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-[#1A73E8] hover:bg-blue-700 text-white cursor-pointer"
            }`}
          >
            {isLoading ? "Please wait..." : "Login"}
          </button>
        </div>
      </div>
    </>
  );
}
