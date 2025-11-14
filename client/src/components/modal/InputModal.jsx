import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function InputModal({
  title,
  isOpen,
  onClose,
  accountData,
  onSave,
  submitType,
  details,
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const isEditMode = !!accountData;

  useEffect(() => {
    if (accountData) {
      setFormData({
        firstName: accountData.firstName || '',
        lastName: accountData.lastName || '',
        username: accountData.username || '',
        email: accountData.email || '',
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      // Reset form for new account
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
    // Clear errors when modal opens/closes
    setFieldErrors({});
  }, [accountData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field when user types
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: '',
      });
    }
  };

  // ✅ Email validation function
  const validateEmail = (email) => {
    // Check for spaces
    if (email.includes(' ')) {
      return false;
    }

    // Count @ symbols (must be exactly 1)
    const atCount = (email.match(/@/g) || []).length;
    if (atCount !== 1) {
      return false;
    }

    // Check if email ends with @gmail.com
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return false;
    }

    // Check if there's a username before @gmail.com (not just @gmail.com)
    const username = email.split('@')[0];
    if (username.length === 0) {
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setFieldErrors({});
    let errors = {};

    // Validate required fields
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      // ✅ Email format validation
      errors.email = 'Invalid email format';
    }

    // ✅ Password validation for NEW accounts only
    if (!isEditMode) {
      if (!formData.newPassword || !formData.newPassword.trim()) {
        errors.newPassword = 'Password cannot be empty';
        errors.confirmPassword = 'Password cannot be empty';
      } else if (
        !formData.confirmPassword ||
        !formData.confirmPassword.trim()
      ) {
        errors.newPassword = 'Password cannot be empty';
        errors.confirmPassword = 'Password cannot be empty';
      } else if (formData.newPassword.length < 8) {
        errors.newPassword = 'Your password must be 8 characters long.';
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.newPassword = 'Passwords do not match';
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (isEditMode && (formData.newPassword || formData.confirmPassword)) {
      if (formData.newPassword.length < 8) {
        errors.newPassword = 'Your password must be 8 characters long.';
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.newPassword = 'Passwords do not match';
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    // If there are validation errors, show them
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Call onSave callback
    if (onSave) {
      const result = await onSave(formData);

      // ✅ Handle backend errors (username/email exists, etc.)
      if (result && result.success === false) {
        // Set error on specific field
        if (result.field) {
          setFieldErrors({
            [result.field]: result.message,
          });
        }
        return; // Keep modal open
      }

      // ✅ Success - close modal
      onClose();
    }
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    if (isEditMode) {
      // Edit mode: only basic fields required
      return (
        formData.firstName.trim() !== '' &&
        formData.lastName.trim() !== '' &&
        formData.username.trim() !== '' &&
        formData.email.trim() !== ''
      );
    } else {
      // Add mode: passwords also required
      return (
        formData.firstName.trim() !== '' &&
        formData.lastName.trim() !== '' &&
        formData.username.trim() !== '' &&
        formData.email.trim() !== '' &&
        formData.newPassword.trim() !== '' &&
        formData.confirmPassword.trim() !== ''
      );
    }
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
                    fieldErrors.firstName
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                      : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                  }`}
                />
                {fieldErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {fieldErrors.firstName}
                  </p>
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
                    fieldErrors.lastName
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                      : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                  }`}
                />
                {fieldErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1">
                    {fieldErrors.lastName}
                  </p>
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
                  fieldErrors.username
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                    : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                }`}
              />
              {fieldErrors.username && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.username}
                </p>
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
                  fieldErrors.email
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                    : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                }`}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
                {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="New Password"
                className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition ${
                  fieldErrors.newPassword
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                    : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                }`}
              />
              {fieldErrors.newPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
                {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition ${
                  fieldErrors.confirmPassword
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                    : 'border-[#DDEAFC] focus:ring-[#DDEAFC] focus:border-transparent'
                }`}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.confirmPassword}
                </p>
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
