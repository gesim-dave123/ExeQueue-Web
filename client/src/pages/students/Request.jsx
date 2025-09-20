import { motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { getCourseData } from "../../api/course.js";
import { getRequestType } from "../../api/request.js";
import { showToast } from "../../components/toast/ShowToast";


export default function Request() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [requestType, setRequestType] = useState([])
  const [courseData, setCourseData] = useState([])
  const [formData, setFormData] = useState({
    lastName: "",
    middleName: "",
    firstName: "",
    studentId: "",
    courseId: "",
    yearLevel: ""
  });

  const fullName = `${formData.lastName}, ${formData.firstName} ${formData.middleName}`;
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const iconRules = [
    { keywords: ["certificate"], icon: "fa-solid fa-file" },
    { keywords: ["insurance", "payment"], icon: "fa-solid fa-shield-halved" },
    { keywords: ["letter"], icon: "fa-solid fa-pen-to-square" },
    { keywords: ["gate", "id", "pass"], icon: "fa-solid fa-id-badge" },
    { keywords: ["uniform", "exemption"], icon: "fa-solid fa-shirt" },
    { keywords: ["enrollment", "transfer"], icon: "fa-solid fa-right-left" },
  ];
      

  const validateStep1 = () => {
    if (!selectedQueue) {
      setErrors({ step1: "Please select a queue type" });
      return false;
    }
    setErrors({});
    return true;
  };
  
  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.studentId.trim()) {
      newErrors.studentId = "Student ID is required";
    } else if (!/^\d{8}$/.test(formData.studentId)) {
      newErrors.studentId = "Student ID must be exactly 8 digits";
    }
    if (!formData.courseId.trim()) newErrors.course = "Course is required";
    if (!formData.yearLevel.trim()) newErrors.yearLevel = "Year level is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };
  
  const validateStep3 = () => {
    if (selectedServices.length === 0) {
      setErrors({ step3: "Please select at least one service" });
      return false;
    }
    setErrors({});
    return true;
  };
  
  const handleNext = () => {
    let isValid = true;
    
    switch(currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        // Show confirmation modal instead of submitting directly
        setShowConfirmModal(true);
        return;
      default:
        break;
    }
    
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleBack = () => {
    setErrors({});
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    if(currentStep <= 1)    navigate(-1);

  };
  
  // const handleChange = (e) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  //   // Clear error when user starts typing
  //   if (errors[e.target.name]) {
  //     setErrors(prev => ({ ...prev, [e.target.name]: "" }));
  //   }
  // };
    const handleChange = (e) => {
    let value = e.target.value;
    
    // Apply special formatting for student ID - only allow numbers and limit to 8 digits
    if (e.target.name === "studentId") {
      value = value.replace(/\D/g, ''); // Remove non-digit characters
      value = value.slice(0, 8); // Limit to 8 characters
    }
    
    setFormData({ ...formData, [e.target.name]: value });
    
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const toggleService = (service) => {
    // setSelectedServices((prev) =>
    //   prev.includes(serviceLabel)
    //     ? prev.filter((s) => s !== serviceLabel)
    //     : [...prev, serviceLabel]
    // );
    setSelectedServices((prev) =>{
      const exists = prev.some(s=> s.requestTypeId === service.requestTypeId)
      if(exists){
        return prev.filter(s=> s.requestTypeId !== service.requestTypeId)
      }
      return [...prev, {requestTypeId: service.requestTypeId, requestName: service.requestName}]
    })
    // Clear error when user selects a service
    if (errors.step3) {
      setErrors(prev => ({ ...prev, step3: "" }));
    }
  };

  const handleQueueSelect = (queueType) => {
    setSelectedQueue(queueType);
    // Clear error when user selects a queue
    if (errors.step1) {
      setErrors(prev => ({ ...prev, step1: "" }));
    }
  };

  const handleSubmit = () => {
    // Handle form submission here

    try {
      
      // console.log("Form submitted:", {
      //   queueType: selectedQueue,
      //   services: selectedServices,
      //   formData: formData
      // });

      const queueDetails = formatFormData(formData, selectedQueue, selectedServices)
      console.log(queueDetails)
    } catch (error) {
      
    }


    setShowConfirmModal(false);
    
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  const fetchData = async ()=>{
    try {
      const requestTypes = await getRequestType(); 
      if(!requestTypes) throw new Error("Error in Fetching Request Type")
      

      const reqWithIcons = requestTypes.requestType.map(req =>{
        const lower =req.requestName.toLowerCase();
        const rule = iconRules.find(r => r.keywords.some(k=> lower.includes(k)))
        return {...req, icon: rule? rule.icon : "fa-solid fa-question-circle"}
      })
      const courses = await getCourseData();
      if(!courses) throw new Error("Error in Course Data API")

      setRequestType(reqWithIcons)
      setCourseData(courses.courseData)
    } catch (error) {
      showToast(error, "error")
    }

  }

  useEffect (()=>{
    console.log("Remount successfull!")
    fetchData();
  },[])
  // console.log("Course Data: ", courseData)
  console.log("Reques Type: ", requestType)

  const formatFormData=(formdata, queueType, selectedServices) =>{
    try {
    const fullName = formdata.middleName ? `${formdata.lastName}, ${formData.firstName} ${formData.middleName}` 
                    : `${formdata.lastName}, ${formData.firstName}`
    const formattedYear = formData.yearLevel.split(" ")[0];
    return{
      studentId: formData.studentId,
      fullName: fullName,
      courseId : formdata.courseId,
      yearLevel: formattedYear,
      queueType: queueType,
      requests : selectedServices 
    }
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div className="min-h-[90vh] w-full p-4 flex justify-center items-center">
      <motion.div 
        className="w-full md:w-4/5 lg:w-2/3 xl:w-2/4 flex flex-col mt- p-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div 
          className="mb-6 md:mb-8 px-15"
        >
          {currentStep === 1 && (
            <>
              <h1 className="text-2xl md:text-3xl text-left font-bold text-blue-600 mb-2 md:mb-4">
                Join the Queue
              </h1>
              <p className="text-gray-600 text-left text-sm md:text-base mt-1">
                Select the option that best describes your situation.
              </p>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h1 className="text-2xl md:text-3xl text-left font-bold text-blue-600 mb-2">
                Your Information
              </h1>
              <p className="text-gray-600 text-left text-sm md:text-base">
                Please provide your details to generate your queue ticket.
              </p>
            </>
          )}

          {currentStep === 3 && (
            <div>
              <h1 className="text-2xl md:text-3xl text-left font-bold text-blue-600 mb-2">
                Select a Service
              </h1>
              <p className="text-gray-600 text-left text-sm md:text-base">
                What are you here for today?
              </p>
            </div>
          )}

          
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl md:text-3xl text-left font-bold text-[#1A73E8] mb-2">
                Review Your Request
              </h2>
              <p className="text-gray-600 text-left text-sm md:text-base">
                Please confirm your details are correct before joining the queue.
              </p>
            </div>
          )}
        </div>
        
        {/* Step Indicator */}
        <div 
          className="mb-8 md:mb-10"
        >
          <p className="text-sm text-left text-gray-500 mb-2 px-15">
            Step {currentStep} of 4
          </p>
          <div className="flex space-x-2 px-15">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-1.5 rounded-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: step <= currentStep ? "100%" : "0%" }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Queue Options */}
        {currentStep === 1 && (
          <div 
            className="space-y-4 mb-8 md:mb-10"
          
          >
            {errors.step1 && (
              <motion.div 
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
                variants={itemVariants}
              >
                {errors.step1}
              </motion.div>
            )}
            
            {/* Standard Queue */}
            <motion.div
              className={`border rounded-xl p-4 md:p-5 cursor-pointer transition-all duration-200 ${
                selectedQueue === "Standard"
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              } ${errors.step1 ? "border-red-300" : ""}`}
              onClick={() => handleQueueSelect("Regular")}
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start">
                <div
                  className={`flex-shrink-0 w-5 h-5 mt-1 rounded-full border flex items-center justify-center mr-3 md:mr-4 ${
                    selectedQueue === "Regular"
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-400"
                  }`}
                >
                  {selectedQueue === "Regular" && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <h2 className="font-semibold text-gray-800 text-base md:text-lg">
                    Regular Queue                                                                                               
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    For general inquiries and regular services.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Priority Queue */}
            <motion.div
              className={`border rounded-xl p-4 md:p-5 cursor-pointer transition-all duration-200 ${
                selectedQueue === "Priority"
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              } ${errors.step1 ? "border-red-300" : ""}`}
              onClick={() => handleQueueSelect("Priority")}
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start">
                <div
                  className={`flex-shrink-0 w-5 h-5 mt-1 rounded-full border flex items-center justify-center mr-3 md:mr-4 ${
                    selectedQueue === "Priority"
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-400"
                  }`}
                >
                  {selectedQueue === "Priority" && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <h2 className="font-semibold text-gray-800 text-base md:text-lg">
                    Priority Queue
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    For seniors, pregnant individuals, PWD, or urgent needs.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Step 2: Your Information */}
        {currentStep === 2 && (
          <motion.form 
            className="space-y-4 mb-8 bg-white shadow-sm p-10 rounded-2xl md:mb-10 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {Object.keys(errors).length > 0 && (
              <div 
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
             
              >
                Please fill out all required fields
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <label className="block text-sm font-medium text-gray-700">
                  Last name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className={`mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-gray-700">
                  Middle name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="Middle name"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-700">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                className={`mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-700">
                Student ID No. <span className="text-red-500">*</span>
              </label>
              {/* <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="e.g., 23772391"
                className={`mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.studentId ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.studentId && (
                <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
              )} */}
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="e.g., 23772391"
                pattern="[0-9]{8}"
                inputMode="numeric"
                maxLength="8"
                className={`mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.studentId ? "border-red-500" : "border-gray-300"
                }`}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                className={`mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.course ? "border-red-500" : "border-gray-300"
                }`}
                >
                <option value="" disabled>
                  Select your course
                </option>
                {/* <option value="BSIT">BSIT (Bachelor of Science in Information Technology)</option>
                <option value="BSCS">BSCS</option>
                <option value="BSECE">BSECE</option>
                <option value="BSCE">BSCE</option>
                <option value="BSEE">BSEE</option> */}

                {
                  courseData.map(course =>(
                    <option key={course.courseId} value={course.courseId}>
                      {course.courseCode} ({course.courseName})
                    </option>
                  ))
                };
              </select>
              {errors.course && (
                <p className="mt-1 text-sm text-red-600">{errors.course}</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <label className="block text-sm font-medium text-gray-700">
                Year Level <span className="text-red-500">*</span>
              </label>
              <select
                name="yearLevel"
                value={formData.yearLevel}
                onChange={handleChange}
                className={`mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.yearLevel ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="" disabled>
                  Select your year level
                </option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
                <option value="6th Year">6th Year</option>
                <option value="Irregular">Irregular</option>
              </select>

              {errors.yearLevel && (
                <p className="mt-1 text-sm text-red-600">{errors.yearLevel}</p>
              )}
            </motion.div>
          </motion.form>
        )}
        
        {/* Step 3: Multiple Service Selection */}
        {currentStep === 3 && (
          <div 
            className="space-y-6 mb-8 md:mb-10"
        
          >
            {errors.step3 && (
              <div 
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
              >
                {errors.step3}
              </div>
            )}
            
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* [
              { label: "Good Moral Certificate", icon: "fa-solid fa-file" },
              { label: "Insurance Payment", icon: "fa-solid fa-shield-halved" },
              { label: "Approval/Transmittal Letter", icon: "fa-solid fa-pen-to-square" },
              { label: "Temporary Gate Pass", icon: "fa-solid fa-id-badge" },
              { label: "Uniform Exemption", icon: "fa-solid fa-shirt" },
              { label: "Enrollment / Transfer", icon: "fa-solid fa-right-left" },
            ] */}
            {requestType.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y:0 }}
                animate={{ opacity: 1, y: 0}}
                transition={{ 
                  duration: 0.4, 
                  delay: idx * 0.1, // Stagger delay based on index
                  ease: "easeInOut"
                }}
                className={`flex flex-col items-center  justify-center border rounded-xl p-4 md:p-9 cursor-pointer transition-all duration-200 ${
                  selectedServices.some(s=> s.requestTypeId === service.requestTypeId)
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                } ${errors.step3 ? "border-red-300" : ""}`}
                onClick={() => toggleService(service)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <i
                  className={`${service.icon} text-yellow-500 text-2xl md:text-3xl mb-2 md:mb-3`}
                ></i>
                <p className="text-xs md:text-sm font-medium text-gray-700 text-center">
                  {service.requestName}
                </p>
              </motion.div>
            ))}
          </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div 
            className="space-y-6 mb-8 md:mb-10"
       
          >
            {/* Queue Type */}
            <motion.div 
              className="bg-white shadow-sm rounded-xl p-4 md:p-6 text-left border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex justify-between items-center pb-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[#F9AB00] rounded-full mr-3"></div>
                  <h3 className="text-[#F9AB00] font-semibold text-base md:text-lg">Queue Type</h3>
                </div>
                <button
                  className="flex items-center space-x-1 text-[#1A73E8] text-sm font-medium hover:underline cursor-pointer"
                  onClick={() => setCurrentStep(1)}
                >
                  <i className="fa-solid fa-pen text-xs md:text-sm"></i>
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>
              <p className="mt-2 pl-5">
                <span className="text-gray-500 text-sm font-medium">Type:  </span>
                <span className="font-semibold text-gray-800">{selectedQueue} Queue</span>
              </p>
            </motion.div>

            {/* Your Information */}
            <motion.div 
              className="bg-white shadow-sm rounded-xl p-4 md:p-6 text-left border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex justify-between items-center pb-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[#F9AB00] rounded-full mr-3"></div>
                  <h3 className="text-[#F9AB00] font-semibold text-base md:text-lg">Your Information</h3>
                </div>
                <button
                  className="flex items-center space-x-1 text-[#1A73E8] text-sm font-medium hover:underline cursor-pointer"
                  onClick={() => setCurrentStep(2)}
                >
                  <i className="fa-solid fa-pen text-xs md:text-sm"></i>
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4 mt-3 pl-5  justify-center space-x-5">
                <div>
                  <p className="text-gray-500 text-xs md:text-sm font-medium">Name:  <span className="font-semibold text-gray-800 text-sm md:text-base"> 
                     {fullName}
                    </span></p>
                
                </div>

                <div>
                  <p className="text-gray-500 text-xs md:text-sm font-medium">Student ID: <span className="font-semibold text-gray-800 text-sm md:text-base">{formData.studentId}</span></p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs md:text-sm space-x-2 font-medium">
                    Course:
                    <span className="font-semibold text-gray-800 text-sm md:text-base">
                      {(()=>{
                        const selectedCourse = courseData.find(c=> c.courseId === Number(formData.courseId));
                        return selectedCourse
                        ? `${ selectedCourse.courseCode}`
                        : 'N/A'
                      })()}
                    </span> 
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs md:text-sm font-medium">Year Level: <span className="font-semibold text-gray-800 text-sm md:text-base">{formData.yearLevel}</span> </p>
                </div>
              </div>
            </motion.div>

            {/* Service Request */}
            <motion.div 
              className="bg-white shadow-sm rounded-xl p-4 md:p-6 text-left border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="flex justify-between items-center pb-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-[#F9AB00] rounded-full mr-3"></div>
                  <h3 className="text-[#F9AB00] font-semibold text-base md:text-lg">Service Request</h3>
                </div>
                <button
                  className="flex items-center space-x-1 text-[#1A73E8] text-sm font-medium hover:underline cursor-pointer"
                  onClick={() => setCurrentStep(3)}
                >
                  <i className="fa-solid fa-pen text-xs md:text-sm "></i>
                  <span className="hidden sm:inline ">Edit</span>
                </button>
              </div>
              <div className="mt-2 ml-5">
                <p className="text-gray-500 text-sm font-medium">Selected Services</p>
                  <ul className="list-disc list-inside mt-1 text-gray-800 font-semibold text-sm md:text-base">
                    {selectedServices.map((service, index) => (
                      <li key={index} className="flex items-start py-1">
                        <svg className="w-4 h-4 text-[#1A73E8] mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>{service.requestName}</span>
                      </li>
                    ))}
                  </ul>
              </div>
            </motion.div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div 
          className="flex justify-between items-center mt-auto pt-4"

        >
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 md:px-7 py-2 md:py-2.5 rounded-3xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition  text-sm md:text-base cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={(currentStep === 1 && !selectedQueue) || 
                     (currentStep === 3 && selectedServices.length === 0)}
            className={`px-5 md:px-6 py-2 md:py-2.5 rounded-3xl font-medium transition-colors duration-200 text-sm md:text-base ${
              (currentStep === 1 && !selectedQueue) || 
              (currentStep === 3 && selectedServices.length === 0)
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            }`}
       
          >
            {currentStep === 4 ? "Submit Request" : "Continue"}
          </button>
        </div>
        
        {/* {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >

          </motion.div>
        )} */}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 shadow-xl bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-xs border"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Confirm Submission</h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} className="cursor-pointer"/>
                </button>
              </div>
              
              <div className="py-1">
                <p className="text-gray-600 text-center">
                  By confirming, your queue request will be submitted.
                </p>
           
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full font-medium cursor-pointer"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium cursor-pointer"
                >
                  Yes, Submit
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}