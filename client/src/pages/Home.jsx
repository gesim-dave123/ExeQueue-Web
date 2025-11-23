import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const buttonVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2
    }
  },
  tap: {
    scale: 0.95
  }
};

const gradientVariants = {
  hidden: { backgroundPosition: "0% 50%" },
  visible: {
    backgroundPosition: "100% 50%",
    transition: {
      duration: 3,
      ease: "linear",
      repeat: Infinity,
      repeatType: "reverse"
    }
  }
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRedirect = (destination) => {
    setLoading(true);
    // setTimeout(() => {
    //   setLoading(false);
    //   navigate(destination);
    // }, 2000);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full flex flex-col justify-center max-w-4xl text-center md:text-left space-y-4 rounded-2xl relative z-10 min-h-[80vh]"
    >
      {/* Heading with improved gradient and animation */}
      <motion.div 
        variants={itemVariants}
        className="space-y-6 w-full pt-10 sm:pt-0 text-center mb-10"
      >
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 leading-tight">
          <motion.span 
            variants={gradientVariants}
            initial="hidden"
            animate="visible"
            className="bg-gradient-to-r from-[#1A73E8] via-[#F9AB00] to-[#1A73E8] bg-clip-text text-transparent bg-size-200"
            style={{
              backgroundSize: "200% 100%"
            }}
          >
            Student
          </motion.span>{" "}
          Services, Simplified
        </h1>
      </motion.div>

      {/* Subtitle with improved styling */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <p className="text-sm sm:text-lg text-center mb-2 text-gray-700 max-w-2xl mx-auto md:mx-0 leading-relaxed font-medium">
          Your campus services,&nbsp;
          <br className="block sm:hidden" />
          now more accessible than ever.
        </p>
      </motion.div>

      {/* Buttons with improved styling and icons */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-row mb-4 gap-5 justify-center"
      >
        {/* Proceed as Staff */}
        <Link to="/staff/login">
          <motion.button
            variants={buttonVariants}
            className="group border border-gray-400 hover:bg-[#1A73E8] w-full hover:text-white font-semibold py-3 px-3 sm:py-5 sm:px-6 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg flex items-center justify-center gap-1 sm:gap-2 cursor-pointer text-xs sm:text-md"
          >
            {/* Default (visible when not hovered) */}
            <img
              src="/assets/User - V1.png"
              alt="user"
              className="w-6 h-6 block group-hover:hidden"
            />

            {/* Hovered (visible on hover only) */}
            <img
              src="/assets/userWhite.png"
              alt="user white"
              className="w-6 h-6 hidden group-hover:block"
            />
            <span>Proceed as Staff</span>
          </motion.button>
        </Link>

        {/* Request Service */}
        <Link to="/student/queue/request">
          <motion.button 
            variants={buttonVariants}
            className="bg-[#1A73E8] hover:bg-[#1557B0] w-full text-white font-semibold py-3 px-4 sm:py-5 sm:px-6 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer text-xs md:text-md"
          >
            <img
              src="/assets/dashboard icons.png"
              alt="search"
              className="w-6 h-6"
            />
            <span className="">Request Service</span>
          </motion.button>
        </Link>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="items-center mb-8 text-center text-gray-500 text-sm sm:text-base"
      >
        <p>
          Already have a queue number?{" "}
          <Link to="/student/queue/search">
            <span>
              <motion.button
                className="cursor-pointer underline text-[#1A73E8] hover:text-blue-700 transition-colors"
                onClick={() => handleRedirect("/student/queue/search")}
              >
                Search Queue
              </motion.button>
            </span>
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}