/* ------------------------------------------------------------------
   Built-in default content.
   Used until you add your own content in the admin dashboard.
   Sample projects are clearly labelled "Sample concept" on the site.
------------------------------------------------------------------- */

export const CATEGORIES = [
  { key: 'logos', label: 'Logos & Banners' },
  { key: 'thumbnails', label: 'YouTube Thumbnails' },
  { key: 'websites', label: 'Website Development' },
  { key: 'cv', label: 'CV & Resume Design' },
  { key: 'graphic', label: 'All Graphic Design' },
  { key: 'motion', label: 'Motion Graphics' },
];

export const DESIGN = {
  primary: '#2455FF',
  secondary: '#7366FF',
  navy: '#08143C',
  bg1: '#E9EBFF',
  bg2: '#F5F8FF',
  lavender: '#DCDFFF',
  gradient: 'lavender',          // lavender | ice | dusk | midnight
  theme: 'light',                // light | dark
  headingFont: 'Space Grotesk',
  bodyFont: 'Inter',
  headingScale: 1,               // 0.8 – 1.3
  buttonShape: 'pill',           // pill | rounded | square
  radius: 24,                    // card radius in px
  shadow: 'soft',                // none | soft | deep
  navStyle: 'glass',             // glass | solid
  heroLayout: 'split',           // split | centered
  animSpeed: 1,                  // 0.5 (fast) – 1.8 (slow)
  animIntensity: 2,              // 0 off · 1 subtle · 2 full
  spacing: 1,                    // 0.7 – 1.4
  cursor: true,
  sections: {
    order: ['featured', 'about', 'process', 'skills', 'testimonials', 'cta'],
    hidden: [],
  },
};

export const WHATSAPP = {
  number: '923228037525',
  display: '+92 322 8037525',
  defaultMessage: 'Hello SHAH DESIGNS, I would like to discuss a project.',
  floatEnabled: true,
  tooltip: "Let's Discuss Your Project",
  widgetTitle: 'Chat With SHAH DESIGNS',
  widgetText: "Have a project in mind? Let's bring your idea to life.",
  ctaText: 'Continue on WhatsApp',
  navCta: "Let's Talk",
};

export const CONTENT = {
  hero: {
    badge: 'Creative Designer & Digital Studio',
    lines: ['GREAT *DESIGN*', 'EXPERIENCE', 'BUILDS *BETTER* BRANDS'],
    text: 'Creative designs, powerful digital experiences and professional solutions that bring your ideas to life.',
    swipeText: 'Swipe to Explore',
    secondaryCta: 'View Portfolio',
    portrait: '',
  },
  swipe: {
    loop: true,
    hint: 'Drag, swipe or use ← → keys',
  },
  about: {
    name: 'SHAH DESIGNS',
    role: 'Creative Designer & Web Developer',
    intro: 'SHAH DESIGNS is a creative studio for logos, thumbnails, websites, CVs and every kind of graphic design.',
    overview: 'I help businesses, creators and individuals turn ideas into clear, memorable visuals — from a first logo sketch to a fully responsive website. Every project starts with understanding what you need, and ends with files you can use with confidence.',
    philosophy: 'Good design is clear before it is clever. I focus on strong hierarchy, honest typography and details that make a brand feel trustworthy.',
    specializations: ['Logo & brand identity', 'YouTube thumbnails', 'Websites & landing pages', 'CV & resume design', 'Social media & print', 'Motion graphics'],
    photo: '',
    resume: '',
    location: '',
  },
  tools: [
    { name: 'Adobe Photoshop', short: 'Ps', color: '#31A8FF', bg: '#001E36', visible: true },
    { name: 'Adobe Illustrator', short: 'Ai', color: '#FF9A00', bg: '#330000', visible: true },
    { name: 'Adobe After Effects', short: 'Ae', color: '#9999FF', bg: '#00005B', visible: true },
    { name: 'Adobe Premiere Pro', short: 'Pr', color: '#9999FF', bg: '#00005B', visible: true },
    { name: 'Figma', short: 'Fg', color: '#FFFFFF', bg: '#1E1E1E', visible: true },
    { name: 'Canva', short: 'Cv', color: '#FFFFFF', bg: '#00C4CC', visible: true },
    { name: 'Blender', short: 'Bl', color: '#FFFFFF', bg: '#E87D0D', visible: true },
    { name: 'HTML · CSS · JS', short: '</>', color: '#FFFFFF', bg: '#2455FF', visible: true },
  ],
  skills: ['Brand identity', 'Typography', 'Layout & composition', 'Colour systems', 'Thumbnail storytelling', 'Responsive web design', 'UI/UX', 'Motion graphics'],
  process: [
    { title: 'Discover', text: 'We talk about your goals, audience and style so the brief is crystal clear.' },
    { title: 'Conceptualize', text: 'Moodboards, sketches and directions — you choose the route that fits.' },
    { title: 'Design', text: 'The chosen concept is refined in detail, with revisions until it feels right.' },
    { title: 'Deliver', text: 'Final files in every format you need, ready for print, web and social.' },
  ],
  cta: {
    title: 'Have a project in mind?',
    text: 'Tell me what you need — logo, thumbnail, website, CV or any design — and get a reply on WhatsApp.',
    button: 'Start a Project',
  },
  footer: {
    tagline: 'Logos, thumbnails, websites, CVs and graphic design that help brands stand out.',
    copyright: 'SHAH DESIGNS',
  },
};

export const SOCIAL = {
  instagram: '',
  behance: '',
  linkedin: '',
  dribbble: '',
  facebook: '',
  youtube: '',
  email: 'saimsajjadshah40@gmail.com',
};

export const SEO = {
  siteTitle: 'SHAH DESIGNS',
  description: 'SHAH DESIGNS — logo & banner design, YouTube thumbnails, websites, CV & resume design and all graphic design services.',
  keywords: 'graphic designer, logo design, thumbnail design, web developer, CV design, SHAH DESIGNS',
  ogImage: '/assets/img/og.png',
  favicon: '/assets/img/favicon.svg',
  pages: {
    home: { title: 'SHAH DESIGNS — Great Design Builds Better Brands', description: '' },
    about: { title: 'About — SHAH DESIGNS', description: '' },
    services: { title: 'Services — SHAH DESIGNS', description: '' },
    portfolio: { title: 'Portfolio — SHAH DESIGNS', description: '' },
    motion: { title: 'Motion Graphics — SHAH DESIGNS', description: '' },
    contact: { title: 'Contact — SHAH DESIGNS', description: '' },
  },
};

/* The five swipe slides */
export const SLIDES = [
  {
    $id: 'logo-banner',
    order: 1, published: true,
    visual: 'logo',
    label: 'Logo & Banner',
    eyebrow: 'LOGO & BANNER DESIGN',
    title: 'Your Brand Deserves a Powerful Identity.',
    highlight: 'Powerful Identity',
    description: 'Creating memorable logos, professional banners and distinctive brand visuals that make businesses stand out.',
    services: ['Professional Logo Design', 'Business Logo Design', 'Brand Identity Design', 'YouTube Banner Design', 'Facebook Cover Design', 'LinkedIn Banner Design', 'Website Banner Design', 'Promotional Banner Design', 'Business Branding Kits'],
    ctaText: 'Explore Logo Designs',
    ctaLink: '/portfolio?cat=logos',
    waText: 'Order on WhatsApp',
    waMessage: 'Hello SHAH DESIGNS, I am interested in your Logo & Banner Design services. Please share the details.',
    bgFrom: '#E9EBFF', bgTo: '#F5F8FF',
    animation: 'depth',
    category: 'logos',
    image: '',
  },
  {
    $id: 'thumbnails',
    order: 2, published: true,
    visual: 'thumb',
    label: 'Thumbnails',
    eyebrow: 'PROFESSIONAL THUMBNAIL DESIGN',
    title: 'Thumbnails That Make People Click.',
    highlight: 'Make People Click',
    description: 'Eye-catching thumbnails created to communicate your content clearly and stand out across digital platforms.',
    services: ['YouTube Thumbnails', 'Gaming Thumbnails', 'Educational Video Thumbnails', 'Podcast Thumbnails', 'Tech Video Thumbnails', 'Business Video Thumbnails', 'Social Media Video Covers', 'Reel Cover Designs'],
    ctaText: 'View Thumbnail Portfolio',
    ctaLink: '/portfolio?cat=thumbnails',
    waText: 'Order on WhatsApp',
    waMessage: 'Hello SHAH DESIGNS, I need professional thumbnail designs. Please share your packages.',
    bgFrom: '#E6E8FF', bgTo: '#FBEFFF',
    animation: 'slide',
    category: 'thumbnails',
    image: '',
  },
  {
    $id: 'web-development',
    order: 3, published: true,
    visual: 'web',
    label: 'Web Development',
    eyebrow: 'WEB DESIGN & DEVELOPMENT',
    title: 'Websites That Look Great and Work Better.',
    highlight: 'Work Better',
    description: 'Modern, responsive and engaging websites designed to showcase your brand and create better digital experiences.',
    services: ['Portfolio Websites', 'Business Websites', 'Landing Pages', 'Personal Websites', 'Agency Websites', 'E-commerce Websites', 'Responsive Web Design', 'UI/UX Design', 'Website Redesign', 'Admin Dashboard Development'],
    ctaText: 'Explore Websites',
    ctaLink: '/portfolio?cat=websites',
    waText: 'Discuss Your Website',
    waMessage: 'Hello SHAH DESIGNS, I want to discuss a website development project. Please guide me.',
    bgFrom: '#E1EAFF', bgTo: '#F3F7FF',
    animation: 'rise',
    category: 'websites',
    image: '',
  },
  {
    $id: 'cv-resume',
    order: 4, published: true,
    visual: 'cv',
    label: 'CV & Resume',
    eyebrow: 'CV & RESUME DESIGN',
    title: 'Present Your Career Professionally.',
    highlight: 'Professionally',
    description: 'Professional CVs, resumes and career documents designed to present qualifications, experience and skills clearly.',
    services: ['ATS-Friendly CVs', 'Professional Resume Writing', 'Executive CVs', 'Fresh Graduate CVs', 'International CVs', 'Europass CV Formatting', 'Cover Letters', 'LinkedIn Profile Optimization', 'Resume Redesign', 'Professional Career Documents'],
    ctaText: 'Explore CV Samples',
    ctaLink: '/portfolio?cat=cv',
    waText: 'Get Your CV Made',
    waMessage: 'Hello SHAH DESIGNS, I need a professional CV or resume. Please share your service details.',
    bgFrom: '#EDF0FA', bgTo: '#FFFFFF',
    animation: 'depth',
    category: 'cv',
    image: '',
  },
  {
    $id: 'graphic-design',
    order: 5, published: true,
    visual: 'graphic',
    label: 'Graphic Design',
    eyebrow: 'ALL GRAPHIC DESIGN SERVICES',
    title: 'Every Creative Idea Deserves Great Design.',
    highlight: 'Great Design',
    description: 'Complete graphic design solutions for businesses, creators and individuals who want professional visual communication.',
    services: ['Visiting Card Design', 'Business Card Design', 'Poster Design', 'Flyer Design', 'Brochure Design', 'Social Media Post Design', 'Instagram Post Design', 'Facebook Ad Creatives', 'Packaging Design', 'Product Label Design', 'Menu Design', 'Invitation Card Design', 'Certificate Design', 'ID Card Design', 'Presentation Design', 'Infographic Design', 'Stationery Design', 'Advertisement Design', 'Motion Graphics', 'Custom Graphic Design'],
    ctaText: 'View All Designs',
    ctaLink: '/portfolio?cat=graphic',
    waText: 'Start Your Design Project',
    waMessage: 'Hello SHAH DESIGNS, I need graphic design services. I would like to discuss my project.',
    bgFrom: '#ECE5FF', bgTo: '#FFF0E6',
    animation: 'zoom',
    category: 'graphic',
    image: '',
  },
];

/* Services (services page + detail pages) */
export const SERVICES = [
  {
    $id: 'svc-logo', slug: 'logo-banner-design', order: 1, published: true,
    name: 'Logo & Banner Design', icon: 'pen', category: 'logos',
    short: 'Memorable logos, banners and brand kits that make your business recognisable.',
    description: 'A strong identity makes every touchpoint feel connected. I design logos that work at every size, plus banners and covers for YouTube, Facebook, LinkedIn and your website — all sharing one consistent visual language.',
    includes: ['Professional & business logos', 'Brand identity & colour palette', 'YouTube, Facebook & LinkedIn banners', 'Website & promotional banners', 'Business branding kits'],
    price: '', image: '',
    waMessage: 'Hello SHAH DESIGNS, I need a logo or banner design.',
  },
  {
    $id: 'svc-thumb', slug: 'thumbnail-design', order: 2, published: true,
    name: 'Thumbnail Design', icon: 'play', category: 'thumbnails',
    short: 'Bold, readable thumbnails for YouTube, podcasts, reels and more.',
    description: 'A thumbnail has a second to explain your video. I design clear, high-contrast thumbnails with strong focal points and readable text, tailored to your channel style.',
    includes: ['YouTube & gaming thumbnails', 'Educational & tech video thumbnails', 'Podcast covers', 'Business video thumbnails', 'Reel & social video covers'],
    price: '', image: '',
    waMessage: 'Hello SHAH DESIGNS, I am interested in thumbnail design services.',
  },
  {
    $id: 'svc-web', slug: 'web-development', order: 3, published: true,
    name: 'Web Design & Development', icon: 'monitor', category: 'websites',
    short: 'Responsive websites and landing pages that look great on every screen.',
    description: 'From portfolios to business sites and landing pages, I design and build fast, responsive websites — and can add an admin dashboard so you can update content yourself.',
    includes: ['Portfolio & personal websites', 'Business & agency websites', 'Landing pages', 'E-commerce websites', 'UI/UX design & redesigns', 'Admin dashboard development'],
    price: '', image: '',
    waMessage: 'Hello SHAH DESIGNS, I want to develop a professional website.',
  },
  {
    $id: 'svc-cv', slug: 'cv-resume-design', order: 4, published: true,
    name: 'CV & Resume Design', icon: 'file', category: 'cv',
    short: 'Clear, professional CVs, resumes and cover letters.',
    description: 'A well-structured CV makes your experience easy to scan. I write and format CVs, resumes and cover letters with clean layouts, including ATS-friendly and Europass formats. (No CV service can guarantee interviews — but a clear document gives you the best start.)',
    includes: ['ATS-friendly CV formatting', 'Professional resume writing', 'Executive & fresh graduate CVs', 'International & Europass CVs', 'Cover letters', 'LinkedIn profile optimization'],
    price: '', image: '',
    waMessage: 'Hello SHAH DESIGNS, I need a professional CV or resume.',
  },
  {
    $id: 'svc-graphic', slug: 'graphic-design', order: 5, published: true,
    name: 'All Graphic Design', icon: 'layers', category: 'graphic',
    short: 'Visiting cards, posters, flyers, social posts, packaging and more.',
    description: 'Whatever you need to print or post, I design it: visiting cards, posters, flyers, brochures, social media creatives, packaging, menus, invitations, certificates and complete stationery sets.',
    includes: ['Visiting & business cards', 'Posters, flyers & brochures', 'Social media posts & ad creatives', 'Packaging & product labels', 'Menus, invitations & certificates', 'Presentations & infographics'],
    price: '', image: '',
    waMessage: 'Hello SHAH DESIGNS, I need graphic design services.',
  },
  {
    $id: 'svc-motion', slug: 'motion-graphics', order: 6, published: true,
    name: 'Motion Graphics', icon: 'video', category: 'motion',
    short: 'Logo reveals, animated posts and short motion pieces.',
    description: 'Motion makes a brand feel alive. I create logo animations, animated social posts, intros and short promotional motion graphics.',
    includes: ['Logo reveal animations', 'Animated social media posts', 'YouTube intros & outros', 'Promotional motion graphics'],
    price: '', image: '',
    waMessage: 'Hello SHAH DESIGNS, I am interested in motion graphics.',
  },
];

const S = '/assets/img/samples/';
/* Sample projects — shown only until you publish your own projects */
export const PROJECTS = [
  {
    $id: 's1', slug: 'sample-monogram-identity', order: 1, published: true, featured: true, sample: true,
    title: 'Monogram Brand Identity', category: 'logos',
    cover: S + 'logo-identity.svg', gallery: [S + 'logo-identity.svg', S + 'banner-set.svg'],
    client: 'Self-initiated concept', date: '', tools: ['Illustrator', 'Photoshop'],
    description: 'A sample identity system showing how a geometric monogram extends into colours, banners and stationery.',
    objectives: 'Create a mark that stays legible from favicon size to a large banner.',
    process: 'Explored letterform sketches, built the mark on a grid, then tested it across light and dark backgrounds.',
    outcome: 'A flexible logo system with primary, secondary and icon versions.',
    video: '', link: '',
  },
  {
    $id: 's2', slug: 'sample-youtube-banner-set', order: 2, published: true, featured: false, sample: true,
    title: 'Channel Banner Set', category: 'logos',
    cover: S + 'banner-set.svg', gallery: [S + 'banner-set.svg'],
    client: 'Self-initiated concept', date: '', tools: ['Photoshop'],
    description: 'A sample banner set for YouTube, Facebook and LinkedIn sharing one visual system.',
    objectives: 'Keep key text inside every platform’s safe area.', process: 'Designed one master layout, then adapted it per platform.', outcome: 'Consistent banners across three platforms.',
    video: '', link: '',
  },
  {
    $id: 's3', slug: 'sample-tech-thumbnail-pack', order: 3, published: true, featured: true, sample: true,
    title: 'Tech Video Thumbnail Pack', category: 'thumbnails',
    cover: S + 'thumb-tech.svg', gallery: [S + 'thumb-tech.svg', S + 'thumb-podcast.svg'],
    client: 'Self-initiated concept', date: '', tools: ['Photoshop'],
    description: 'Sample thumbnails demonstrating bold typography, contrast and a single clear focal point.',
    objectives: 'Make the topic readable at small mobile sizes.', process: 'Short headline, high contrast, one hero object.', outcome: 'A reusable thumbnail template style.',
    video: '', link: '',
  },
  {
    $id: 's4', slug: 'sample-podcast-thumbnails', order: 4, published: true, featured: false, sample: true,
    title: 'Podcast Episode Covers', category: 'thumbnails',
    cover: S + 'thumb-podcast.svg', gallery: [S + 'thumb-podcast.svg'],
    client: 'Self-initiated concept', date: '', tools: ['Photoshop', 'Illustrator'],
    description: 'A sample series of episode covers with a consistent layout and per-episode colours.',
    objectives: 'Series recognition with room for guest names.', process: 'Built a modular template with swappable colour themes.', outcome: 'An episode cover system.',
    video: '', link: '',
  },
  {
    $id: 's5', slug: 'sample-studio-landing-page', order: 5, published: true, featured: true, sample: true,
    title: 'Studio Landing Page', category: 'websites',
    cover: S + 'web-landing.svg', gallery: [S + 'web-landing.svg'],
    client: 'Self-initiated concept', date: '', tools: ['Figma', 'HTML/CSS/JS'],
    description: 'A sample responsive landing page with a bold hero, service cards and contact section.',
    objectives: 'Clear message above the fold on mobile and desktop.', process: 'Wireframe, visual design in Figma, then a responsive build.', outcome: 'A fast, responsive one-page site.',
    video: '', link: '',
  },
  {
    $id: 's6', slug: 'sample-modern-cv-template', order: 6, published: true, featured: true, sample: true,
    title: 'Modern CV Layout', category: 'cv',
    cover: S + 'cv-modern.svg', gallery: [S + 'cv-modern.svg'],
    client: 'Self-initiated concept', date: '', tools: ['Illustrator', 'Word'],
    description: 'A sample two-column CV layout with clear hierarchy and an ATS-friendly single-column alternative.',
    objectives: 'Make experience easy to scan in seconds.', process: 'Defined a type scale and spacing system before placing content.', outcome: 'A clean, adaptable CV template.',
    video: '', link: '',
  },
  {
    $id: 's7', slug: 'sample-event-poster-series', order: 7, published: true, featured: true, sample: true,
    title: 'Event Poster Series', category: 'graphic',
    cover: S + 'poster-series.svg', gallery: [S + 'poster-series.svg'],
    client: 'Self-initiated concept', date: '', tools: ['Illustrator', 'Photoshop'],
    description: 'A sample poster series exploring bold colour blocks and large typography.',
    objectives: 'Readable from a distance, striking up close.', process: 'Grid-based layouts with a shared typographic system.', outcome: 'Three posters that work individually and as a set.',
    video: '', link: '',
  },
  {
    $id: 's8', slug: 'sample-logo-reveal-animation', order: 8, published: true, featured: false, sample: true,
    title: 'Logo Reveal Animation', category: 'motion',
    cover: S + 'motion-reveal.svg', gallery: [S + 'motion-reveal.svg'],
    client: 'Self-initiated concept', date: '', tools: ['After Effects'],
    description: 'A sample logo reveal storyboard. Upload your MP4 or add a YouTube/Vimeo link in the admin to show real motion work.',
    objectives: 'A short, smooth reveal for video intros.', process: 'Storyboard, shape animation, easing polish.', outcome: 'A 5-second logo sting.',
    video: '', link: '',
  },
];

export const TESTIMONIALS = []; // Only genuine testimonials you add in the admin are shown.
