import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation files
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    'nav.howItWorks': 'How it Works',
    'nav.testimonials': 'Testimonials',
    'nav.faq': 'FAQ',
    'nav.gift': 'Gift a Reading',
    'nav.getReading': 'Get Your Reading',
    
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
    
    // Intake
    'intake.letsBegin': 'Let\'s Begin Your Cosmic Journey',
    'intake.petName': 'What\'s your pet\'s name?',
    'intake.petNamePlaceholder': 'Enter their name...',
    'intake.species': 'What kind of companion are they?',
    'intake.breed': 'What breed is',
    'intake.breedPlaceholder': 'Search breeds...',
    'intake.gender': 'Is {name} a boy or girl?',
    'intake.boy': 'Boy',
    'intake.girl': 'Girl',
    'intake.dob': 'When was {name} born?',
    'intake.dobApprox': 'Approximate date is fine!',
    'intake.location': 'Where was {name} born?',
    'intake.locationPlaceholder': 'City or region...',
    'intake.soul': 'Which describes {name}\'s soul?',
    'intake.superpower': 'What\'s {name}\'s superpower?',
    'intake.strangers': 'How does {name} act with strangers?',
    'intake.email': 'Where should we send the cosmic report?',
    'intake.emailPlaceholder': 'your@email.com',
    'intake.continue': 'Continue',
    'intake.back': 'Back',
    
    // Checkout
    'checkout.title': 'Choose Your Cosmic Package',
    'checkout.basic': 'Basic Reading',
    'checkout.premium': 'Premium Reading',
    'checkout.vip': 'VIP Experience',
    'checkout.popular': 'Most Popular',
    'checkout.bestValue': 'Best Value',
    'checkout.unlock': 'Unlock Report',
    'checkout.addGift': 'Add as a Gift',
    'checkout.volumeDiscount': 'Volume discount:',
    
    // Report
    'report.generating': 'Consulting the Stars...',
    'report.generatingDesc': 'The cosmos is aligning to reveal {name}\'s true nature',
    'report.download': 'Download PDF',
    'report.share': 'Share',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.tryAgain': 'Try Again',
    'common.selectLanguage': 'Select Language',
  },
  es: {
    // Navbar
    'nav.howItWorks': 'Cómo Funciona',
    'nav.testimonials': 'Testimonios',
    'nav.faq': 'Preguntas',
    'nav.gift': 'Regalar una Lectura',
    'nav.getReading': 'Obtén Tu Lectura',
    
    // Hero - Landing Page
    'hero.badge': '✨ Más de 10,000 Padres de Mascotas Confían',
    'hero.title': 'Descubre el Alma Detrás de Esos Ojos',
    'hero.subtitle': 'El 92% de los padres de mascotas dicen que esta lectura cósmica reveló algo profundo sobre su vínculo. Descubre el verdadero propósito de tu mascota en 60 segundos.',
    'hero.cta': 'Revela Su Retrato Cósmico',
    'hero.ctaSubtext': '🌟 Entrega digital instantánea • 100% personalizado',
    'hero.trustpilot': 'Excelente',
    'hero.reviews': 'Basado en 2,847 reseñas',
    'hero.mostPopular': 'Más Popular',
    'hero.perfectGift': 'Regalo Perfecto',
    'hero.discoverMyPet': 'Descubre Mi Mascota',
    'hero.discoverDesc': 'Desbloquea la personalidad cósmica de tu compañero y profundiza tu vínculo',
    'hero.startDiscovery': 'Iniciar Descubrimiento',
    'hero.giftToFriend': 'Regalar a un Amigo',
    'hero.giftDesc': 'El regalo perfecto para cualquier amante de las mascotas — significativo e inolvidable',
    'hero.sendGift': 'Enviar un Regalo',
    'hero.poweredBy': 'Impulsado por',
    'hero.swissEphemeris': 'datos de Swiss Ephemeris',
    'hero.craftedBy': ', creado por amantes de mascotas devotos',
    'hero.ratedBy': 'Calificado',
    'hero.byPetParents': 'por más de 2,000 Padres de Mascotas',
    
    // Testimonials Section
    'testimonials.title': 'Lo Que Dicen los Padres de Mascotas',
    'testimonials.subtitle': 'Historias reales de padres de mascotas que descubrieron la verdad cósmica de su compañero',
    
    // How it Works
    'howItWorks.title': 'Cómo Funciona',
    'howItWorks.subtitle': 'Tres simples pasos para desbloquear los secretos cósmicos de tu mascota',
    'howItWorks.step1.title': 'Comparte Sus Detalles',
    'howItWorks.step1.desc': 'Cuéntanos sobre tu mascota - su fecha de nacimiento, rasgos de personalidad y qué los hace especiales.',
    'howItWorks.step2.title': 'Consultamos las Estrellas',
    'howItWorks.step2.desc': 'Nuestros algoritmos cósmicos analizan las posiciones planetarias y crean un perfil astrológico único.',
    'howItWorks.step3.title': 'Recibe Tu Informe',
    'howItWorks.step3.desc': 'Obtén un retrato cósmico personalizado bellamente elaborado, entregado instantáneamente a tu correo.',
    
    // FAQ
    'faq.title': 'Preguntas Frecuentes',
    'faq.subtitle': 'Todo lo que necesitas saber sobre la lectura cósmica de tu mascota',
    
    // Footer
    'footer.tagline': 'Revelando el vínculo cósmico entre tú y tu amado compañero.',
    'footer.links': 'Enlaces Rápidos',
    'footer.legal': 'Legal',
    'footer.contact': 'Contacto',
    'footer.privacy': 'Privacidad',
    'footer.terms': 'Términos',
    'footer.becomeAffiliate': 'Conviértete en Afiliado',
    'footer.copyright': '© 2025 The Cosmic Pet Report.',
    
    // Intake
    'intake.letsBegin': 'Comencemos Tu Viaje Cósmico',
    'intake.petName': '¿Cómo se llama tu mascota?',
    'intake.petNamePlaceholder': 'Ingresa su nombre...',
    'intake.species': '¿Qué tipo de compañero es?',
    'intake.breed': '¿Qué raza es',
    'intake.breedPlaceholder': 'Buscar razas...',
    'intake.gender': '¿{name} es niño o niña?',
    'intake.boy': 'Niño',
    'intake.girl': 'Niña',
    'intake.dob': '¿Cuándo nació {name}?',
    'intake.dobApprox': '¡Una fecha aproximada está bien!',
    'intake.location': '¿Dónde nació {name}?',
    'intake.locationPlaceholder': 'Ciudad o región...',
    'intake.soul': '¿Cuál describe el alma de {name}?',
    'intake.superpower': '¿Cuál es el superpoder de {name}?',
    'intake.strangers': '¿Cómo actúa {name} con extraños?',
    'intake.email': '¿A dónde enviamos el informe cósmico?',
    'intake.emailPlaceholder': 'tu@email.com',
    'intake.continue': 'Continuar',
    'intake.back': 'Atrás',
    
    // Checkout
    'checkout.title': 'Elige Tu Paquete Cósmico',
    'checkout.basic': 'Lectura Básica',
    'checkout.premium': 'Lectura Premium',
    'checkout.vip': 'Experiencia VIP',
    'checkout.popular': 'Más Popular',
    'checkout.bestValue': 'Mejor Valor',
    'checkout.unlock': 'Desbloquear Informe',
    'checkout.addGift': 'Agregar como Regalo',
    'checkout.volumeDiscount': 'Descuento por volumen:',
    
    // Report
    'report.generating': 'Consultando las Estrellas...',
    'report.generatingDesc': 'El cosmos se está alineando para revelar la verdadera naturaleza de {name}',
    'report.download': 'Descargar PDF',
    'report.share': 'Compartir',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Algo salió mal',
    'common.tryAgain': 'Intentar de Nuevo',
    'common.selectLanguage': 'Seleccionar Idioma',
  },
  fr: {
    'nav.howItWorks': 'Comment ça Marche',
    'nav.testimonials': 'Témoignages',
    'nav.faq': 'FAQ',
    'nav.gift': 'Offrir une Lecture',
    'nav.getReading': 'Obtenir Votre Lecture',
    'hero.badge': '✨ Plus de 10 000 Parents d\'Animaux Font Confiance',
    'hero.title': 'Découvrez l\'Âme Derrière Ces Yeux',
    'hero.subtitle': '92% des parents d\'animaux disent que cette lecture cosmique a révélé quelque chose de profond sur leur lien. Découvrez le vrai but de votre animal en 60 secondes.',
    'hero.cta': 'Révéler Leur Portrait Cosmique',
    'hero.ctaSubtext': '🌟 Livraison numérique instantanée • 100% personnalisé',
    'hero.trustpilot': 'Excellent',
    'hero.reviews': 'Basé sur 2 847 avis',
    'hero.mostPopular': 'Plus Populaire',
    'hero.perfectGift': 'Cadeau Parfait',
    'hero.discoverMyPet': 'Découvrir Mon Animal',
    'hero.discoverDesc': 'Débloquez la personnalité cosmique de votre compagnon et approfondissez votre lien',
    'hero.startDiscovery': 'Commencer la Découverte',
    'hero.giftToFriend': 'Offrir à un Ami',
    'hero.giftDesc': 'Le cadeau parfait pour tout amoureux des animaux — significatif et inoubliable',
    'hero.sendGift': 'Envoyer un Cadeau',
    'hero.poweredBy': 'Propulsé par',
    'hero.swissEphemeris': 'les données Swiss Ephemeris',
    'hero.craftedBy': ', créé par des amoureux d\'animaux dévoués',
    'hero.ratedBy': 'Noté',
    'hero.byPetParents': 'par plus de 2 000 Parents d\'Animaux',
    'testimonials.title': 'Ce Que Disent les Parents d\'Animaux',
    'testimonials.subtitle': 'Histoires réelles de parents d\'animaux qui ont découvert la vérité cosmique de leur compagnon',
    'howItWorks.title': 'Comment ça Marche',
    'howItWorks.subtitle': 'Trois étapes simples pour débloquer les secrets cosmiques de votre animal',
    'howItWorks.step1.title': 'Partagez Leurs Détails',
    'howItWorks.step1.desc': 'Parlez-nous de votre animal - sa date de naissance, ses traits de personnalité et ce qui le rend spécial.',
    'howItWorks.step2.title': 'Nous Consultons les Étoiles',
    'howItWorks.step2.desc': 'Nos algorithmes cosmiques analysent les positions planétaires et créent un profil astrologique unique.',
    'howItWorks.step3.title': 'Recevez Votre Rapport',
    'howItWorks.step3.desc': 'Obtenez un portrait cosmique personnalisé magnifiquement conçu, livré instantanément dans votre boîte mail.',
    'faq.title': 'Questions Fréquentes',
    'faq.subtitle': 'Tout ce que vous devez savoir sur la lecture cosmique de votre animal',
    'footer.tagline': 'Révéler le lien cosmique entre vous et votre compagnon bien-aimé.',
    'footer.links': 'Liens Rapides',
    'footer.legal': 'Légal',
    'footer.contact': 'Contact',
    'footer.privacy': 'Confidentialité',
    'footer.terms': 'Conditions',
    'footer.becomeAffiliate': 'Devenir Affilié',
    'footer.copyright': '© 2025 The Cosmic Pet Report.',
    'intake.letsBegin': 'Commençons Votre Voyage Cosmique',
    'intake.petName': 'Comment s\'appelle votre animal?',
    'intake.petNamePlaceholder': 'Entrez son nom...',
    'intake.species': 'Quel type de compagnon est-ce?',
    'intake.breed': 'Quelle est la race de',
    'intake.breedPlaceholder': 'Rechercher des races...',
    'intake.gender': '{name} est un garçon ou une fille?',
    'intake.boy': 'Garçon',
    'intake.girl': 'Fille',
    'intake.dob': 'Quand est né(e) {name}?',
    'intake.dobApprox': 'Une date approximative suffit!',
    'intake.location': 'Où est né(e) {name}?',
    'intake.locationPlaceholder': 'Ville ou région...',
    'intake.soul': 'Qu\'est-ce qui décrit l\'âme de {name}?',
    'intake.superpower': 'Quel est le superpouvoir de {name}?',
    'intake.strangers': 'Comment {name} agit-il avec les étrangers?',
    'intake.email': 'Où devons-nous envoyer le rapport cosmique?',
    'intake.emailPlaceholder': 'votre@email.com',
    'intake.continue': 'Continuer',
    'intake.back': 'Retour',
    'checkout.title': 'Choisissez Votre Forfait Cosmique',
    'checkout.basic': 'Lecture de Base',
    'checkout.premium': 'Lecture Premium',
    'checkout.vip': 'Expérience VIP',
    'checkout.popular': 'Plus Populaire',
    'checkout.bestValue': 'Meilleure Valeur',
    'checkout.unlock': 'Débloquer le Rapport',
    'checkout.addGift': 'Ajouter comme Cadeau',
    'checkout.volumeDiscount': 'Remise volume:',
    'report.generating': 'Consultation des Étoiles...',
    'report.generatingDesc': 'Le cosmos s\'aligne pour révéler la vraie nature de {name}',
    'report.download': 'Télécharger PDF',
    'report.share': 'Partager',
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur s\'est produite',
    'common.tryAgain': 'Réessayer',
    'common.selectLanguage': 'Sélectionner la Langue',
  },
  pt: {
    'nav.howItWorks': 'Como Funciona',
    'nav.testimonials': 'Depoimentos',
    'nav.faq': 'FAQ',
    'nav.gift': 'Presentear uma Leitura',
    'nav.getReading': 'Obter Sua Leitura',
    'hero.badge': '✨ Mais de 10.000 Pais de Pets Confiam',
    'hero.title': 'Descubra a Alma Por Trás Desses Olhos',
    'hero.subtitle': '92% dos pais de pets dizem que esta leitura cósmica revelou algo profundo sobre seu vínculo. Descubra o verdadeiro propósito do seu pet em 60 segundos.',
    'hero.cta': 'Revelar Seu Retrato Cósmico',
    'hero.ctaSubtext': '🌟 Entrega digital instantânea • 100% personalizado',
    'hero.trustpilot': 'Excelente',
    'hero.reviews': 'Baseado em 2.847 avaliações',
    'hero.mostPopular': 'Mais Popular',
    'hero.perfectGift': 'Presente Perfeito',
    'hero.discoverMyPet': 'Descobrir Meu Pet',
    'hero.discoverDesc': 'Desbloqueie a personalidade cósmica do seu companheiro e aprofunde seu vínculo',
    'hero.startDiscovery': 'Iniciar Descoberta',
    'hero.giftToFriend': 'Presentear um Amigo',
    'hero.giftDesc': 'O presente perfeito para qualquer amante de pets — significativo e inesquecível',
    'hero.sendGift': 'Enviar um Presente',
    'hero.poweredBy': 'Desenvolvido com',
    'hero.swissEphemeris': 'dados Swiss Ephemeris',
    'hero.craftedBy': ', criado por amantes de pets dedicados',
    'hero.ratedBy': 'Avaliado',
    'hero.byPetParents': 'por mais de 2.000 Pais de Pets',
    'testimonials.title': 'O Que Pais de Pets Dizem',
    'testimonials.subtitle': 'Histórias reais de pais de pets que descobriram a verdade cósmica de seu companheiro',
    'howItWorks.title': 'Como Funciona',
    'howItWorks.subtitle': 'Três passos simples para desbloquear os segredos cósmicos do seu pet',
    'howItWorks.step1.title': 'Compartilhe os Detalhes',
    'howItWorks.step1.desc': 'Conte-nos sobre seu pet - data de nascimento, traços de personalidade e o que os torna especiais.',
    'howItWorks.step2.title': 'Consultamos as Estrelas',
    'howItWorks.step2.desc': 'Nossos algoritmos cósmicos analisam posições planetárias e criam um perfil astrológico único.',
    'howItWorks.step3.title': 'Receba Seu Relatório',
    'howItWorks.step3.desc': 'Receba um retrato cósmico personalizado lindamente elaborado, entregue instantaneamente no seu e-mail.',
    'faq.title': 'Perguntas Frequentes',
    'faq.subtitle': 'Tudo o que você precisa saber sobre a leitura cósmica do seu pet',
    'footer.tagline': 'Revelando o vínculo cósmico entre você e seu amado companheiro.',
    'footer.links': 'Links Rápidos',
    'footer.legal': 'Legal',
    'footer.contact': 'Contato',
    'footer.privacy': 'Privacidade',
    'footer.terms': 'Termos',
    'footer.becomeAffiliate': 'Seja um Afiliado',
    'footer.copyright': '© 2025 The Cosmic Pet Report.',
    'intake.letsBegin': 'Vamos Começar Sua Jornada Cósmica',
    'intake.petName': 'Qual é o nome do seu pet?',
    'intake.petNamePlaceholder': 'Digite o nome...',
    'intake.species': 'Que tipo de companheiro é?',
    'intake.breed': 'Qual é a raça de',
    'intake.breedPlaceholder': 'Buscar raças...',
    'intake.gender': '{name} é menino ou menina?',
    'intake.boy': 'Menino',
    'intake.girl': 'Menina',
    'intake.dob': 'Quando {name} nasceu?',
    'intake.dobApprox': 'Data aproximada está ok!',
    'intake.location': 'Onde {name} nasceu?',
    'intake.locationPlaceholder': 'Cidade ou região...',
    'intake.soul': 'O que descreve a alma de {name}?',
    'intake.superpower': 'Qual é o superpoder de {name}?',
    'intake.strangers': 'Como {name} age com estranhos?',
    'intake.email': 'Para onde enviamos o relatório cósmico?',
    'intake.emailPlaceholder': 'seu@email.com',
    'intake.continue': 'Continuar',
    'intake.back': 'Voltar',
    'checkout.title': 'Escolha Seu Pacote Cósmico',
    'checkout.basic': 'Leitura Básica',
    'checkout.premium': 'Leitura Premium',
    'checkout.vip': 'Experiência VIP',
    'checkout.popular': 'Mais Popular',
    'checkout.bestValue': 'Melhor Valor',
    'checkout.unlock': 'Desbloquear Relatório',
    'checkout.addGift': 'Adicionar como Presente',
    'checkout.volumeDiscount': 'Desconto por volume:',
    'report.generating': 'Consultando as Estrelas...',
    'report.generatingDesc': 'O cosmos está se alinhando para revelar a verdadeira natureza de {name}',
    'report.download': 'Baixar PDF',
    'report.share': 'Compartilhar',
    'common.loading': 'Carregando...',
    'common.error': 'Algo deu errado',
    'common.tryAgain': 'Tentar Novamente',
    'common.selectLanguage': 'Selecionar Idioma',
  },
  ar: {
    'nav.howItWorks': 'كيف يعمل',
    'nav.testimonials': 'الشهادات',
    'nav.faq': 'الأسئلة الشائعة',
    'nav.gift': 'أهدِ قراءة',
    'nav.getReading': 'احصل على قراءتك',
    'hero.badge': '✨ موثوق من قبل أكثر من 10,000 من أولياء الحيوانات الأليفة',
    'hero.title': 'اكتشف',
    'hero.titleHighlight': 'الروح الكونية',
    'hero.subtitle': 'افتح الأسرار الغامضة المكتوبة في النجوم يوم ولادة حيوانك الأليف. رحلة فلكية مخصصة تكشف طبيعتهم الحقيقية وصفاتهم الخفية والرابط الكوني الذي تتشاركونه.',
    'hero.cta': 'اكشف صورتهم الكونية',
    'hero.ctaSubtext': '🌟 توصيل رقمي فوري • مخصص 100%',
    'hero.trustpilot': 'ممتاز',
    'hero.reviews': 'بناءً على 2,847 تقييم',
    'howItWorks.title': 'كيف يعمل',
    'howItWorks.subtitle': 'ثلاث خطوات بسيطة لفتح أسرار حيوانك الأليف الكونية',
    'howItWorks.step1.title': 'شارك تفاصيلهم',
    'howItWorks.step1.desc': 'أخبرنا عن حيوانك الأليف - تاريخ الميلاد، سمات الشخصية، وما يجعلهم مميزين.',
    'howItWorks.step2.title': 'نستشير النجوم',
    'howItWorks.step2.desc': 'خوارزمياتنا الكونية تحلل مواقع الكواكب وتنشئ ملفًا فلكيًا فريدًا.',
    'howItWorks.step3.title': 'استلم تقريرك',
    'howItWorks.step3.desc': 'احصل على صورة كونية مخصصة مصممة بشكل جميل، تُسلم فورًا إلى بريدك الإلكتروني.',
    'testimonials.title': 'ماذا يقول أولياء الحيوانات الأليفة',
    'testimonials.subtitle': 'انضم إلى الآلاف الذين اكتشفوا الحقيقة الكونية لحيواناتهم الأليفة',
    'faq.title': 'الأسئلة الشائعة',
    'faq.subtitle': 'كل ما تحتاج معرفته عن القراءة الكونية لحيوانك الأليف',
    'footer.tagline': 'كشف الرابط الكوني بينك وبين رفيقك المحبوب.',
    'footer.links': 'روابط سريعة',
    'footer.legal': 'قانوني',
    'footer.contact': 'اتصل',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.terms': 'شروط الخدمة',
    'footer.copyright': '© 2024 The Cosmic Pet. جميع الحقوق محفوظة.',
    'intake.letsBegin': 'لنبدأ رحلتك الكونية',
    'intake.petName': 'ما اسم حيوانك الأليف؟',
    'intake.petNamePlaceholder': 'أدخل الاسم...',
    'intake.species': 'ما نوع الرفيق؟',
    'intake.breed': 'ما سلالة',
    'intake.breedPlaceholder': 'ابحث عن السلالات...',
    'intake.gender': 'هل {name} ذكر أم أنثى؟',
    'intake.boy': 'ذكر',
    'intake.girl': 'أنثى',
    'intake.dob': 'متى ولد {name}؟',
    'intake.dobApprox': 'التاريخ التقريبي مقبول!',
    'intake.location': 'أين ولد {name}؟',
    'intake.locationPlaceholder': 'المدينة أو المنطقة...',
    'intake.soul': 'ما الذي يصف روح {name}؟',
    'intake.superpower': 'ما هي القوة الخارقة لـ {name}؟',
    'intake.strangers': 'كيف يتصرف {name} مع الغرباء؟',
    'intake.email': 'أين نرسل التقرير الكوني؟',
    'intake.emailPlaceholder': 'بريدك@email.com',
    'intake.continue': 'متابعة',
    'intake.back': 'رجوع',
    'checkout.title': 'اختر باقتك الكونية',
    'checkout.basic': 'القراءة الأساسية',
    'checkout.premium': 'القراءة المميزة',
    'checkout.vip': 'تجربة VIP',
    'checkout.popular': 'الأكثر شعبية',
    'checkout.bestValue': 'أفضل قيمة',
    'checkout.unlock': 'فتح التقرير',
    'checkout.addGift': 'إضافة كهدية',
    'checkout.volumeDiscount': 'خصم الكمية:',
    'report.generating': 'استشارة النجوم...',
    'report.generatingDesc': 'الكون يصطف ليكشف طبيعة {name} الحقيقية',
    'report.download': 'تحميل PDF',
    'report.share': 'مشاركة',
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ ما',
    'common.tryAgain': 'حاول مرة أخرى',
    'common.selectLanguage': 'اختر اللغة',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('cosmicPetLanguage');
    if (saved && translations[saved as Language]) {
      return saved as Language;
    }
    // Try to detect browser language
    const browserLang = navigator.language.split('-')[0] as Language;
    if (translations[browserLang]) {
      return browserLang;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('cosmicPetLanguage', lang);
    // Set document direction for RTL languages
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
