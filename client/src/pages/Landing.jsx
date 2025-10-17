import { faClipboardList, faUserCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Request from "./students/Request";
import { Link } from "react-router-dom";
import AboutUs from "./AboutUs";
import Help from "./Help";
import FAQs from "./FAQs";
import Contact from "./Contact";
import Home from "./Home";

export default function Landing() {
  return (
    <div className="min-h-screen w-full  flex flex-col items-center  px-4 sm:px-6 md:px-8 relative overflow-hidden py-8">
      <section id="home" className="  ">
        <Home />
      </section>

      {/* About Us Section */}
      <section
        id="about"
        className="min-h-screen flex items-center justify-center "
      >
        <AboutUs />
      </section>

      {/* Help Section */}
      <section
        id="help"
        className="min-h-[80vh] flex items-center justify-center "
      >
        <Help />
      </section>
      <section
        id="faq"
        className="min-h-[80vh] flex items-center justify-center"
      >
        <FAQs />
      </section>
      <section
        id="faq"
        className="min-h-[50vh] flex items-center justify-center"
      >
        <Contact />
      </section>
    </div>
  );
}
