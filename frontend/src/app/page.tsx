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
          fromColor="rgba(7,8,15,0.8)"
          toColor="rgba(248,249,251,0.8)"
          glowColor="rgba(108,99,255,0.03)"
        />
        <div className="bg-[#f8f9fb]">
        <SolutionsSection />
        <DashboardSection />
        </div>
        {/* Light → Dark transition (Dashboard → VisaCard) */}
        <div className="relative w-full h-[200px] leading-[0]">
          <img src="/images/section-transition.png" alt="" className="absolute inset-0 w-full h-full object-fill" />
        </div>
        <VisaCardSection />
        <GiftCardsSection />
        {/* Dark → Light transition (GiftCards → Tokenization) — inverted */}
        <div className="relative w-full h-[200px] leading-[0] -scale-y-100">
          <img src="/images/section-transition.png" alt="" className="absolute inset-0 w-full h-full object-fill" />
        </div>
        <TokenizationSection />
        <CinematicTransition
          fromColor="rgba(248,249,251,0.8)"
          toColor="rgba(7,8,15,0.8)"
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
