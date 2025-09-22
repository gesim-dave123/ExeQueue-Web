import React from "react";
import { FaFacebookF } from "react-icons/fa";
import { Globe } from "lucide-react";

export default function Contact() {
  return (
    <footer className="bg-[#10458B] mt-20 text-white py-10 px-6 md:px-12 rounded-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
        
        {/* Left Section */}
        <div className="flex flex-col gap-4 max-w-md w-full">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full">
              <img src="assets/icon.svg" alt="ExeQueue Logo" className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold">ExeQueue</h1>
          </div>

          <p className="text-sm text-left md:text-base text-gray-300 leading-relaxed">
            Queue Management System for Student Affairs Services Office
          </p>

          {/* Socials */}
          <a
            href="https://www.facebook.com/ucmain.sao"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 mt-5 h-8 flex items-center justify-center bg-white text-[#0a285f] rounded-full hover:bg-gray-200 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>

        {/* Middle - Services */}
        <div className="grid grid-cols-2 gap-10">
          <div className="text-left w-full sm:w-auto">
                    <h2 className="text-blue-300 font-semibold mb-3">Service</h2>
                    <ul className="space-y-2 text-gray-300 text-sm md:text-base">
                      <li>Good Moral</li>
                      <li>Insurance Payment</li>
                      <li>Transmittal Letter</li>
                      <li>Temporary Gate Pass</li>
                      <li>Uniform Exemption</li>
                      <li>Enrollment/Transfer</li>
                    </ul>
                  </div>

                  {/* Right - Product */}
                  <div className="text-left w-full sm:w-auto">
                    <h2 className="text-blue-300 font-semibold mb-3">Product</h2>
                    <ul className="space-y-2 text-gray-300 text-sm md:text-base">
                      <li>Features</li>
                      <li>Tutorial</li>
                    </ul>
                  </div>
                </div>
        </div>
       

      {/* Bottom Note */}
      <div className="mt-10 text-center text-xs text-gray-400  lg:w-5xl">
        © 2025 University of Cebu Main Campus - ExeQueue v1.0.1 | All Rights Reserved.
      </div>
    </footer>
  );
}
