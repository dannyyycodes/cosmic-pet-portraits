import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Language = 'en' | 'es' | 'pt' | 'fr' | 'ar';

export const languages: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ========== ENGLISH TRANSLATIONS (SOURCE OF TRUTH) ==========
// Edit these and other languages will auto-update via AI translation
const englishTranslations: Record<string, string> = {
  // Navbar
  'nav.howItWorks': 'How it Works',
  'nav.testimonials': 'Testimonials',
  'nav.faq': 'FAQ',
  'nav.gift': 'Gift a Reading',
  'nav.getReading': 'Get Your Reading',
  'nav.backHome': 'Back to Home',
  
  // Hero - Landing Page
  'hero.badge': '✨ Trusted by 10,000+ Pet Parents',
  'hero.title': 'Discover the Soul Behind Those Eyes',
  'hero.subtitle': '92% of pet parents say this cosmic reading revealed something profound about their bond. Unlock your pet\'s true purpose in 60 seconds.',
  'hero.cta': 'Reveal Their Cosmic Portrait',
  'hero.ctaSubtext': '🌟 Instant digital delivery • 100% personalized',
  'hero.trustpilot': 'Excellent',
  'hero.reviews': 'Based on 2,847 reviews',
  'hero.mostPopular': 'Most Popular',
  'hero.perfectGift': 'Perfect Gift',
  'hero.discoverMyPet': 'Discover My Pet',
  'hero.discoverDesc': 'Unlock your companion\'s cosmic personality and deepen your bond',
  'hero.startDiscovery': 'Start Discovery',
  'hero.giftToFriend': 'Gift to a Friend',
  'hero.giftDesc': 'The perfect gift for any pet lover — meaningful & unforgettable',
  'hero.sendGift': 'Send a Gift',
  'hero.poweredBy': 'Powered by',
  'hero.swissEphemeris': 'Swiss Ephemeris data',
  'hero.craftedBy': ', crafted by devoted pet lovers',
  'hero.ratedBy': 'Rated',
  'hero.byPetParents': 'by 2,000+ Pet Parents',
  
  // Testimonials Section
  'testimonials.title': 'What Pet Parents Are Saying',
  'testimonials.subtitle': 'Real stories from pet parents who discovered their companion\'s cosmic truth',
  
  // How it Works
  'howItWorks.title': 'How It Works',
  'howItWorks.subtitle': 'Three simple steps to unlock your pet\'s cosmic secrets',
  'howItWorks.step1.title': 'Share Their Details',
  'howItWorks.step1.desc': 'Tell us about your pet - their birth date, personality traits, and what makes them special.',
  'howItWorks.step2.title': 'We Consult the Stars',
  'howItWorks.step2.desc': 'Our cosmic algorithms analyze planetary positions and create a unique astrological profile.',
  'howItWorks.step3.title': 'Receive Your Report',
  'howItWorks.step3.desc': 'Get a beautifully crafted, personalized cosmic portrait delivered instantly to your inbox.',
  
  // FAQ
  'faq.title': 'Frequently Asked Questions',
  'faq.subtitle': 'Everything you need to know about your pet\'s cosmic reading',
  
  // Footer
  'footer.tagline': 'Revealing the cosmic bond between you and your beloved companion.',
  'footer.links': 'Quick Links',
  'footer.legal': 'Legal',
  'footer.contact': 'Contact',
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms',
  'footer.becomeAffiliate': 'Become an Affiliate',
  'footer.copyright': '© 2025 The Cosmic Pet Report.',
  
  // Intake - Occasion
  'intake.occasion.badge': 'Cosmic Pet Astrology',
  'intake.occasion.title': 'What brings you here today?',
  'intake.occasion.subtitle': 'Choose your cosmic journey and we\'ll personalize the experience',
  'intake.occasion.discover': 'Discover My Pet',
  'intake.occasion.discoverDesc': 'Unlock your pet\'s cosmic personality',
  'intake.occasion.birthday': 'Birthday Celebration',
  'intake.occasion.birthdayDesc': 'Honor another orbit around the sun',
  'intake.occasion.memorial': 'Memorial Tribute',
  'intake.occasion.memorialDesc': 'Honor a beloved soul who crossed the rainbow bridge',
  'intake.occasion.footer': 'Each journey is crafted with care to match your unique situation ✨',
  'intake.occasion.startFresh': 'Start Fresh',
  'intake.occasion.discoverSub': "Unlock your pet's cosmic personality",
  'intake.occasion.birthdaySub': 'Honor another orbit around the sun',
  'intake.occasion.memorialSub': 'Honor a beloved soul who crossed the rainbow bridge',
  'intake.occasion.note': 'Each journey is crafted with care to match your unique situation',
  
  // Intake - Pet Count
  'intake.petCount.title': 'How many cosmic companions?',
  'intake.petCount.subtitle': 'Get a personalized reading for each of your pets',
  'intake.petCount.letsBegin': 'Let\'s Begin',
  'intake.petCount.continueWith': 'Continue with {count} Pets',
  'intake.petCount.beginSingle': "Let's Begin",
  'intake.petCount.beginMulti': 'Continue with {count} Pets',
  
  // Intake - Name
  'intake.name.step': 'Step {current} of {total}',
  'intake.name.title': 'What\'s your pet\'s name?',
  'intake.name.titleNumbered': 'What\'s pet #{number}\'s name?',
  'intake.name.titleMulti': "What's pet #{number}'s name?",
  'intake.name.subtitle': 'Every great cosmic journey begins with a name',
  'intake.name.placeholder': 'Pet\'s Name',
  'intake.name.error.length': 'Name must be {max} characters or less',
  'intake.name.error.chars': 'Only letters, spaces, hyphens, and apostrophes allowed',
  'intake.name.errorLength': 'Name must be {max} characters or less',
  'intake.name.errorChars': 'Only letters, spaces, hyphens, and apostrophes allowed',
  
  // Intake - Species
  'intake.species.title': 'What kind of pet is {name}?',
  'intake.species.subtitle': 'Select their species below.',
  'intake.species.dog': 'Dog',
  'intake.species.cat': 'Cat',
  'intake.species.rabbit': 'Rabbit',
  'intake.species.hamster': 'Hamster',
  'intake.species.guineaPig': 'Guinea Pig',
  'intake.species.bird': 'Bird',
  'intake.species.fish': 'Fish',
  'intake.species.reptile': 'Reptile',
  'intake.species.horse': 'Horse',
  'intake.species.other': 'Other',
  
  // Intake - Breed
  'intake.breed.title': 'What breed is {name}?',
  'intake.breed.subtitle': 'This helps us refine their cosmic profile.',
  'intake.breed.placeholder.dog': 'e.g., Golden Retriever, Labrador',
  'intake.breed.placeholder.cat': 'e.g., Siamese, Persian',
  'intake.breed.placeholder.rabbit': 'e.g., Holland Lop, Lionhead',
  'intake.breed.placeholder.hamster': 'e.g., Syrian, Dwarf',
  'intake.breed.placeholder.guineaPig': 'e.g., American, Abyssinian',
  'intake.breed.placeholder.bird': 'e.g., Cockatiel, Budgie',
  'intake.breed.placeholder.fish': 'e.g., Betta, Goldfish',
  'intake.breed.placeholder.reptile': 'e.g., Bearded Dragon, Gecko',
  'intake.breed.placeholder.horse': 'e.g., Arabian, Quarter Horse',
  'intake.breed.placeholder.default': 'Enter breed or type',
  'intake.breed.unknown': 'Leave blank if unknown or mixed breed',
  'intake.breed.placeholderDog': 'e.g., Golden Retriever, Labrador',
  'intake.breed.placeholderCat': 'e.g., Siamese, Persian',
  'intake.breed.placeholderRabbit': 'e.g., Holland Lop, Lionhead',
  'intake.breed.placeholderHamster': 'e.g., Syrian, Dwarf',
  'intake.breed.placeholderGuineaPig': 'e.g., American, Abyssinian',
  'intake.breed.placeholderBird': 'e.g., Cockatiel, Budgie',
  'intake.breed.placeholderFish': 'e.g., Betta, Goldfish',
  'intake.breed.placeholderReptile': 'e.g., Bearded Dragon, Gecko',
  'intake.breed.placeholderHorse': 'e.g., Arabian, Quarter Horse',
  'intake.breed.placeholderDefault': 'Enter breed or type',
  'intake.breed.hint': 'Leave blank if unknown or mixed breed',
  
  // Intake - Gender
  'intake.gender.title': 'Is {name} a boy or girl?',
  'intake.gender.subtitle': 'This influences their cosmic energy pattern.',
  'intake.gender.boy': 'Boy',
  'intake.gender.girl': 'Girl',
  
  // Intake - DOB
  'intake.dob.title': 'When was {name} born?',
  'intake.dob.subtitle': 'This determines their sun sign and cosmic blueprint.',
  'intake.dob.knowDate': 'I know the date',
  'intake.dob.estimateAge': 'Estimate age',
  'intake.dob.dateOfBirth': 'Date of Birth',
  'intake.dob.selectDay': 'Tap to select day',
  'intake.dob.howOld': 'How old is {name}?',
  'intake.dob.years': 'Years',
  'intake.dob.months': 'Months',
  'intake.dob.year': 'year',
  'intake.dob.yearsPlural': 'years',
  'intake.dob.month': 'month',
  'intake.dob.monthsPlural': 'months',
  'intake.dob.estimatedBirth': 'Estimated birth: ~{date}',
  'intake.dob.addTime': 'Add birth time for extra accuracy',
  'intake.dob.timeOfBirth': 'Time of Birth',
  'intake.dob.approximate': '(approximate is fine)',
  'intake.dob.morning': 'Morning',
  'intake.dob.afternoon': 'Afternoon',
  'intake.dob.evening': 'Evening',
  'intake.dob.night': 'Night',
  'intake.dob.exactTime': 'or exact time:',
  'intake.dob.skipTime': 'Skip time',
  'intake.dob.tapToSelect': 'Tap to select day',
  'intake.dob.addTimeAccuracy': 'Add birth time for extra accuracy',
  'intake.dob.approximateFine': 'approximate is fine',
  'intake.dob.orExactTime': 'or exact time',
  'intake.dob.yearSingular': 'year',
  'intake.dob.monthSingular': 'month',
  
  // Intake - Location
  'intake.location.title': 'Where was {name} born?',
  'intake.location.subtitle': 'Location helps us map the cosmic energies present at birth.',
  'intake.location.placeholder': 'Start typing city name...',
  'intake.location.useMyLocation': 'Use my current location',
  'intake.location.findingLocation': 'Finding location...',
  'intake.location.quickSelect': 'Quick select:',
  'intake.location.dontKnow': 'I don\'t know the birthplace',
  'intake.location.finding': 'Finding location...',
  'intake.location.useCurrent': 'Use my current location',
  'intake.location.unknown': 'Unknown',
  'intake.location.locationFound': 'Location found',
  
  // Intake - Soul
  'intake.soul.title': 'What type of soul is {name}?',
  'intake.soul.subtitle': 'Choose the one that best describes their essence.',
  'intake.soul.notSure': 'I\'m not sure / multiple might fit',
  
  // Intake - Superpower
  'intake.superpower.title': 'What is {name}\'s secret superpower?',
  'intake.superpower.subtitle': 'Every soul has a unique gift.',
  'intake.superpower.notSure': 'I\'m not sure / multiple might fit',
  
  // Intake - Strangers
  'intake.strangers.title': 'How does {name} react to new people?',
  'intake.strangers.subtitle': 'First impressions reveal deep truths.',
  'intake.strangers.notSure': 'I\'m not sure / depends on the situation',
  
  // Intake - Email
  'intake.email.step': 'Step {current} of {total}',
  'intake.email.badge': 'Profile Complete!',
  'intake.email.title': 'Where should we send {name}\'s cosmic reading?',
  'intake.email.subtitle': 'Enter your email to receive their personalized report.',
  'intake.email.placeholder': 'your@email.com',
  'intake.email.button': 'See My Preview',
  
  // Intake - Common
  'intake.continue': 'Continue',
  'intake.back': 'Back',
  'intake.pet': 'Pet {current} of {total}',
  'intake.edit': 'Edit',
  'intake.step': 'Step',
  'intake.of': 'of',
  
  // Checkout
  'checkout.title': 'Choose Your Reading',
  'checkout.subtitle': 'Unlock {name}\'s complete cosmic profile',
  'checkout.subtitleMultiple': 'Unlock {names}\'s cosmic profiles',
  'checkout.urgency': 'Only {count} readings left at this price today!',
  'checkout.socialProof': 'Join {count} happy pet parents',
  'checkout.lossAversion': 'Don\'t miss {name}\'s cosmic window!',
  'checkout.lossAversion2': 'The stars are aligned right now.',
  'checkout.multiPetDiscount': '{percent}% Multi-Pet Discount Applied!',
  'checkout.basic.name': 'Cosmic Pet Reading',
  'checkout.basic.desc': 'Complete 18-chapter cosmic report',
  'checkout.premium.name': 'Cosmic Portrait Edition',
  'checkout.premium.desc': 'Full report + AI-generated cosmic trading card',
  'checkout.vip.name': 'Cosmic VIP Experience',
  'checkout.vip.desc': 'The ultimate cosmic journey for devoted pet parents',
  'checkout.mostPopular': 'MOST POPULAR',
  'checkout.bestValue': 'BEST VALUE',
  'checkout.feature.fullReport': 'Full 18-Section Report',
  'checkout.feature.personality': 'Personality Deep Dive',
  'checkout.feature.careTips': 'Care & Bonding Tips',
  'checkout.feature.loveLanguage': 'Love Language Decoded',
  'checkout.feature.funFacts': 'Practical Tips & Fun Facts',
  'checkout.feature.everything': 'Everything in Basic',
  'checkout.feature.portrait': '🎨 AI Cosmic Portrait Card',
  'checkout.feature.shareable': 'Shareable Trading Card',
  'checkout.feature.download': 'Download & Print Ready',
  'checkout.feature.everythingPortrait': 'Everything in Portrait Edition',
  'checkout.feature.yearlyUpdates': 'Yearly Updates Forever',
  'checkout.feature.prioritySupport': 'Priority Cosmic Support',
  'checkout.feature.vipCommunity': 'Exclusive VIP Community',
  'checkout.save': 'Save {percent}%',
  'checkout.orderSummary': 'Order Summary',
  'checkout.specialDiscount': 'Special discount',
  'checkout.multiPetBonus': 'Multi-pet bonus ({percent}% off)',
  'checkout.yourPrice': 'Your Price',
  'checkout.weeklyGuide': 'Weekly Cosmic Care Guide',
  'checkout.weeklyGuideDesc': 'Know exactly what {name} needs each week based on cosmic energies.',
  'checkout.recommended': 'RECOMMENDED',
  'checkout.energyPredictions': 'Energy level predictions',
  'checkout.bestDays': 'Best bonding days',
  'checkout.moodForecasts': 'Mood forecasts',
  'checkout.healthAlerts': 'Health awareness alerts',
  'checkout.cancelAnytime': 'Cancel anytime',
  'checkout.unlockReport': 'Unlock {name}\'s Cosmic Report',
  'checkout.processing': 'Processing...',
  'checkout.guarantee': '💛 100% Satisfaction Guaranteed — Love it or get a full refund',
  'checkout.securePayment': 'Secure payment powered by Stripe',
  'checkout.giftUpsell.title': 'Add a Gift for a Friend?',
  'checkout.giftUpsell.subtitle': 'Give the gift of cosmic discovery',
  'checkout.giftUpsell.desc': '50% off when added with your order — they\'ll receive their own gift certificate.',
  'checkout.giftUpsell.price': 'Just {price} (normally {original})',
  'checkout.giftUpsell.yes': 'Yes, Add Gift',
  'checkout.giftUpsell.no': 'No Thanks',
  'checkout.uploadPhoto': 'Upload a Photo',
  'checkout.uploadPhotoDesc': 'Upload a photo of {name} for their cosmic portrait',
  
  // Report
  'report.generating': 'Consulting the Stars...',
  'report.generatingDesc': 'The cosmos is aligning to reveal {name}\'s true nature',
  'report.download': 'Download PDF',
  'report.share': 'Share',
  'report.step.analyzing': 'Analyzing celestial positions...',
  'report.step.calculating': 'Calculating birth chart...',
  'report.step.interpreting': 'Interpreting cosmic energies...',
  'report.step.crafting': 'Crafting your report...',
  
  // Gift Purchase
  'gift.title': 'Give the Gift of Cosmic Discovery',
  'gift.subtitle': 'The most meaningful gift for any pet lover — a window into their companion\'s soul',
  'gift.whyPerfect': 'Why This is the Perfect Gift',
  'gift.personal': 'Deeply Personal & Unique',
  'gift.personalDesc': 'No two reports are alike — each one reveals the unique cosmic blueprint of their beloved pet',
  'gift.strengthens': 'Strengthens Their Bond',
  'gift.strengthensDesc': '92% of pet parents say they feel even closer to their pet after reading their cosmic report',
  'gift.unforgettable': 'A Gift They\'ll Never Forget',
  'gift.unforgettableDesc': 'Unlike flowers or chocolate, this gift creates lasting memories and meaningful insights',
  'gift.testimonial': '"I gifted this to my sister for her birthday. She called me in tears — she said it described her dog Max perfectly and helped her understand his quirky behaviors. Best gift I\'ve ever given!"',
  'gift.testimonialAuthor': '— Sarah M., verified purchaser',
  'gift.instant': 'Instant digital delivery',
  'gift.valid': 'Valid for 1 year',
  'gift.anyPet': 'Works for any pet',
  'gift.selectAmount': 'Select Gift Amount',
  'gift.howSend': 'How do you want to send this gift?',
  'gift.sendEmail': 'Send via Email',
  'gift.sendEmailDesc': 'We\'ll email them directly',
  'gift.getLink': 'Get a Link',
  'gift.getLinkDesc': 'Share it yourself',
  'gift.yourEmail': 'Your Email',
  'gift.recipientName': 'Recipient\'s Name (optional)',
  'gift.recipientNamePlaceholder': 'Who\'s this gift for?',
  'gift.recipientEmail': 'Recipient\'s Email',
  'gift.recipientEmailPlaceholder': 'They\'ll receive their gift here',
  'gift.message': 'Personal Message (optional)',
  'gift.messagePlaceholder': 'Add a heartfelt message to go with your gift...',
  'gift.sendGift': 'Send Gift',
  'gift.getGiftLink': 'Get Gift Link',
  'gift.processing': 'Processing...',
  'gift.experience': 'Their Gift Experience:',
  'gift.step1Email': 'They receive a beautiful email',
  'gift.step1EmailDesc': 'With your personal message and the gift code — pure excitement!',
  'gift.step1Link': 'You share the magic link',
  'gift.step1LinkDesc': 'Text, WhatsApp, or however you like — add your personal touch',
  'gift.step2': 'They enter their pet\'s details',
  'gift.step2Desc': 'Name, birthday, and a few fun questions — takes just 60 seconds',
  'gift.step3': 'The cosmic report is revealed!',
  'gift.step3Desc': 'A personalized journey into their pet\'s soul — prepare for happy tears',
  'gift.secure': 'Secure payment powered by Stripe. Gift certificates valid for 1 year.',
  'gift.stats': '💛 Over 2,000 gifts sent — rated 4.9/5 by gift recipients',
  'gift.backHome': 'Back to home',
  'gift.tier1Name': 'Cosmic Pet Reading',
  'gift.tier1Desc': 'Full 18-chapter cosmic report',
  'gift.tier2Name': 'Cosmic Portrait Edition',
  'gift.tier2Desc': 'Full report + AI cosmic portrait card',
  'gift.tier3Name': 'Cosmic VIP Experience',
  'gift.tier3Desc': 'Everything + yearly updates forever',
  'gift.errorYourEmail': 'Please enter your email',
  'gift.errorRecipientEmail': 'Please enter recipient email',
  'gift.errorGeneric': 'Something went wrong. Please try again.',
  'gift.reason1Title': 'Deeply Personal & Unique',
  'gift.reason1Desc': 'No two reports are alike — each one reveals the unique cosmic blueprint of their beloved pet',
  'gift.reason2Title': 'Strengthens Their Bond',
  'gift.reason2Desc': '92% of pet parents say they feel even closer to their pet after reading their cosmic report',
  'gift.reason3Title': 'A Gift They\'ll Never Forget',
  'gift.reason3Desc': 'Unlike flowers or chocolate, this gift creates lasting memories and meaningful insights',
  'gift.feature1': 'Instant digital delivery',
  'gift.feature2': 'Valid for 1 year',
  'gift.feature3': 'Works for any pet',
  'gift.deliveryMethod': 'How do you want to send this gift?',
  'gift.personalMessage': 'Personal Message (optional)',
  'gift.personalMessagePlaceholder': 'Add a heartfelt message to go with your gift...',
  'gift.securePayment': 'Secure payment powered by Stripe. Gift certificates valid for 1 year.',
  'gift.socialProof': 'Over 2,000 gifts sent — rated 4.9/5 by gift recipients',
  
  // Gift Success Page
  'giftSuccess.title': 'Gift Purchased Successfully!',
  'giftSuccess.subtitleLink': 'Share the link below with your lucky recipient ✨',
  'giftSuccess.subtitleEmail': 'Your cosmic gift is on its way ✨',
  'giftSuccess.shareableLink': 'Shareable Gift Link',
  'giftSuccess.copyLink': 'Copy Link',
  'giftSuccess.share': 'Share',
  'giftSuccess.giftCode': 'Gift Code',
  'giftSuccess.codeCopied': 'Gift code copied to clipboard!',
  'giftSuccess.linkCopied': 'Gift link copied to clipboard!',
  'giftSuccess.shareTitle': 'Cosmic Pet Report Gift',
  'giftSuccess.shareText': 'I got you a Cosmic Pet Report! Discover the soul behind your pet\'s eyes.',
  'giftSuccess.whatsNext': 'What happens next?',
  'giftSuccess.step1': 'You\'ll receive a confirmation email',
  'giftSuccess.step2Link': 'Share the link above with your recipient',
  'giftSuccess.step3Link': 'They\'ll enter their pet\'s details to get the report',
  'giftSuccess.step2Email': 'Your recipient will get their gift code by email',
  'giftSuccess.step3Email': 'They can redeem it anytime within 1 year',
  'giftSuccess.purchaseAnother': 'Purchase Another Gift',
  'giftSuccess.questions': 'Questions? Contact us at support@astropaws.site',
  
  // Redeem Gift Page
  'redeem.title': 'Redeem Your Cosmic Gift',
  'redeem.subtitle': 'Enter your gift code to unlock your pet\'s cosmic profile',
  'redeem.codeLabel': 'Gift Code',
  'redeem.validateButton': 'Validate Code',
  'redeem.validating': 'Validating...',
  'redeem.invalidCode': 'Invalid gift code. Please check and try again.',
  'redeem.errorGeneric': 'Something went wrong. Please try again.',
  'redeem.receivedTitle': 'You\'ve Received a Cosmic Gift!',
  'redeem.receivedTitleName': '{name}, You\'ve Received a Gift!',
  'redeem.receivedSubtitle': 'Someone special wants you to discover your pet\'s cosmic truth',
  'redeem.includes': 'Your gift includes:',
  'redeem.feature1': 'Complete cosmic personality profile',
  'redeem.feature2': 'Soul mission & hidden gifts',
  'redeem.feature3': 'Love language & care insights',
  'redeem.continueButton': 'Tell Us About Your Pet',
  'redeem.instructions': 'Just answer a few quick questions about your pet to unlock their reading',
  
  // Contact
  'contact.title': 'Contact Us',
  'contact.subtitle': 'Have a question about your cosmic pet reading? We\'re here to help!',
  'contact.getInTouch': 'Get in Touch',
  'contact.email': 'Email',
  'contact.responseTime': 'Response Time',
  'contact.responseTimeDesc': 'We typically respond within 24 hours',
  'contact.guarantee': 'Money-Back Guarantee',
  'contact.guaranteeDesc': 'Not satisfied? Get a full refund within 7 days, no questions asked.',
  'contact.commonQuestions': 'Common Questions',
  'contact.faq1': 'How accurate are the readings?',
  'contact.faq2': 'How do I access my report?',
  'contact.faq3': 'Can I get a refund?',
  'contact.sendMessage': 'Send a Message',
  'contact.name': 'Name',
  'contact.namePlaceholder': 'Your name',
  'contact.emailPlaceholder': 'you@example.com',
  'contact.subject': 'Subject',
  'contact.subjectPlaceholder': 'Select a topic',
  'contact.subjectRefund': 'Refund Request',
  'contact.subjectReport': 'Question About My Report',
  'contact.subjectGift': 'Gift Certificate Help',
  'contact.subjectAffiliate': 'Affiliate Program',
  'contact.subjectOther': 'Other',
  'contact.message': 'Message',
  'contact.messagePlaceholder': 'How can we help?',
  'contact.send': 'Send Message',
  'contact.sending': 'Sending...',
  'contact.backHome': '← Back to Home',
  'contact.success': 'Message sent! We\'ll get back to you within 24 hours.',
  'contact.error': 'Failed to send message. Please try emailing us directly.',
  'contact.nameLabel': 'Name',
  'contact.emailLabel': 'Email',
  'contact.subjectLabel': 'Subject',
  'contact.messageLabel': 'Message',
  
  // Months
  'months.january': 'January',
  'months.february': 'February',
  'months.march': 'March',
  'months.april': 'April',
  'months.may': 'May',
  'months.june': 'June',
  'months.july': 'July',
  'months.august': 'August',
  'months.september': 'September',
  'months.october': 'October',
  'months.november': 'November',
  'months.december': 'December',
  
  // Terms Page
  'terms.title': 'Terms of Service',
  'terms.lastUpdated': 'Last updated: December 2024',
  'terms.section1Title': '1. Acceptance of Terms',
  'terms.section1Content': 'By accessing and using Astropaws ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.',
  'terms.section2Title': '2. Service Description',
  'terms.section2Content': 'Astropaws provides entertainment-based cosmic personality readings for pets. Our readings are created for entertainment purposes only and should not be considered as veterinary, behavioral, or professional advice.',
  'terms.section3Title': '3. Payment & Refunds',
  'terms.section3Content': 'All payments are processed securely through Stripe. We offer a 7-day money-back guarantee. If you\'re not completely satisfied with your pet\'s cosmic reading, contact us within 7 days of purchase for a full refund.',
  'terms.section4Title': '4. Gift Certificates',
  'terms.section4Content': 'Gift certificates are valid for 12 months from the date of purchase. Gift certificates are non-refundable but may be transferred to another recipient by contacting customer support.',
  'terms.section5Title': '5. Intellectual Property',
  'terms.section5Content': 'All content, including text, graphics, logos, and cosmic readings, are the property of Astropaws and protected by intellectual property laws. You may share your personal reading but may not reproduce our content for commercial purposes.',
  'terms.section6Title': '6. User Conduct',
  'terms.section6Content': 'You agree to provide accurate information about your pet and to use the service for personal, non-commercial purposes only. Any misuse of the service may result in termination of access.',
  'terms.section7Title': '7. Limitation of Liability',
  'terms.section7Content': 'Astropaws provides readings for entertainment purposes. We are not liable for any decisions made based on our readings. Always consult qualified professionals for pet health and behavior concerns.',
  'terms.section8Title': '8. Changes to Terms',
  'terms.section8Content': 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.',
  'terms.section9Title': '9. Contact',
  'terms.section9Content': 'For questions about these terms, please contact us at',
  
  // Privacy Page
  'privacy.title': 'Privacy Policy',
  'privacy.lastUpdated': 'Last updated: December 2024',
  'privacy.section1Title': '1. Information We Collect',
  'privacy.section1Intro': 'We collect the following information to provide our cosmic pet reading service:',
  'privacy.petInfo': 'Pet Information',
  'privacy.petInfoDesc': 'Name, species, breed, birth date, birth location, and personality traits',
  'privacy.contactInfo': 'Contact Information',
  'privacy.contactInfoDesc': 'Email address for delivery of your reading',
  'privacy.paymentInfo': 'Payment Information',
  'privacy.paymentInfoDesc': 'Processed securely through Stripe (we never store your card details)',
  'privacy.section2Title': '2. How We Use Your Information',
  'privacy.section2Intro': 'Your information is used to:',
  'privacy.use1': 'Generate your personalized cosmic pet reading',
  'privacy.use2': 'Deliver your reading via email',
  'privacy.use3': 'Process payments and refunds',
  'privacy.use4': 'Respond to customer support inquiries',
  'privacy.use5': 'Improve our service',
  'privacy.section3Title': '3. Data Storage & Security',
  'privacy.section3Content': 'Your data is stored securely using industry-standard encryption. We use Supabase for data storage and Stripe for payment processing, both of which maintain strict security standards.',
  'privacy.section4Title': '4. Data Sharing',
  'privacy.section4Intro': 'We do not sell, trade, or rent your personal information to third parties. We only share data with service providers necessary to operate our business:',
  'privacy.stripe': 'Payment processing',
  'privacy.resend': 'Email delivery',
  'privacy.section5Title': '5. Cookies',
  'privacy.section5Content': 'We use minimal cookies to track affiliate referrals (30-day duration) and maintain session state. We do not use tracking cookies for advertising purposes.',
  'privacy.section6Title': '6. Your Rights',
  'privacy.section6Intro': 'You have the right to:',
  'privacy.right1': 'Request access to your personal data',
  'privacy.right2': 'Request correction of inaccurate data',
  'privacy.right3': 'Request deletion of your data',
  'privacy.right4': 'Opt out of marketing communications',
  'privacy.section7Title': '7. Data Retention',
  'privacy.section7Content': 'We retain your pet reading and associated data indefinitely so you can access your report at any time. You may request deletion of your data by contacting us.',
  'privacy.section8Title': '8. Children\'s Privacy',
  'privacy.section8Content': 'Our service is not directed to children under 13. We do not knowingly collect information from children under 13.',
  'privacy.section9Title': '9. Changes to This Policy',
  'privacy.section9Content': 'We may update this policy from time to time. We will notify you of significant changes via email or through our website.',
  'privacy.section10Title': '10. Contact Us',
  'privacy.section10Content': 'For privacy-related questions or to exercise your rights, contact us at',
  
  // Common
  'common.loading': 'Loading...',
  'common.error': 'Something went wrong',
  'common.tryAgain': 'Try Again',
  'common.selectLanguage': 'Select Language',
};

// Cache key for localStorage
const CACHE_KEY = 'translations_cache_v1';

interface TranslationCache {
  [language: string]: {
    translations: Record<string, string>;
    timestamp: number;
  };
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Record<string, string>>(englishTranslations);
  const [isLoading, setIsLoading] = useState(false);

  // Load cached translations from localStorage
  const loadCache = useCallback((): TranslationCache => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }, []);

  // Save translations to cache
  const saveToCache = useCallback((lang: Language, trans: Record<string, string>) => {
    try {
      const cache = loadCache();
      cache[lang] = {
        translations: trans,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('Failed to save translations cache:', e);
    }
  }, [loadCache]);

  // Fetch translations from edge function
  const fetchTranslations = useCallback(async (targetLang: Language): Promise<Record<string, string>> => {
    if (targetLang === 'en') {
      return englishTranslations;
    }

    // Check cache first (valid for 24 hours)
    const cache = loadCache();
    const cached = cache[targetLang];
    const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
    const ONE_DAY = 24 * 60 * 60 * 1000;

    if (cached && cacheAge < ONE_DAY) {
      console.log(`Using cached ${targetLang} translations`);
      return { ...englishTranslations, ...cached.translations };
    }

    console.log(`Fetching ${targetLang} translations via AI...`);
    setIsLoading(true);

    try {
      // Get all English texts that need translation
      const textsToTranslate = Object.values(englishTranslations);
      
      // Call the translate edge function
      const { data, error } = await supabase.functions.invoke('translate', {
        body: {
          texts: textsToTranslate,
          targetLanguage: targetLang,
        },
      });

      if (error) {
        console.error('Translation error:', error);
        return englishTranslations;
      }

      // Map translated texts back to keys
      const translatedMap: Record<string, string> = {};
      Object.entries(englishTranslations).forEach(([key, englishText]) => {
        translatedMap[key] = data.translations[englishText] || englishText;
      });

      // Save to cache
      saveToCache(targetLang, translatedMap);

      return translatedMap;
    } catch (e) {
      console.error('Failed to fetch translations:', e);
      return englishTranslations;
    } finally {
      setIsLoading(false);
    }
  }, [loadCache, saveToCache]);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      const trans = await fetchTranslations(language);
      setTranslations(trans);
    };
    loadTranslations();
  }, [language, fetchTranslations]);

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && languages.find(l => l.code === saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  // Set initial direction
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
    let text = translations[key] || englishTranslations[key] || key;
    
    // Handle replacements like {name}, {count}, etc.
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
      });
    }
    
    return text;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
