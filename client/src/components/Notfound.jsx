import React from "react";
import { useNavigate } from "react-router-dom";
import errorImage from "/assets/ErrorImage.png";

export default function Notfound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col-reverse xl:flex-row justify-center items-center px-6 py-2 xl:px-30 xl:py-16 bg-white transition-all duration-300">
      <div className="w-full xl:w-1/2 flex justify-center mb-10 xl:mb-0">
        <img
          src={errorImage}
          alt="404 Illustration"
          className="w-[80%] max-w-xs sm:max-w-md md:max-w-lg xl:max-w-3xl "
        />
      </div>

      <div className="w-full xl:w-1/2 flex flex-col items-center text-center gap-8 xl:gap-10 2xl:-ml-40">
        <h1 className="text-[100px] sm:text-[140px] md:text-[180px] xl:text-[220px] text-[#1A73E8] font-extrabold leading-none">
          404
        </h1>

        <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
          Something went wrong
        </h3>

        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-lg mb-2">
          Sorry, we can’t find the page you’re looking for.
        </p>

        <button
          onClick={() => navigate("/")}
          className="px-8 sm:px-10 py-4 sm:py-5 rounded-3xl bg-[#1A73E8] text-white text-base sm:text-lg font-semibold shadow-md hover:bg-blue-500 transition-all duration-300 mb-10"
        >
          Back to Homepage
        </button>
      </div>
    </div>
  );
}
