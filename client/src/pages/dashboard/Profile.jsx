import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthProvider"; // adjust path if needed
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function Profile() {
  const { user, userFullName, setUserFullName } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // separated saved vs editable states
  const [savedData, setSavedData] = useState({
    fullName: "",
    firstName: "",
    middleName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [formData, setFormData] = useState({
    fullName: "",
    firstName: "",
    middleName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Parse full name into components
  const parseFullName = (fullName) => {
    if (!fullName) return { firstName: "", middleName: "", lastName: "" };
    
    // Handle format "LastName, FirstName MiddleName" or "LastName, FirstName"
    const parts = fullName.split(',');
    if (parts.length === 2) {
      const lastName = parts[0].trim();
      const firstMiddleParts = parts[1].trim().split(' ');
      const firstName = firstMiddleParts[0] || "";
      const middleName = firstMiddleParts.slice(1).join(' ') || "";
      
      return { firstName, middleName, lastName };
    }
    
    // Fallback: try to split by spaces
    const nameParts = fullName.split(' ');
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], middleName: "", lastName: "" };
    } else if (nameParts.length === 2) {
      return { firstName: nameParts[0], middleName: "", lastName: nameParts[1] };
    } else {
      const lastName = nameParts.pop() || "";
      const firstName = nameParts[0] || "";
      const middleName = nameParts.slice(1).join(' ') || "";
      return { firstName, middleName, lastName };
    }
  };

  // Combine name components into full name
  const combineFullName = (firstName, middleName, lastName) => {
    if (middleName) {
      return `${lastName}, ${firstName} ${middleName}`;
    }
    return `${lastName}, ${firstName}`;
  };

  const handleFormatSaveData = () => {
    try {
      const formattedFullName = user?.middleName
        ? `${user?.lastName}, ${user?.firstName} ${user?.middleName}`
        : `${user?.lastName}, ${user?.firstName}`;

      const nameComponents = parseFullName(formattedFullName);

      const initData = {
        fullName: formattedFullName || "Default Name",
        firstName: nameComponents.firstName,
        middleName: nameComponents.middleName,
        lastName: nameComponents.lastName,
        username: user?.username || "defaultUser",
        email: user?.email || "default@example.com",
        password: "*******************",
      };
      console.log("Saved Data from user: ", initData);
      return initData;
    } catch (error) {
      console.error("Error occurred: ", error);
    }
  };

  // initialize when user or userFullName changes
  useEffect(() => {
    const userData = handleFormatSaveData();
    setSavedData(userData);
    setFormData(userData);
    setIsEditing(false);
  }, [user]);

  // detect unsaved changes
  useEffect(() => {
    // setShowPassword(false);
    const changed = Object.keys(formData).some(
      (key) => formData[key] !== savedData[key]
    );
    setHasChanges(changed);
  }, [formData, savedData]);

  // handle input typing
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // save changes
  const handleSave = () => {
    setShowPassword(false);
    if (!hasChanges) return;
    
    // Combine name components into fullName before saving
    const updatedFormData = {
      ...formData,
      fullName: combineFullName(formData.firstName, formData.middleName, formData.lastName)
    };

    setSavedData(updatedFormData);
      setFormData(updatedFormData); // Also update formData to keep them in sync

    if (typeof setUserFullName === "function") {
      setUserFullName(updatedFormData.fullName);
    }
    setIsEditing(false);
    setIsHovered(false);
    console.log("✅ Saved:", updatedFormData);
    // setFormData(savedData);
  };

  // discard changes
  const handleDiscard = () => {
    setFormData(savedData); // restore last saved version
    setIsEditing(false);
    setShowPassword(false);
    console.log("❌ Discarded changes, restored:", savedData);
  };

  // role checks
  const isPersonnel = user?.role === "PERSONNEL";
  const isWorkingScholar = user?.role === "WORKING_SCHOLAR";

  return (
    <div className="min-h-screen flex items-start xl:items-center py-7 lg:py-20 xl:pt-7 xl:pb-7 px-3 sm:px-10 xl:px-0 xl:pl-1 xl:pr-7">
      <div className="h-full w-full flex flex-col text-start rounded-3xl p-5 sm:p-8 xl:p-10 bg-white mt-12 lg:mt-0 shadow-xs">
        <h1 className="text-2xl sm:text-3xl xl:text-4xl font-semibold">
          Profile
        </h1>
        <span className="text-sm sm:text-base xl:text-lg text-[#686969] mb-6 xl:mb-14">
          Manage your profile and account settings
        </span>

        <div
          className={`w-full flex flex-col p-5 lg:p-6 border border-gray-300 rounded-2xl ${
            isPersonnel ? "xl:mb-12" : "md:mb-40"
          }`}
        >
          <div className="flex flex-row justify-between items-start sm:items-center gap-3 mb-5 lg:mb-8">
            <div className="flex gap-2 items-center">
              <img
                src="/assets/Profile/MyAccountProfile.png"
                alt="Profile Icon"
                className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
              />
              <h3 className="text-lg sm:text-xl lg:text-2xl font-medium">
                Personal Details
              </h3>
            </div>

            {isPersonnel && (
              <>
                {isEditing ? (
                  <button
                    onClick={handleDiscard}
                    className="flex cursor-pointer border border-red-500 text-red-500 font-medium items-center 
                    py-2 px-3 lg:py-2.5 lg:px-4 gap-2 rounded-lg sm:rounded-xl text-sm lg:text-base w-auto 
                    hover:bg-red-500 hover:text-white transition-all duration-200"
                  >
                    Discard
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="flex cursor-pointer border border-[#1A73E8] text-[#1A73E8] font-medium items-center 
                    py-2 px-3 lg:py-2.5 lg:px-4 gap-2 rounded-lg sm:rounded-xl text-sm lg:text-base w-auto 
                    hover:bg-[#1A73E8] hover:text-white transition-all duration-200"
                  >
                    <img
                      src={
                        isHovered
                          ? "/assets/Profile/edit-white.png"
                          : "/assets/Profile/edit.png"
                      }
                      alt="Edit"
                      className="w-4 h-4"
                    />
                    Edit
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col xl:flex-row gap-6 xl:gap-10">
            {/* LEFT SIDE: NAME + ROLE */}
            <div className="flex flex-col items-center xl:items-start text-center xl:text-left w-full xl:w-1/3">
              <p className="text-xl sm:text-2xl lg:text-3xl xl:text-5xl font-semibold leading-normal mb-2">
                {isEditing ? formData.fullName : savedData.fullName}
              </p>
              <span className="text-sm sm:text-base lg:text-lg font-medium text-[#686969]">
                {isWorkingScholar ? "Working Scholar" : "Personnel"}
              </span>
            </div>
            {/* RIGHT SIDE: FORM */}
            <div
              className={`w-full xl:w-2/3 space-y-4 sm:space-y-5 lg:space-y-6 ${
                isPersonnel ? "" : "md:pb-20"
              }`}
            >
              {/* Name fields - show separate fields when editing, single field when not */}
              {!isEditing ? (
                // Display mode - show full name only
                <div>
                  <label className="text-xs sm:text-sm lg:text-base font-semibold capitalize">
                    Full name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-[#F5F5F5] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 lg:py-4 text-sm lg:text-base border border-transparent 
                      focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] text-gray-500"
                    disabled={true}
                  />
                </div>
              ) : (
                // Edit mode - show separate name fields
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs sm:text-sm lg:text-base font-semibold">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full bg-[#F5F5F5] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 lg:py-4 text-sm lg:text-base border border-transparent 
                          focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] text-black"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm lg:text-base font-semibold">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        className="w-full bg-[#F5F5F5] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 lg:py-4 text-sm lg:text-base border border-transparent 
                          focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] text-black"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm lg:text-base font-semibold">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full bg-[#F5F5F5] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 lg:py-4 text-sm lg:text-base border border-transparent 
                          focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] text-black"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Other fields */}
              {/* Other fields */}
            {["username", "email"].map((field) => (
              <div key={field}>
                <label className="text-xs sm:text-sm lg:text-base font-semibold capitalize">
                  {field}
                </label>
                <input
                  type="text"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className={`w-full bg-[#F5F5F5] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 lg:py-4 text-sm lg:text-base border border-transparent 
                    focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] 
                    ${isEditing ? "text-black" : "text-gray-500"}`}
                  disabled={!isEditing}
                />
              </div>
            ))}

            {/* Password field with eye toggle */}
            {isPersonnel && (
              <div>
                <label className="text-xs sm:text-sm lg:text-base font-semibold capitalize">
                  Password
                </label>
                <div className="relative">
                  <input
                  // type={isEditing ? (showPassword ? "text" : "password") : "password"}
                    type={isEditing && showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full bg-[#F5F5F5] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 lg:py-4 text-sm lg:text-base border border-transparent 
                      focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-[#1A73E8] 
                      ${isEditing ? "text-black" : "text-gray-500"} pr-10`}
                    disabled={!isEditing}
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                          )}
                        </div>
                      </div>
                    )}

              {/* ✅ SAVE BUTTON ALWAYS VISIBLE */}
              {isPersonnel && (
                <div className="flex justify-center lg:justify-end">
                  <button
                    onClick={handleSave}
                    disabled={!isEditing || !hasChanges}
                    className={`w-full sm:w-auto font-medium py-2.5 sm:py-3 px-4 sm:px-5 
                    rounded-lg sm:rounded-xl text-sm sm:text-base transition-all duration-200
                    ${
                      isEditing && hasChanges
                        ? "bg-[#1A73E8] text-white hover:bg-[#155fc9] cursor-pointer "
                        : "bg-[#1A73E8]/40 text-white cursor-not-allowed"
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}