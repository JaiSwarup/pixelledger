
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Wallet, Trophy, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Header from '@/components/Header';
import ThreeBackground from '@/components/ThreeBackground';

const ForCreatives = () => {
  const benefits = [
    {
      icon: <Wallet className="w-8 h-8" />,
      title: 'Secure Payments',
      description: 'Get paid instantly via blockchain with transparent escrow and smart contracts'
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Build Reputation',
      description: 'Earn verifiable credentials and build your on-chain reputation score'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Showcase Skills',
      description: 'Display your portfolio and creative work to attract premium clients'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Quality Projects',
      description: 'Access high-quality creative projects from verified clients worldwide'
    }
  ];

  const featuredCreatives = [
    {
      name: 'Sarah Chen',
      avatar: '/placeholder.svg',
      handle: '@sarahdesign',
      specializations: ['UI/UX Design', 'Brand Identity'],
      reputation: 4.9,
      specialty: 'Digital Design'
    },
    {
      name: 'Alex Rivera',
      avatar: '/placeholder.svg',
      handle: '@alexcreative',
      specializations: ['Web Development', 'Frontend'],
      reputation: 4.8,
      specialty: 'Web Development'
    },
    {
      name: 'Maya Johnson',
      avatar: '/placeholder.svg',
      handle: '@mayaarts',
      specializations: ['Graphic Design', 'Illustration'],
      reputation: 5.0,
      specialty: 'Visual Arts'
    },
    {
      name: 'David Park',
      avatar: '/placeholder.svg',
      handle: '@davidvideo',
      specializations: ['Video Production', 'Animation'],
      reputation: 4.7,
      specialty: 'Motion Graphics'
    }
  ];

  const stats = [
    { label: 'Average Project Value', value: '$2,800', color: 'text-cyber-teal' },
    { label: 'Monthly Projects', value: '35+', color: 'text-cyber-pink' },
    { label: 'Fastest Payout', value: '2hrs', color: 'text-purple-400' },
    { label: 'Success Rate', value: '96%', color: 'text-blue-400' },
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
              <span className="text-white">Showcase Your</span><br />
              <span className="cyber-text-gradient text-cyber-glow">Creativity</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Turn your passion into profit. Partner with leading clients, build your creative reputation, and get paid what you&apos;re worth.
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
              Creative <span className="cyber-text-gradient">Benefits</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the future of creative services with blockchain-powered transparency and instant payments
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

        {/* Featured Creatives */}
        <section className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6">
              Featured <span className="cyber-text-gradient">Creatives</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join successful creatives who are already building their reputation and earning on PixelLedger
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCreatives.map((creative, index) => (
              <motion.div
                key={creative.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="neuro-card group hover:shadow-cyber-glow transition-all duration-300">
                  <CardHeader className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={creative.avatar} />
                      <AvatarFallback className="bg-cyber-gradient text-cyber-black font-bold text-lg">
                        {creative.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg font-orbitron group-hover:cyber-text-gradient transition-all duration-300">
                      {creative.name}
                    </CardTitle>
                    <CardDescription className="text-cyber-teal font-medium">
                      {creative.handle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                      <span>{creative.specializations.join(', ')}</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span>{creative.reputation}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{creative.specialty}</p>
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
              Ready to <span className="cyber-text-gradient">Get Started?</span>
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of creatives already earning and building their reputation in the decentralized creative economy.
            </p>
            <Link to="/login">
              <Button size="lg" className="cyber-button text-lg px-12 py-4">
                Start Creating Today
              </Button>
            </Link>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default ForCreatives;
