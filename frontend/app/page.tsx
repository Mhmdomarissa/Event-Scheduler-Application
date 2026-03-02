import { Hero } from "@/components/landing/Hero";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeatureCards />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}


