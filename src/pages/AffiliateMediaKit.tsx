import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Copy, Check, Mail, Image, FileText, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { StarfieldBackground } from "@/components/cosmic/StarfieldBackground";

import banner728x90 from "@/assets/affiliate/banner-728x90.png";
import socialSquare from "@/assets/affiliate/social-square.png";
import socialStory from "@/assets/affiliate/social-story.png";

const emailSwipes = [
  {
    id: 1,
    title: "Introduction Email",
    subject: "I Just Got My Pet's Birth Chart... Mind = Blown 🌟",
    body: `Hey [Name],

You know how some people are really into astrology? Well, I just discovered something even better...

Pet astrology! 🐾✨

I got [Pet Name]'s cosmic birth chart and honestly, it explained SO much about their personality. Like why they're obsessed with [quirky behavior] or why they have such a [personality trait].

It's called Cosmic Pet and it takes like 2 minutes to get your pet's personalized reading.

Here's my link if you want to check it out: [YOUR_AFFILIATE_LINK]

Trust me, you'll be sending screenshots to everyone 😂

[Your Name]`,
  },
  {
    id: 2,
    title: "Problem/Solution Email",
    subject: "Finally understand why your pet does THAT thing",
    body: `Hey [Name],

Ever wonder why your pet:
- Has those weird quirks?
- Acts certain ways at specific times?
- Has that unique personality?

Turns out, it might be written in the stars! ⭐

I found this amazing service that creates a personalized cosmic profile for your pet based on their birth date and personality.

Mine was scarily accurate - it even predicted [specific trait]!

Get your pet's cosmic reading here: [YOUR_AFFILIATE_LINK]

It makes the perfect gift for any pet parent too!

[Your Name]`,
  },
  {
    id: 3,
    title: "Social Proof Email",
    subject: "50,000+ pet parents can't be wrong...",
    body: `Hey [Name],

Did you know over 50,000 pet parents have discovered their pet's cosmic personality?

I was skeptical at first too, but then I read my [pet type]'s reading and was genuinely shocked at how accurate it was.

The report covers:
✨ Your pet's zodiac personality traits
✨ Their emotional needs
✨ Best ways to bond with them
✨ What makes them unique

Plus it comes with this adorable shareable card you can post!

Check it out: [YOUR_AFFILIATE_LINK]

[Your Name]

P.S. They have a money-back guarantee so there's literally no risk!`,
  },
  {
    id: 4,
    title: "Gift Angle Email",
    subject: "The most unique gift for pet lovers 🎁",
    body: `Hey [Name],

Stuck on what to get the pet lover in your life?

I just found the most unique gift ever - a personalized cosmic birth chart for their pet!

It's not another generic gift card or boring present. It's a beautiful, personalized reading that tells them everything about their fur baby's cosmic personality.

Starting at just $9, it includes:
🌟 Detailed personality analysis
🌟 Beautiful shareable graphics
🌟 Insights into their pet's soul

Get one here: [YOUR_AFFILIATE_LINK]

They'll think you're so thoughtful!

[Your Name]`,
  },
];

const socialCaptions = [
  {
    platform: "Instagram",
    caption: `🌟 I just discovered my pet's cosmic personality and I'm SHOOK 🌟

Turns out [Pet Name] is a total [zodiac sign] and it explains EVERYTHING 😂

Get your pet's birth chart at [YOUR_LINK] 

#petastrology #cosmicpet #zodiac #petpersonality #petsofinstagram`,
  },
  {
    platform: "TikTok",
    caption: `POV: You just got your pet's birth chart and it's scarily accurate 👀✨

Link in bio to get yours! #petastrology #cosmicpet #zodiac #fyp #pettok`,
  },
  {
    platform: "Facebook",
    caption: `OK so I was today years old when I learned pet astrology is a thing... and now I'm obsessed! 🐾✨

Just got [Pet Name]'s cosmic birth chart and it's SO accurate it's scary. Finally understand why they [quirky behavior]!

If you want to try it for your pet: [YOUR_LINK]

It also makes such a cute gift for any pet parent! 🎁`,
  },
  {
    platform: "Twitter/X",
    caption: `just got my cat's birth chart and apparently she's a scorpio which explains... everything actually 😅🌟

try it for your pet: [YOUR_LINK]`,
  },
];

export default function AffiliateMediaKit() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadImage = (src: string, filename: string) => {
    const link = document.createElement("a");
    link.href = src;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Downloaded!",
      description: `${filename} saved to your device`,
    });
  };

  const banners = [
    { src: banner728x90, name: "Leaderboard Banner", size: "728x90", filename: "cosmic-pet-banner-728x90.png" },
  ];

  const socialGraphics = [
    { src: socialSquare, name: "Instagram/Facebook Post", size: "1080x1080", filename: "cosmic-pet-social-square.png" },
    { src: socialStory, name: "Story/Reels", size: "1080x1920", filename: "cosmic-pet-social-story.png" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <StarfieldBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Affiliate Media Kit
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to promote Cosmic Pet and earn commissions. Download banners, copy email swipes, and use our social templates.
          </p>
        </motion.div>

        <Tabs defaultValue="banners" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="banners" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Banners
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Swipes
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banners">
            <div className="space-y-8">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-purple-400" />
                    Display Banners
                  </CardTitle>
                  <CardDescription>
                    High-quality banners for websites, blogs, and ad placements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {banners.map((banner, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{banner.name}</h3>
                          <p className="text-sm text-muted-foreground">{banner.size}px</p>
                        </div>
                        <Button
                          onClick={() => downloadImage(banner.src, banner.filename)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                      <div className="bg-black/20 rounded-lg p-4 flex justify-center overflow-hidden">
                        <img
                          src={banner.src}
                          alt={banner.name}
                          className="max-w-full h-auto rounded"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-pink-400" />
                    Social Graphics
                  </CardTitle>
                  <CardDescription>
                    Ready-to-post graphics for Instagram, Facebook, TikTok, and more
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {socialGraphics.map((graphic, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{graphic.name}</h3>
                            <p className="text-sm text-muted-foreground">{graphic.size}px</p>
                          </div>
                          <Button
                            onClick={() => downloadImage(graphic.src, graphic.filename)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                        <div className="bg-black/20 rounded-lg p-4 flex justify-center">
                          <img
                            src={graphic.src}
                            alt={graphic.name}
                            className="max-w-full h-auto rounded max-h-64 object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="emails">
            <div className="space-y-6">
              {emailSwipes.map((email) => (
                <Card key={email.id} className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-purple-400" />
                          {email.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Subject: {email.subject}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`, `email-${email.id}`)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {copiedId === `email-${email.id}` ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-black/30 rounded-lg p-4 text-sm whitespace-pre-wrap font-sans text-muted-foreground overflow-x-auto">
                      {email.body}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="social">
            <div className="space-y-6">
              {socialCaptions.map((post, idx) => (
                <Card key={idx} className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-pink-400" />
                        {post.platform}
                      </CardTitle>
                      <Button
                        onClick={() => copyToClipboard(post.caption, `social-${idx}`)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {copiedId === `social-${idx}` ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-black/30 rounded-lg p-4 text-sm whitespace-pre-wrap font-sans text-muted-foreground">
                      {post.caption}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Need your affiliate link? Sign up or access your dashboard:
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <a href="/become-affiliate">Become an Affiliate</a>
            </Button>
            <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <a href="/affiliate-dashboard">Affiliate Dashboard</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
