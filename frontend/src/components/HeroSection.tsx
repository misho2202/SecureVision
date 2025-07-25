import { Button } from "@/components/ui/button";
import { Shield, Eye, Lock } from "lucide-react";
import heroImage from "@/assets/hero-security.jpg";

const HeroSection = () => {
  const scrollToStart = () => {
    const element = document.getElementById('start');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center pt-20">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="fade-in">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-primary font-semibold">Protect Your Digital Privacy</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Secure Your
              <span className="block gradient-primary bg-clip-text text-transparent">
                Digital Presence
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              SecureVision automatically detects and protects sensitive information in your media before you share it. Keep your privacy intact while staying connected.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button variant="hero" onClick={scrollToStart}>
                Get Started
              </Button>
              <Button variant="outline" className="text-lg px-8 py-4">
                Learn More
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">AI Detection</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-sm font-medium text-foreground">Auto Protection</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <span className="text-sm font-medium text-foreground">Privacy First</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="slide-up lg:order-last">
            <div className="relative">
              <div className="absolute inset-0 gradient-primary opacity-20 rounded-3xl blur-3xl"></div>
              <img 
                src={heroImage} 
                alt="SecureVision Privacy Protection" 
                className="relative w-full h-auto rounded-3xl shadow-medium transition-spring hover:shadow-glow"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;