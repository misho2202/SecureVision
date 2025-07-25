import { Shield, Users, Lock, CheckCircle } from "lucide-react";
const AboutSection = () => {
  return <section id="about" className="py-20 bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Your Privacy is Our
            <span className="block gradient-secondary bg-clip-text text-transparent">
              Top Priority
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            At SecureVision, we believe that protecting your personal data should be seamless and automatic. 
            Our mission is to secure our users' data and ensure your privacy remains intact in every digital interaction.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Data Protection */}
          

          {/* User First */}
          

          {/* Secure Technology */}
          
        </div>

        {/* Core Values */}
        <div className="mt-16 bg-card rounded-3xl p-8 lg:p-12 shadow-medium">
          <h3 className="text-2xl font-bold text-card-foreground mb-8 text-center">
            Our Commitment to You
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-card-foreground mb-2">No Data Collection</h4>
                <p className="text-muted-foreground">We don't collect, store, or sell your personal information. Your data remains yours.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-card-foreground mb-2">Transparent Operations</h4>
                <p className="text-muted-foreground">Open about our processes and committed to maintaining your trust through transparency.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-card-foreground mb-2">Continuous Security</h4>
                <p className="text-muted-foreground">Regular security updates and monitoring to keep your information protected.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-card-foreground mb-2">User Control</h4>
                <p className="text-muted-foreground">You decide what to protect and how. Full control over your privacy settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default AboutSection;