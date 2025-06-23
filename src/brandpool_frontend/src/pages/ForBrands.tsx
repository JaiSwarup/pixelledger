
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Shield, BarChart3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import ThreeBackground from '@/components/ThreeBackground';

const ForBrands = () => {
  const benefits = [
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Targeted Reach',
      description: 'Connect with influencers who align with your brand values and target demographics'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure Payments',
      description: 'Blockchain-secured escrow ensures safe transactions and transparent payment processes'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Performance Analytics',
      description: 'Real-time campaign tracking with detailed engagement metrics and ROI analysis'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Verified Creators',
      description: 'Access to a curated network of verified influencers with reputation scores'
    }
  ];

  const stats = [
    { label: 'Average ROI', value: '340%', color: 'text-cyber-teal' },
    { label: 'Campaign Success Rate', value: '94%', color: 'text-cyber-pink' },
    { label: 'Time to Launch', value: '24hrs', color: 'text-purple-400' },
    { label: 'Verified Creators', value: '12K+', color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen relative">
      <ThreeBackground />
      <Header />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-orbitron font-black mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-white">Amplify Your</span><br />
              <span className="cyber-text-gradient text-cyber-glow">Brand Story</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Partner with authentic creators in the decentralized web. Launch campaigns that resonate, engage audiences, and deliver measurable results.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link to="/login">
                <Button size="lg" className="cyber-button text-lg px-8 py-4 group">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-4 border-2 border-cyber-teal text-cyber-teal hover:bg-cyber-teal hover:text-cyber-black transition-all duration-300"
                >
                  Sign In
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <div className={`text-3xl md:text-4xl font-orbitron font-bold ${stat.color} mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6">
              Why <span className="cyber-text-gradient">Brands Choose Us</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the future of influencer marketing with blockchain-powered transparency and security
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -10 }}
              >
                <Card className="neuro-card h-full group hover:shadow-cyber-glow transition-all duration-300">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-cyber-gradient flex items-center justify-center text-cyber-black group-hover:animate-pulse-glow">
                      {benefit.icon}
                    </div>
                    <CardTitle className="text-xl font-orbitron group-hover:cyber-text-gradient transition-all duration-300">
                      {benefit.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-300 text-center">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="neuro-card p-12 text-center bg-gradient-to-r from-cyber-teal/10 to-cyber-pink/10"
          >
            <h3 className="text-3xl md:text-4xl font-orbitron font-bold mb-6">
              Ready to <span className="cyber-text-gradient">Launch?</span>
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join leading brands already using ChainFluence to create authentic connections with their audience.
            </p>
            <Link to="/create-campaign">
              <Button size="lg" className="cyber-button text-lg px-12 py-4">
                Start Your First Campaign
              </Button>
            </Link>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default ForBrands;
