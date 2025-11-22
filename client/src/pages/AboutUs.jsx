import React from "react";
import { Shield, Zap, CheckCircle2, Folder, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      when: "beforeChildren",
      staggerChildren: 0.11
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut"
    }
  }
};

const ticketVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "backOut"
    }
  }
};

const floatingTagVariants = {
  hidden: { opacity: 0, scale: 0, rotate: -10 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      delay: i * 0.1 + 0.5,
      duration: 0.5,
      ease: "backOut"
    }
  })
};

const featureVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "backOut"
    }
  },
  // hover: {
  //   scale: 1.1,
  //   rotate: 5,
  //   transition: {
  //     duration: 0.2
  //   }
  // }
};

export default function AboutUs() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const floatingTags = [
    { top: "top-12", left: "-left-4", smTop: "sm:top-17", smLeft: "sm:-left-7", mdTop: "md:top-17", mdLeft: "md:-left-11", text: "Enrollment/Transfer" },
    { top: "top-22", left: "-left-1", smTop: "sm:top-27", smLeft: "sm:-left-1", mdTop: "md:top-28", mdLeft: "md:-left-3", text: "Temporary Gate Pass" },
    { top: "top-32", left: "left-14", smTop: "sm:top-37", smLeft: "sm:left-17", mdTop: "md:top-39", mdLeft: "md:left-18", text: "Uniform Exemption" },
    { top: "-top-7", left: "right-19", smTop: "sm:-top-7", smLeft: "sm:right-23", mdTop: "md:-top-7", mdLeft: "md:right-24", text: "Good Moral" },
    { top: "top-3", left: "-right-3", smTop: "sm:top-3", smLeft: "sm:-right-2", mdTop: "md:top-4", mdLeft: "md:-right-10", xlLeft: "xl:-right-6", text: "Insurance Payment" },
    { top: "top-13", left: "right-0", smTop: "sm:top-13", smLeft: "sm:right-4", mdTop: "md:top-15", mdLeft: "md:-right-4", xlLeft: "xl:-right-0", text: "Transmittal Letter" }
  ];

  const features = [
    { icon: Shield, title: "Secure", description: "Your information stays safe at all times." },
    { icon: Zap, title: "Fast", description: "Get in line and get real-time updates in seconds." },
    { icon: BadgeCheck, title: "Reliable", description: "Always available when you need it." },
    { icon: Folder, title: "Organized", description: "A structured and orderly digital queue for everyone." }
  ];

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="w-full min-h-screen gap-10 flex flex-col xl:flex-row justify-center items-center mt-30 sm:mt-10"
    >
      {/* Left side */}
      <motion.div 
        variants={itemVariants}
        className="w-full lg:w-1/2 flex justify-center xl:ml-35 xl:mr-35 relative mb-12 lg:mb-0"
      >
        {/* Container with scaling */}
        <motion.div
          variants={ticketVariants}
          className="relative flex justify-center w-[380px] sm:w-[450px] md:w-[470px] lg:w-[500px] 
                        transform origin-center scale-90 sm:scale-90 md:scale-100 lg:scale-130 xl:scale-120"
        >
          {/* Main ticket */}
          <motion.div
            variants={ticketVariants}
            className="bg-white w-1/2 shadow-sm border border-[#E2E3E4] rounded-xl 
                          px-8 sm:px-12 py-12 sm:py-16 text-center 
                          text-4xl sm:text-4xl md:text-5xl font-bold text-blue-600"
          >
            P01
          </motion.div>

          {/* Floating tags */}
          {floatingTags.map((tag, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={floatingTagVariants}
              className={`absolute font-semibold ${tag.top} ${tag.left} ${tag.smTop} ${tag.smLeft} ${tag.mdTop} ${tag.mdLeft} ${tag.xlLeft || ''} bg-white shadow-xs rounded-xl 
                            border border-[#E2E3E4] px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs md:text-sm 
                            flex items-center gap-2`}
            >
              <img src="assets/check.svg" alt="" />
              {tag.text}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Right side */}
      <motion.div 
        variants={containerVariants}
        className="w-full sm:pl-20 lg:pl-8 xl:pl-12 text-left sm:mr-15 lg:mt-25 xl:mt-0"
      >
        <motion.h1 
          variants={itemVariants}
          className="text-2xl sm:text-4xl font-medium leading-tight"
        >
          Built to Streamline
        </motion.h1>
        <motion.h1 
          variants={itemVariants}
          className="text-2xl sm:text-4xl font-medium leading-tight mt-2"
        >
          Your Campus Exercise
        </motion.h1>
        <motion.p 
          variants={itemVariants}
          className="mt-4 text-gray-600 text-base text-md sm:text-lg"
        >
          Join thousands of students and staff who use ExeQueue to save time and
          reduce wait times.
        </motion.p>

        {/* Features */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10 sm:mt-18"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={featureVariants}
              custom={index}
              className="gap-4"
            >
              <motion.div 
                variants={iconVariants}
                whileHover="hover"
                className="inline-block bg-[#DDEAFC]/55 p-2 rounded-xl mb-2"
              >
                <feature.icon className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6 mt-1" />
              </motion.div>
              <div>
                <h2 className="font-semibold text-lg sm:text-lg mb-1">{feature.title}</h2>
                <p className="text-gray-600 text-md sm:text-md">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}