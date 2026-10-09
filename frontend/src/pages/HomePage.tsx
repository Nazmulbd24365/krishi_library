import { usePageTitle } from '@/components/PageHeader';
import { HeroSlider } from '@/components/home/HeroSlider';
import { StatCounters } from '@/components/home/StatCounters';
import { AboutSection } from '@/components/home/AboutSection';
import { FounderSection } from '@/components/home/FounderSection';
import { MissionVision } from '@/components/home/MissionVision';
import { Testimonials } from '@/components/home/Testimonials';
import { WeatherOverview } from '@/components/home/WeatherOverview';

export default function HomePage() {
  usePageTitle('হোম | Home');
  return (
    <>
      <HeroSlider />
      <StatCounters />
      <AboutSection />
      <FounderSection />
      <MissionVision />
      <Testimonials />
      <WeatherOverview />
    </>
  );
}
