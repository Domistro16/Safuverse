import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link as LinkIcon } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

const CTASection = () => {
  return (
    <section
      id="about"
      className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-tr from-purple-950/50 via-background to-cyan-950/30 relative overflow-hidden"
    >
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full filter blur-3xl opacity-50 animate-pulse animation-delay-2000"></div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6">
            Ready to{" "}
            <span className="primary-gradient-text">Ignite Your Journey</span>?
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            The future of content creation is decentralized, AI-powered, and
            community-driven. Join SafuAcademy, mint your{" "}
            <code className="text-primary font-bold p-1.5 rounded-md bg-primary/10 shadow-sm">
              .safu
            </code>{" "}
            domain, and step into your power.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <RouterLink to="/mint-creator-domain">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-background font-semibold text-lg px-10 py-5 rounded-xl shadow-xl hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105 neon-glow"
              >
                <LinkIcon className="w-6 h-6 mr-3" />
                Mint Your .safu Domain
              </Button>
            </RouterLink>
            <RouterLink to="/courses">
              <Button
                size="lg"
                variant="outline"
                className="border-primary/70 text-primary hover:bg-primary/10 hover:border-primary text-lg px-10 py-5 rounded-xl transition-all duration-300 transform hover:scale-105 group"
              >
                Explore Courses{" "}
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1.5 transition-transform" />
              </Button>
            </RouterLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
