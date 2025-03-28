
import Navbar from "@/components/landing-page/Navbar";
import HeroSection from "@/components/landing-page/HeroSection";
import FeaturesSection from "@/components/landing-page/FeaturesSection";
import HowItWorksSection from "@/components/landing-page/HowItWorksSection";
import UseCasesSection from "@/components/landing-page/UseCasesSection";
import TestimonialsSection from "@/components/landing-page/TestimonialsSection";
import CtaSection from "@/components/landing-page/CtaSection";
import FaqSection from "@/components/landing-page/FaqSection";
import Footer from "@/components/landing-page/Footer";
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
const Index = async () => {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />
      <main className="relative z-10">
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="how-it-works">
          <HowItWorksSection />
        </div>
        <div id="use-cases">
          <UseCasesSection />
        </div>
        <div id="testimonials">
          <TestimonialsSection />
        </div>
        <div id="cta">
          <CtaSection />
        </div>
        <div id="faq">
          <FaqSection />
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Index;
