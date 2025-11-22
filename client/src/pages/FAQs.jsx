import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

// Simplified animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.08 // Reduced stagger
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 }, // Reduced movement
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3, // Faster duration
      ease: "easeOut"
    }
  }
};

const categoryButtonVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  }
};

// REMOVED complex accordion variants - using simple CSS transitions instead

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("General Process");
  const [openIndex, setOpenIndex] = useState(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const categories = [
    "General Process",
    "Tracking & Issues",
    "Queue Types and Priority",
    "Service Information",
  ];

  const faqs = {
    "General Process": [
      {
        q: "How do I get a queue number?",
        a: "Select your desired service, choose your queue type (Regular or Priority), fill in your details (Name, ID Number, Course, Year Level), and submit. Your unique queue number will be displayed on the screen.",
      },
      {
        q: "What information do I need to provide?",
        a: "You only need to provide your Full Name, Student Identification Number, Course, and Year Level.",
      },
      {
        q: "What do I do after I get my queue number?",
        a: "Please wait in the waiting area. Monitor the screen for the currently serving numbers. Your number will be called when it's your turn.",
      },
    ],
    "Tracking & Issues": [
      {
        q: " I forgot my queue number. What should I do?",
        a: "Use the \"Search Queue\" feature on the main page. Enter your Student ID number or Queue Reference number to retrieve your queue ticket and its current status. ",
      },
      {
        q: "What does it mean if my queue status is 'Skipped'?",
        a: "It means your number was called multiple times, but you did not respond. You have one hour to approach the counter to have your status updated and be served. After one hour, it will be automatically cancelled.  ",
      },
      {
        q: "What if I need to leave? Can I get back in line?",
        a: "If you leave, your number may be marked as Skipped and eventually Cancelled. You will likely need to get a new queue number upon your return.",
      },
    ],
    "Queue Types and Priority": [
      {
        q: "What is a Priority Queue number?",
        a: "A Priority Queue number is for persons with disabilities (PWD), pregnant women, and senior citizens. It ensures you are served faster to reduce waiting time.",
      },
      {
        q: "How do I select a Priority Queue?",
        a: "On the service selection page, choose the \"Priority\" option before submitting your details.",
      },
      {
        q: "Can I select multiple services at once?",
        a: "Yes. You can select multiple requests (e.g., Good Moral Certificate and Insurance Payment) in a single transaction. You will receive one queue number for the combined request.",
      },
    ],
    "Service Information": [
      {
        q: "What services can I request through the QMS?",
        a: "You can request: Good Moral Certificate, Insurance Payment, Submission of Approval/Transmittal Letter, Temporary Gate Pass, Uniform Exemption, and Enrollment/Transfer matters.",
      },
      {
        q: "Where can I learn more about what this system does?",
        a: "Please visit the \"About\" page for information on the system's purpose and functions.",
      },
    ],
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setOpenIndex(null);
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="w-full mt-25 sm:mt-0 flex items-center flex-col xl:flex-row lg:gap-16"
    >
      {/* Left side: Categories */}
      <motion.div 
        variants={containerVariants}
        className="w-full xl:w-4xl flex flex-col gap-4 mb-8 lg:mb-0"
      >
        <motion.h2 
          variants={itemVariants}
          className="text-3xl sm:text-4xl lg:text-4xl text-left font-semibold text-gray-900 mb-2"
        >
          Frequently Asked Questions
        </motion.h2>
        <motion.p 
          variants={itemVariants}
          className="text-gray-500 text-lg sm:text-xl lg:text-xl mb-6 text-left"
        >
          All you need to know in one place.
        </motion.p>

        <motion.div 
          variants={containerVariants}
          className="flex flex-col gap-4"
        >
          {/* Top row with 2 buttons only */}
          <div className="flex gap-4">
            {categories.slice(0, 2).map((cat, index) => (
              <motion.button
                key={cat}
                variants={categoryButtonVariants}
                custom={index}
                onClick={() => handleCategoryChange(cat)}
                className={`p-4 sm:w-50 rounded-full border text-sm font-medium transition-all cursor-pointer
                ${
                  activeCategory === cat
                    ? "bg-[#1A73E8] text-white"
                    : "border-blue-400 text-[#1A73E8] hover:bg-blue-50"
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* Remaining buttons go below */}
          <div className="flex flex-wrap gap-5">
            {categories.slice(2).map((cat, index) => (
              <motion.button
                key={cat}
                variants={categoryButtonVariants}
                custom={index + 2}
                onClick={() => handleCategoryChange(cat)}
                className={`p-4 sm:w-65 rounded-full border text-sm font-medium transition-all cursor-pointer
                ${
                  activeCategory === cat
                    ? "bg-[#1A73E8] text-white"
                    : "border-blue-400 text-[#1A73E8] hover:bg-blue-50"
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Right side: Accordion - SIMPLIFIED ANIMATIONS */}
      <motion.div 
        variants={containerVariants}
        className="w-full xl:w-3xl flex flex-col justify-center"
      >
        <div className="flex flex-col gap-4">
          {faqs[activeCategory].map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-[#DDEAFC]/35 rounded-xl shadow-xs overflow-hidden w-full cursor-pointer"
            >
              <button
                className="w-full flex justify-between items-center px-4 sm:px-6 py-4 text-left cursor-pointer hover:bg-[#DDEAFC]/50 transition-colors"
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-medium text-gray-800 pr-4 text-sm sm:text-base">
                  {item.q}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-[#F9AB00] flex-shrink-0" />
                </motion.div>
              </button>

              {/* Simplified accordion content - using CSS transition instead of Framer Motion */}
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-4 text-gray-600 text-sm text-left leading-relaxed max-w-4xl">
                  {item.a}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}