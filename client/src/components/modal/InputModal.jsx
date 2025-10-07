import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function InputModal({ title, isOpen, onClose, accountData, onSave, submitType, details, errors = {} }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (accountData) {
      setFormData({
        firstName: accountData.firstName || '',
        lastName: accountData.lastName || '',
        username: accountData.username || '',
        email: accountData.email || '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [accountData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear password error when user types
    if (name === 'newPassword' || name === 'confirmPassword') {
      setLocalErrors({
        ...localErrors,
        passwordMatch: ''
      });
    }
  };

  const handleSubmit = () => {
    // Check if passwords match (only if password fields are filled)
    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setLocalErrors({
          ...localErrors,
          passwordMatch: 'Passwords do not match'
        });
        return;
      }
    }

    // Clear local errors
    setLocalErrors({});

    // Call onSave callback - it will handle validation
    if (onSave) {
      const success = onSave(formData);
      // Only close if validation passed (onSave returns true)
      if (success !== false) {
        onClose();
      }
    }
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.username.trim() !== '' &&
      formData.email.trim() !== ''
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 bg-opacity-50 z-50 transition-opacity backdrop-blur-xs"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center text-left justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 pt-7 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-7 right-5 text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <X size={24} />
          </button>

          {/* Header */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-[#202124]">{title}</h2>
            <p className="text-sm text-[#686969] mt-1">
              {details} {accountData?.username || 'personnels'}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition ${
                    errors.firstName 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition ${
                    errors.lastName 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition ${
                  errors.username 
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                    : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                }`}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition ${
                  errors.email 
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                    : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="New Password"
                className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition ${
                  localErrors.passwordMatch 
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                    : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                }`}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition ${
                  localErrors.passwordMatch 
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                    : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                }`}
              />
              {localErrors.passwordMatch && (
                <p className="text-red-500 text-xs mt-1">{localErrors.passwordMatch}</p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 w-full flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid()}
              className={`px-6 py-3 rounded-xl transition font-medium ${
                isFormValid()
                  ? 'bg-[#1A73E8] text-white hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitType}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}