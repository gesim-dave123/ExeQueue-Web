export default function Help() {
  return (
    <div className="w-full flex justify-center mt-20 items-center">
      <div className="flex flex-col bg-[#DDEAFC]/55 sm:mx-10 md:mx-20 rounded-2xl lg:flex-row justify-start items-start md:justify-center md:items-center p-10 sm:p-0">

        {/* Left side - keeping your original height structure */}
        <div className="w-full py-10 md:w-[60vh] lg:w-[40%] flex flex-col md:text-center lg:text-start lg:ml-10 mb-10 xl:ml-20 2xl:mb-70">
          <h1 className="text-3xl sm:text-2xl md:text-4xl lg:text-4xl xl:text-3xl 2xl:text-5xl sm:mt-20 md:mt-0 font-semibold text-gray-900 leading-tight">
            How Does it Work?
          </h1>
          <p className="mt-4 text-sm sm:text-xl lg:text-2xl xl:text-lg text-gray-700">
            No lines, no stress—just follow these steps.
          </p>
        </div>

        {/* Right side - maintaining your exact height structure */}
        <div className="w-full md:w-[60vh] lg:w-1/2 lg:h-[80vh] grid-full grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-8 lg:mr-5 xl:mr-20 sm:p-10 md:pt-0 lg:pt-20 xl:pt-40">
          
          {/* Step 1 */}
          <div className="flex items-start gap-5">
            <span className="text-4xl 2xl:text-6xl font-extrabold text-amber-500 min-w-[50px]">1</span>
            <p className="text-base sm:text-lg md:text-xl lg:text-sm xl:text-base 2xl:text-xl text-start font-light pt-2">
              Choose your queue type — Priority (for PWDs, seniors, etc.) or Standard for regular requests.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-5">
            <span className="text-4xl 2xl:text-6xl font-extrabold text-amber-500 min-w-[50px]">2</span>
            <p className="text-base sm:text-lg md:text-xl lg:text-sm xl:text-base 2xl:text-xl text-start font-light pt-2">
              Fill in your details like name, ID number, and contact information.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-5">
            <span className="text-4xl 2xl:text-6xl font-extrabold text-amber-500 min-w-[50px]">3</span>
            <p className="text-base sm:text-lg md:text-xl lg:text-sm xl:text-base 2xl:text-xl text-start font-light pt-2">
              Select the service you need, such as Good Moral Certificate, Insurance Payment, Gate Pass, and more.
            </p>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-5">
            <span className="text-4xl 2xl:text-6xl font-extrabold text-amber-500 min-w-[50px]">4</span>
            <p className="text-base sm:text-lg md:text-xl lg:text-sm xl:text-base 2xl:text-xl text-start font-light pt-2">
              Review your information and confirm to get your queue number.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}