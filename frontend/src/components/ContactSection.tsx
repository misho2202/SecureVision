import { Mail, MessageSquare, Twitter, Github, Linkedin, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
const ContactSection = () => {
  return <section id="contact" className="py-20 bg-gradient-to-br from-muted/30 to-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Get in
            <span className="block gradient-primary bg-clip-text text-transparent">
              Touch
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Have questions about SecureVision? We're here to help you protect your digital privacy.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-foreground mb-8">Contact Information</h3>
              
              {/* Customer Service */}
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Customer Service
                </h4>
                <div className="space-y-3 ml-7">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">support@securevision.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Live Chat Available 24/7</span>
                  </div>
                </div>
              </div>

              {/* Office */}
              <div className="space-y-4 pt-6">
                <h4 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Office Location
                </h4>
                <div className="ml-7">
                  <p className="text-muted-foreground">
                    123 Privacy Street<br />
                    Tech District, CA 94105<br />
                    United States
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media & Support */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-foreground mb-8">Connect With Us</h3>
              
              {/* Social Media */}
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-foreground">Follow Us</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start gap-3 h-auto py-4">
                    <Twitter className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Twitter</div>
                      <div className="text-sm text-muted-foreground">@SecureVision</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start gap-3 h-auto py-4">
                    <Linkedin className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">LinkedIn</div>
                      <div className="text-sm text-muted-foreground">SecureVision Inc</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start gap-3 h-auto py-4">
                    <Github className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">GitHub</div>
                      <div className="text-sm text-muted-foreground">SecureVision</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start gap-3 h-auto py-4">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Discord</div>
                      <div className="text-sm text-muted-foreground">Community Chat</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-8">
                <h4 className="text-lg font-medium text-foreground mb-4">Quick Support</h4>
                <div className="space-y-3">
                  <Button variant="default" className="w-full justify-start gap-3">
                    <Mail className="w-5 h-5" />
                    Send us an Email
                  </Button>
                  <Button variant="secondary" className="w-full justify-start gap-3">
                    <MessageSquare className="w-5 h-5" />
                    Start Live Chat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          
        </div>
      </div>
    </section>;
};
export default ContactSection;