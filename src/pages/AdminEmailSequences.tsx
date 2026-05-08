import { motion } from "framer-motion";
import { Mail, Clock, Gift, ShoppingCart, Heart, RefreshCw, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";

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
  color: "from-amber-50 to-orange-50",
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
  color: "from-pink-50 to-rose-50",
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
  color: "from-green-50 to-emerald-50",
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

// ─── Pawtrait (canvas) lifecycle — 12 touchpoints ───────────────────────────
// Data-only mirror of the campaigns wired up in
// supabase/functions/process-email-nurture/index.ts (CAMPAIGNS const, the
// pawtrait_* keys). Same EmailSequence shape, same admin display.

const pawtraitWelcomeSequence: EmailSequence = {
  id: "pawtrait-welcome",
  name: "Pawtrait Welcome",
  icon: <Sparkles className="w-5 h-5" />,
  description: "First impression for canvas leads — uploaded a photo, haven't bought yet",
  trigger: "Triggered: After pawtraits intake / portrait preview",
  color: "from-amber-50 to-orange-50",
  steps: [
    {
      id: "pawtrait_welcome_1",
      name: "We Made Them Something",
      subject: "We made {petName} something",
      timing: "Immediately after upload",
      description: "Warm intro framing the portrait as a real, painted thing — not a generated novelty. CTA to view + size up.",
    },
    {
      id: "pawtrait_welcome_2",
      name: "Hanging On The Wall",
      subject: "Hanging {petName} on the wall",
      timing: "+24 hours",
      description: "Emotional reframe — a portrait says they belong in the home. Above the sofa, by the door, in the hallway.",
    },
    {
      id: "pawtrait_welcome_3",
      name: "Last Gentle Nudge",
      subject: "One last thing about {petName}",
      timing: "+72 hours",
      description: "Soft close — free shipping, frames included, ~1 week to arrive. No more nudging after this.",
    },
  ],
};

const pawtraitAbandonedSequence: EmailSequence = {
  id: "pawtrait-abandoned",
  name: "Pawtrait Abandoned Cart",
  icon: <ShoppingCart className="w-5 h-5" />,
  description: "Cart contents saved — gentle reminder, no urgency",
  trigger: "Triggered: 3+ hours after canvas cart abandonment",
  color: "from-pink-50 to-rose-50",
  steps: [
    {
      id: "pawtrait_abandoned_cart",
      name: "Still In Your Cart",
      subject: "{petName}'s portrait is still in your cart",
      timing: "+3 hours",
      description: "Reassures size + frame are saved. Each canvas is print-on-demand so no rush. CTA back to checkout.",
    },
  ],
};

const pawtraitFulfilmentSequence: EmailSequence = {
  id: "pawtrait-fulfilment",
  name: "Pawtrait Fulfilment",
  icon: <Heart className="w-5 h-5" />,
  description: "Post-purchase: print, ship, deliver",
  trigger: "Triggered: Stripe checkout.session.completed (canvas SKU) + Gelato shipping events",
  color: "from-green-50 to-emerald-50",
  steps: [
    {
      id: "pawtrait_purchase_confirm",
      name: "Being Made",
      subject: "{petName} is being made",
      timing: "Immediately on purchase",
      description: "Order confirmation framed as craft — canvas printing, frame fitting. Sets ~7-10 day expectation. Includes order reference.",
    },
    {
      id: "pawtrait_shipped",
      name: "On Its Way",
      subject: "{petName}'s portrait is on its way",
      timing: "Triggered by Gelato shipped event",
      description: "Inline portrait image + tracking link. Frames + foam protection mentioned so the box arrival isn't a surprise.",
    },
    {
      id: "pawtrait_delivered",
      name: "On The Wall Now?",
      subject: "{petName}'s on the wall now?",
      timing: "Triggered by Gelato delivered event",
      description: "Light, curious tone. Reply-to-fix offer for any print/frame/delivery issues. UGC ask.",
    },
  ],
};

const pawtraitLoopSequence: EmailSequence = {
  id: "pawtrait-loop",
  name: "Pawtrait Reorder & Win-back",
  icon: <RefreshCw className="w-5 h-5" />,
  description: "Post-delivery loops: UGC, second canvas, gift code, sub-save",
  trigger: "Triggered: scheduled at purchase, +14d / +30d / +60d / +90d",
  color: "from-indigo-50 to-violet-50",
  steps: [
    {
      id: "pawtrait_ugc_reorder",
      name: "Show Us Where They Ended Up",
      subject: "Show us where {petName} ended up",
      timing: "+14 days post-purchase",
      description: "UGC ask + gentle reorder nudge. Artwork stays on file so the next print is one click.",
    },
    {
      id: "pawtrait_winback_30",
      name: "Another Corner",
      subject: "Another corner for {petName}?",
      timing: "+30 days post-purchase",
      description: "Second canvas pitch — different size, different room, gift idea. Library link.",
    },
    {
      id: "pawtrait_winback_60",
      name: "Smaller Size Pitch",
      subject: "{petName} would suit the bedroom too",
      timing: "+60 days post-purchase",
      description: "Smaller canvas for bedside / desk / quieter room. Set framing (one big + one small).",
    },
    {
      id: "pawtrait_winback_90",
      name: "Gift Code",
      subject: "A little gift, on us",
      timing: "+90 days post-purchase",
      description: "20% off code (PAWTRAIT20) for next canvas — for self or as a gift.",
      discount: "PAWTRAIT20 - 20% off",
    },
    {
      id: "pawtrait_sub_save",
      name: "Sub-Save (Cancel Intent)",
      subject: "Before you go — one thought about {petName}",
      timing: "Triggered by cancel-intent click",
      description: "Lets them know artwork stays in account either way. 25% retention discount (STAYWITHUS) if they decide to stay.",
      discount: "STAYWITHUS - 25% off",
    },
  ],
};

const pawtraitSequences = [
  pawtraitWelcomeSequence,
  pawtraitAbandonedSequence,
  pawtraitFulfilmentSequence,
  pawtraitLoopSequence,
];

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
        <div className="w-10 h-10 rounded-full bg-[#c4a265]/20 border border-[#c4a265]/40 flex items-center justify-center text-[#c4a265] font-semibold">
          {index + 1}
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-gradient-to-b from-[#c4a265]/40 to-transparent min-h-[60px]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="bg-white border border-[#e8ddd0] rounded-xl shadow-sm p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-[#3d2f2a]">{step.name}</h4>
            <Badge variant="outline" className="text-xs shrink-0 border-[#e8ddd0] text-[#9a8578]">
              <Clock className="w-3 h-3 mr-1" />
              {step.timing}
            </Badge>
          </div>

          <div className="bg-[#faf6ef] rounded px-3 py-2 mb-3 border border-[#e8ddd0]/50">
            <p className="text-sm font-medium text-[#3d2f2a]">
              <Mail className="w-3.5 h-3.5 inline mr-2 text-[#c4a265]" />
              "{step.subject}"
            </p>
          </div>

          <p className="text-sm text-[#5a4a42]">{step.description}</p>

          {step.discount && (
            <div className="mt-3 flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700 border-green-200">
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
  <Card className={`bg-gradient-to-br ${sequence.color} border border-[#e8ddd0] rounded-xl shadow-sm overflow-hidden`}>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-[#c4a265]/15 border border-[#c4a265]/30 flex items-center justify-center text-[#c4a265]">
          {sequence.icon}
        </div>
        <div>
          <CardTitle className="text-lg font-serif text-[#3d2f2a]">{sequence.name}</CardTitle>
          <p className="text-sm text-[#5a4a42]">{sequence.description}</p>
        </div>
      </div>
      <Badge variant="secondary" className="w-fit text-xs bg-[#faf6ef] text-[#9a8578] border border-[#e8ddd0]">
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
    <AdminLayout>
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#3d2f2a] mb-2">Email Nurture Sequences</h1>
            <p className="text-[#9a8578]">
              Automated email flows based on user journey stage
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/admin")}
            className="border-[#e8ddd0] text-[#5a4a42] hover:bg-[#faf6ef]"
          >
            Back to Admin
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white border border-[#e8ddd0] rounded-xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#3d2f2a]">4</p>
                  <p className="text-sm text-[#9a8578]">Freebie nurture emails</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#e8ddd0] rounded-xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#3d2f2a]">1</p>
                  <p className="text-sm text-[#9a8578]">Cart recovery email</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#e8ddd0] rounded-xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#3d2f2a]">2</p>
                  <p className="text-sm text-[#9a8578]">Post-purchase emails</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Journey Flow Diagram */}
        <Card className="bg-white border border-[#e8ddd0] rounded-xl shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-[#3d2f2a]">
              <RefreshCw className="w-5 h-5 text-[#c4a265]" />
              User Journey Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <Badge variant="outline" className="py-2 px-4 border-[#e8ddd0] text-[#5a4a42]">Email Captured</Badge>
              <ArrowRight className="w-4 h-4 text-[#9a8578]" />

              <div className="flex flex-col items-center gap-2">
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 py-2 px-4">
                  Freebie Only?
                </Badge>
                <span className="text-xs text-[#9a8578]">Welcome Sequence</span>
              </div>

              <ArrowRight className="w-4 h-4 text-[#9a8578]" />

              <div className="flex flex-col items-center gap-2">
                <Badge className="bg-rose-100 text-rose-700 border-rose-200 py-2 px-4">
                  Started Intake?
                </Badge>
                <span className="text-xs text-[#9a8578]">Cart Recovery</span>
              </div>

              <ArrowRight className="w-4 h-4 text-[#9a8578]" />

              <div className="flex flex-col items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200 py-2 px-4">
                  Purchased!
                </Badge>
                <span className="text-xs text-[#9a8578]">Post-Purchase</span>
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

        {/* Pawtrait Sequence Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          {pawtraitSequences.map((sequence) => (
            <SequenceCard key={sequence.id} sequence={sequence} />
          ))}
        </div>

        {/* Notes */}
        <Card className="bg-white border border-[#e8ddd0] rounded-xl shadow-sm mt-8">
          <CardContent className="pt-6">
            <h3 className="font-semibold font-serif text-[#3d2f2a] mb-3">How It Works</h3>
            <ul className="space-y-2 text-sm text-[#5a4a42]">
              <li className="flex items-start gap-2">
                <span className="text-[#c4a265]">•</span>
                <span>Emails are AI-generated using pet name for personalization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c4a265]">•</span>
                <span>Each email tracks journey_stage in database to prevent duplicates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c4a265]">•</span>
                <span>Users can unsubscribe at any time via link in footer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c4a265]">•</span>
                <span>Purchasers never receive "buy" emails - only thank-you and referral content</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailSequences;
