import Navbar from "@/components/ui/Navbar";
import HeroSection from "@/components/ui/HeroSection";
import SolutionsSection from "@/components/ui/SolutionsSection";
import DashboardSection from "@/components/ui/DashboardSection";
import VisaCardSection from "@/components/ui/VisaCardSection";
import GiftCardsSection from "@/components/ui/GiftCardsSection";
import TokenizationSection from "@/components/ui/TokenizationSection";
import FaqSection from "@/components/ui/FaqSection";
import Footer from "@/components/ui/Footer";
import { ScrollAnimationProvider, CinematicTransition } from "@/lib/scroll-animations";

export default function Home() {
  return (
    <ScrollAnimationProvider>
      <main className="relative bg-[#07080f]">
        <Navbar />
        <HeroSection />
        <CinematicTransition
          fromColor="rgba(7,8,15,0.6)"
          toColor="rgba(7,8,15,0.3)"
          glowColor="rgba(108,99,255,0.03)"
        />
        <SolutionsSection />
        <CinematicTransition
          fromColor="rgba(7,8,15,0.3)"
          toColor="rgba(7,8,15,0.4)"
          glowColor="rgba(59,130,246,0.025)"
        />
        <DashboardSection />
        <CinematicTransition
          fromColor="rgba(7,8,15,0.4)"
          toColor="rgba(7,8,15,0.2)"
          glowColor="rgba(139,92,246,0.03)"
        />
        <VisaCardSection />
        <CinematicTransition
          fromColor="rgba(7,8,15,0.2)"
          toColor="rgba(7,8,15,0.3)"
          glowColor="rgba(247,147,26,0.025)"
        />
        <GiftCardsSection />
        <CinematicTransition
          fromColor="rgba(7,8,15,0.3)"
          toColor="rgba(7,8,15,0.2)"
          glowColor="rgba(6,182,212,0.025)"
        />
        <TokenizationSection />
        <CinematicTransition
          fromColor="rgba(7,8,15,0.2)"
          toColor="rgba(7,8,15,0.3)"
          glowColor="rgba(108,99,255,0.025)"
        />
        <FaqSection />
        <CinematicTransition
          fromColor="rgba(7,8,15,0.3)"
          toColor="rgba(7,8,15,0.4)"
          glowColor="rgba(108,99,255,0.02)"
        />
        <Footer />
      </main>
    </ScrollAnimationProvider>
  );
}
