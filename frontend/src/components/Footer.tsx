import { Shield, Heart } from "lucide-react";
const Footer = () => {
  return <footer className="bg-foreground/5 border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">SecureVision</span>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>© 2025 SecureVision. Made with</span>
            <Heart className="w-4 h-4 text-primary" />
            <span>for privacy protection.</span>
          </div>

          {/* Privacy Links */}
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
              Privacy Policy
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
              Terms of Service
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-smooth">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;