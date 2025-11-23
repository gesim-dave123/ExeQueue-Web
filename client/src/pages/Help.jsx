import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: "easeOut"
    }
  }
};

const stepVariants = {
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

const numberVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "backOut"
    }
  }
};

export default function Help() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="w-full min-h-screen flex justify-center xl:mt-10 items-center"
    >
      <div className="flex flex-col xl:flex-row bg-[#DDEAFC]/55 gap-0 xl:gap-13 mt-15 xl:mt-5 rounded-2xl justify-start items-baseline">
        {/* Left side */}
        <motion.div 
          variants={itemVariants}
          className="w-full py-10 px-5 sm:px-0 md:py-10 xl:py-0 md:w-full xl:w-[40%] flex flex-col text-center xl:text-start xl:ml-10 2xl:ml-20"
        >
          <h1 className="text-2xl sm:text-4xl md:text-4xl lg:text-4xl xl:text-4xl 2xl:text-5xl font-semibold text-gray-900 leading-tight">
            How Does it Work?
          </h1>
          <motion.p 
            variants={itemVariants}
            className="mt-4 text-md sm:text-xl md:text-xl lg:text-xl xl:text-xl text-gray-700"
          >
            No lines, no stress—just follow these steps.
          </motion.p>
        </motion.div>

        {/* Right side - single column for mobile AND iPad Pro, two columns only on xl screens (large PC) */}
        <motion.div 
          variants={containerVariants}
          className="w-full md:w-full xl:w-1/2 xl:min-h-[80vh] grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 xl:mr-5 2xl:mr-20 p-5 pb-10 sm:p-10 xl:p-0 xl:pt-20 2xl:pt-25"
        >
          {/* Step 1 */}
          <motion.div 
            variants={stepVariants}
            className="flex items-start gap-4 xl:gap-5"
          >
            <motion.span 
              variants={numberVariants}
              className="text-4xl md:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-amber-500 min-w-[40px] xl:min-w-[50px]"
            >
              1
            </motion.span>
            <motion.p 
              variants={itemVariants}
              className="text-base md:text-lg xl:text-base 2xl:text-xl text-start font-light pt-2 xl:pt-2"
            >
              Choose your queue type — Priority (for PWDs, seniors, etc.) or
              Standard for regular requests.
            </motion.p>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            variants={stepVariants}
            className="flex items-start gap-4 xl:gap-5"
          >
            <motion.span 
              variants={numberVariants}
              className="text-4xl md:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-amber-500 min-w-[40px] xl:min-w-[50px]"
            >
              2
            </motion.span>
            <motion.p 
              variants={itemVariants}
              className="text-base md:text-lg xl:text-base 2xl:text-xl text-start font-light pt-2 xl:pt-2"
            >
              Fill in your details like Full name, Student ID number, Course, and Year Level.
            </motion.p>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            variants={stepVariants}
            className="flex items-start gap-4 xl:gap-5"
          >
            <motion.span 
              variants={numberVariants}
              className="text-4xl md:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-amber-500 min-w-[40px] xl:min-w-[50px]"
            >
              3
            </motion.span>
            <motion.p 
              variants={itemVariants}
              className="text-base md:text-lg xl:text-base 2xl:text-xl text-start font-light pt-2 xl:pt-2"
            >
              Select the service you need, such as Good Moral Certificate,
              Insurance Payment, Gate Pass, and more.
            </motion.p>
          </motion.div>

          {/* Step 4 */}
          <motion.div 
            variants={stepVariants}
            className="flex items-start gap-4 xl:gap-5"
          >
            <motion.span 
              variants={numberVariants}
              className="text-4xl md:text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-amber-500 min-w-[40px] xl:min-w-[50px]"
            >
              4
            </motion.span>
            <motion.p 
              variants={itemVariants}
              className="text-base md:text-lg xl:text-base 2xl:text-xl text-start font-light pt-2 xl:pt-2"
            >
              Review your information and confirm to get your queue number.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}