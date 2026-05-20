import Hero from "../components/Hero";
import Cards from "../components/Cards";
import HowItWorks from "../components/HowItWorks";
import StatsSection from "../components/StatsSection";
import FAQSection from "../components/FAQSection";
import Footer from "../components/footer";
import Testimonials from "../components/Testimonials";
function Home() {
  return (
    <>
      <Hero />
      <Cards />
      <HowItWorks />
      <div className="stats-section">

  <div className="stat-card">
    <h2>1200+</h2>
    <p>Complaints Raised</p>
  </div>

  <div className="stat-card">
    <h2>95%</h2>
    <p>Resolved Successfully</p>
  </div>

  <div className="stat-card">
    <h2>24 hrs</h2>
    <p>Average Resolution</p>
  </div>

</div>
<Testimonials />  
      <FAQSection />
      <Footer />
    </>
  );
}

export default Home;