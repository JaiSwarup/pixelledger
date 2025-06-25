import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Settings, Users, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBackendActor } from '../hooks/useBackendActor';
import { toast } from 'sonner';

export function EscrowDemo() {
  const { principal } = useAuth();
  const { backendActor } = useBackendActor();
  const [isRunning, setIsRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const demoSteps = [
    { title: "Add Test Balance", description: "Add 50,000 tokens to your account" },
    { title: "Create Demo Project", description: "Create a sample project worth 10,000 tokens" },
    { title: "Deposit to Escrow", description: "Deposit project budget to escrow" },
    { title: "Simulate Application", description: "Show how creatives would apply" },
    { title: "Demo Complete", description: "Ready to test escrow management!" }
  ];

  const runDemo = async () => {
    if (!principal) {
      toast.error('Please login first');
      return;
    }

    setIsRunning(true);
    setDemoStep(1);

    try {
      // Step 1: Add test balance
      toast.info('Step 1: Adding test balance...');
      const balanceResult = await backendActor.addUserBalance(principal, BigInt(50000));
      if ('ok' in balanceResult) {
        toast.success('✅ Added 50,000 test tokens');
        setDemoStep(2);
        
        // Step 2: Check if user is registered and can create projects
        const canCreate = await backendActor.canCreateProjects(principal);
        if (canCreate) {
          toast.info('Step 2: Creating demo project...');
          const projectResult = await backendActor.createProject({
            title: "Demo Marketing Campaign",
            description: "A sample project to demonstrate the escrow system. Create engaging social media content for our brand launch.",
            budget: BigInt(10000)
          });
          
          if ('ok' in projectResult) {
            toast.success('✅ Created demo project');
            setDemoStep(3);
            
            // Step 3: Deposit to escrow
            toast.info('Step 3: Depositing to escrow...');
            const depositResult = await backendActor.depositToEscrow(projectResult.ok.id, BigInt(10000));
            if ('ok' in depositResult) {
              toast.success('✅ Deposited 10,000 tokens to escrow');
              setDemoStep(4);
              
              // Step 4: Show instructions
              toast.info('🎉 Demo setup complete! You can now test the escrow system.');
              setDemoStep(5);
            } else {
              toast.error('Failed to deposit to escrow: ' + depositResult.err);
            }
          } else {
            toast.error('Failed to create project: ' + projectResult.err);
          }
        } else {
          toast.info('Note: You need to register as a Client to create projects. Demo shows balance addition only.');
          setDemoStep(5);
        }
      } else {
        toast.error('Failed to add balance: ' + balanceResult.err);
      }
    } catch (error) {
      toast.error('Demo failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className="neuro-card border-indigo-500/30">
        <CardHeader>
          <CardTitle className="text-xl font-orbitron flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Escrow System Demo Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300">
              New to the escrow system? Run this demo to set up test data and see how it works.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {demoSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    demoStep > index ? 'bg-green-500 text-white' : 
                    demoStep === index + 1 ? 'bg-indigo-500 text-white animate-pulse' :
                    'bg-gray-600 text-gray-400'
                  }`}>
                    {demoStep > index ? '✓' : index + 1}
                  </div>
                  <div className={`text-xs ${
                    demoStep > index ? 'text-green-400' :
                    demoStep === index + 1 ? 'text-indigo-400' :
                    'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                onClick={runDemo}
                disabled={isRunning}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? 'Running Demo...' : 'Run Demo Setup'}
              </Button>
              
              {demoStep === 5 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  Demo Complete!
                </Badge>
              )}
            </div>

            <div className="text-xs text-gray-500 text-center">
              This demo will add test tokens and create sample data for testing
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
