import { motion } from "framer-motion";
import { Mail, Clock, Gift, ShoppingCart, Heart, RefreshCw, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { StarfieldBackground } from "@/components/cosmic/StarfieldBackground";

interface EmailStep {
  id: string;
  name: string;
  subject: string;
  timing: string;
  description: string;
  discount?: string;
}

interface EmailSequence {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  trigger: string;
  color: string;
  steps: EmailStep[];
}

const freebieSequence: EmailSequence = {
  id: "freebie",
  name: "Freebie-Only Nurture",
  icon: <Sparkles className="w-5 h-5" />,
  description: "For users who got the free mini-reading but haven't purchased",
  trigger: "Triggered: After email capture without purchase",
  color: "from-amber-500/20 to-orange-500/20",
  steps: [
    {
      id: "welcome_1",
      name: "Welcome Email",
      subject: "Welcome - let's finish {petName}'s reading",
      timing: "30 minutes after signup",
      description: "Warm welcome, mention they can finish anytime, simple CTA to continue",
    },
    {
      id: "welcome_2",
      name: "Interest Builder",
      subject: "Something interesting about {petName}",
      timing: "24 hours later",
      description: "Share one interesting fact about pet astrology, conversational tone, CTA to get reading",
    },
    {
      id: "welcome_3",
      name: "Discount Offer",
      subject: "15% off {petName}'s reading",
      timing: "72 hours later",
      description: "Final reminder with discount offer, gentle urgency",
      discount: "COSMIC15 - 15% off",
    },
    {
      id: "re_engagement",
      name: "Win-Back",
      subject: "Been a while - here's 20% off",
      timing: "30 days later",
      description: "Re-engagement for inactive leads, mention new features, bigger discount",
      discount: "WELCOME_BACK - 20% off",
    },
  ],
};

const abandonedSequence: EmailSequence = {
  id: "abandoned",
  name: "Abandoned Cart Recovery",
  icon: <ShoppingCart className="w-5 h-5" />,
  description: "For users who started intake but didn't complete purchase",
  trigger: "Triggered: 3+ hours after starting intake without purchase",
  color: "from-red-500/20 to-pink-500/20",
  steps: [
    {
      id: "abandoned_cart",
      name: "Recovery Email",
      subject: "You were almost done",
      timing: "3 hours after abandonment",
      description: "Friendly reminder, not guilt-trippy, mention progress is saved, CTA to continue",
    },
  ],
};

const purchaserSequence: EmailSequence = {
  id: "purchaser",
  name: "Post-Purchase Nurture",
  icon: <Heart className="w-5 h-5" />,
  description: "For users who completed a purchase",
  trigger: "Triggered: After successful payment",
  color: "from-green-500/20 to-emerald-500/20",
  steps: [
    {
      id: "post_purchase_1",
      name: "Thank You",
      subject: "Thanks for getting {petName}'s reading",
      timing: "24 hours after purchase",
      description: "Express genuine thanks, tips for getting the most from their reading, encourage questions",
    },
    {
      id: "post_purchase_2",
      name: "Referral Ask",
      subject: "Know someone who'd love this?",
      timing: "7 days later",
      description: "Ask how they're enjoying it, mention gifting option",
      discount: "SHAREIT - 10% off gifts",
    },
  ],
};

const sequences = [freebieSequence, abandonedSequence, purchaserSequence];

const EmailStepCard = ({ step, index, isLast }: { step: EmailStep; index: number; isLast: boolean }) => (
  <div className="relative">
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex gap-4"
    >
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold">
          {index + 1}
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-gradient-to-b from-primary/40 to-transparent min-h-[60px]" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="bg-card/50 border border-border/50 rounded-lg p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-foreground">{step.name}</h4>
            <Badge variant="outline" className="text-xs shrink-0">
              <Clock className="w-3 h-3 mr-1" />
              {step.timing}
            </Badge>
          </div>
          
          <div className="bg-muted/50 rounded px-3 py-2 mb-3">
            <p className="text-sm font-medium text-foreground/90">
              <Mail className="w-3.5 h-3.5 inline mr-2 text-primary" />
              "{step.subject}"
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">{step.description}</p>
          
          {step.discount && (
            <div className="mt-3 flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Gift className="w-3 h-3 mr-1" />
                {step.discount}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  </div>
);

const SequenceCard = ({ sequence }: { sequence: EmailSequence }) => (
  <Card className={`bg-gradient-to-br ${sequence.color} border-border/50 overflow-hidden`}>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
          {sequence.icon}
        </div>
        <div>
          <CardTitle className="text-lg">{sequence.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{sequence.description}</p>
        </div>
      </div>
      <Badge variant="secondary" className="w-fit text-xs">
        {sequence.trigger}
      </Badge>
    </CardHeader>
    <CardContent>
      <div className="mt-4">
        {sequence.steps.map((step, index) => (
          <EmailStepCard 
            key={step.id} 
            step={step} 
            index={index} 
            isLast={index === sequence.steps.length - 1}
          />
        ))}
      </div>
    </CardContent>
  </Card>
);

const AdminEmailSequences = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative">
      <StarfieldBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Email Nurture Sequences</h1>
            <p className="text-muted-foreground">
              Automated email flows based on user journey stage
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">4</p>
                  <p className="text-sm text-muted-foreground">Freebie nurture emails</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">1</p>
                  <p className="text-sm text-muted-foreground">Cart recovery email</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">2</p>
                  <p className="text-sm text-muted-foreground">Post-purchase emails</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Journey Flow Diagram */}
        <Card className="bg-card/50 border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              User Journey Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <Badge variant="outline" className="py-2 px-4">Email Captured</Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              
              <div className="flex flex-col items-center gap-2">
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 py-2 px-4">
                  Freebie Only?
                </Badge>
                <span className="text-xs text-muted-foreground">Welcome Sequence</span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              
              <div className="flex flex-col items-center gap-2">
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 py-2 px-4">
                  Started Intake?
                </Badge>
                <span className="text-xs text-muted-foreground">Cart Recovery</span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              
              <div className="flex flex-col items-center gap-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 py-2 px-4">
                  Purchased!
                </Badge>
                <span className="text-xs text-muted-foreground">Post-Purchase</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sequence Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sequences.map((sequence) => (
            <SequenceCard key={sequence.id} sequence={sequence} />
          ))}
        </div>

        {/* Notes */}
        <Card className="bg-card/30 border-border/30 mt-8">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-3">How It Works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Emails are AI-generated using pet name for personalization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Each email tracks journey_stage in database to prevent duplicates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Users can unsubscribe at any time via link in footer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Purchasers never receive "buy" emails - only thank-you and referral content</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminEmailSequences;
