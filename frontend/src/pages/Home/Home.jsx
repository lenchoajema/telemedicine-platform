import { useAuth } from '../../contexts/AuthContext';
import Hero from '../../components/layout/Hero';
import Features from '../../components/layout/Features';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <Hero 
        title="Virtual Healthcare When You Need It"
        subtitle="Connect with board-certified doctors in minutes"
        cta={!user && "Get Started"}
      />
      
      <Features features={[
        {
          icon: 'videocam',
          title: 'Video Consultations',
          description: 'HD quality video calls with specialists'
        },
        // More features...
      ]} />
    </div>
  );
}