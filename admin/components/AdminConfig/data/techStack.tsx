import React from 'react';

// Import Professional Icon Sets from React Icons via ESM
import { 
  FaLinux, FaWindows, FaApple, FaAndroid, FaUbuntu, FaDocker, FaAws, FaGitAlt, 
  FaPython, FaJava, FaPhp, FaRust, FaReact, FaVuejs, FaAngular, FaNodeJs,
  FaHtml5, FaCss3Alt, FaSass, FaBootstrap, FaSwift
} from 'react-icons/fa';

import { 
  SiDebian, SiRaspberrypi, SiArduino, SiIntel, SiArm, SiNvidia, 
  SiKubernetes, SiFigma, SiAdobephotoshop, SiAdobeillustrator, SiAdobeaftereffects, SiAutodesk,
  SiGo, SiCplusplus, SiTypescript, SiRuby, 
  SiSvelte, SiAstro, SiTailwindcss, SiNextdotjs, SiThreedotjs,
  SiExpress, SiSpring, SiNestjs, SiGraphql,
  SiMysql, SiPostgresql, SiRedis, SiMongodb, SiSqlite,
  // --- NEW ICONS BELOW ---
  // Cloud & DevOps
  SiGooglecloud, SiFirebase, SiVercel, SiNetlify, SiHeroku, SiTerraform, SiAnsible, SiJenkins, SiGitlab, SiCircleci, SiNginx, SiApache,
  // AI & Data
  SiTensorflow, SiPytorch, SiOpenai, SiPandas, SiNumpy, SiScikitlearn, SiKeras,
  // Frontend & Mobile
  SiVite, SiWebpack, SiBabel, SiMui, SiChakraui, SiRedux, SiFlutter, SiKotlin, SiDart, SiExpo,
  // Backend & Lang
  SiDjango, SiFlask, SiLaravel, SiDotnet, SiScala, SiElixir, SiHaskell,
  // Database
  SiOracle, SiMariadb, SiSupabase, SiApachecassandra,
  // Tools & Blockchain
  SiJira, SiTrello, SiNotion, SiSlack, SiDiscord, SiZoom, SiBitcoin, SiEthereum, SiSolidity
} from 'react-icons/si';

import { BsCpu, BsMotherboard, BsBoxSeam, BsTerminal } from 'react-icons/bs'; 
import { VscVscode, VscAzure } from 'react-icons/vsc';
import { TbBrandCSharp } from 'react-icons/tb';
import { DiMsqlServer } from 'react-icons/di';

// ==========================================
// --- 1. ICON MAPPING ---
// ==========================================
export const TechIcons: Record<string, (props: any) => React.JSX.Element> = {
  // --- SYSTEM (OS) ---
  Linux: (p) => <FaLinux {...p} />,
  Windows: (p) => <FaWindows {...p} />,
  Apple: (p) => <FaApple {...p} />,
  Android: (p) => <FaAndroid {...p} />,
  Ubuntu: (p) => <FaUbuntu {...p} />,
  Debian: (p) => <SiDebian {...p} />,
  
  // --- HARDWARE ---
  RaspberryPi: (p) => <SiRaspberrypi {...p} />,
  Arduino: (p) => <SiArduino {...p} />,
  Intel: (p) => <SiIntel {...p} />,
  ARM: (p) => <SiArm {...p} />,
  FPGA: (p) => <BsMotherboard {...p} />,
  Nvidia: (p) => <SiNvidia {...p} />,
  GenericChip: (p) => <BsCpu {...p} />,

  // --- SOFTWARE / TOOLS ---
  VSCode: (p) => <VscVscode {...p} />,
  Figma: (p) => <SiFigma {...p} />,
  Photoshop: (p) => <SiAdobephotoshop {...p} />,
  Illustrator: (p) => <SiAdobeillustrator {...p} />,
  AfterEffects: (p) => <SiAdobeaftereffects {...p} />,
  Maya: (p) => <SiAutodesk {...p} />,
  CAD: (p) => <SiAutodesk {...p} />,
  Docker: (p) => <FaDocker {...p} />,
  Git: (p) => <FaGitAlt {...p} />,
  
  // --- CLOUD & DEVOPS ---
  AWS: (p) => <FaAws {...p} />,
  Azure: (p) => <VscAzure {...p} />,
  GCP: (p) => <SiGooglecloud {...p} />,
  Firebase: (p) => <SiFirebase {...p} />,
  Vercel: (p) => <SiVercel {...p} />,
  Netlify: (p) => <SiNetlify {...p} />,
  Heroku: (p) => <SiHeroku {...p} />,
  Kubernetes: (p) => <SiKubernetes {...p} />,
  Terraform: (p) => <SiTerraform {...p} />,
  Ansible: (p) => <SiAnsible {...p} />,
  Jenkins: (p) => <SiJenkins {...p} />,
  GitLab: (p) => <SiGitlab {...p} />,
  CircleCI: (p) => <SiCircleci {...p} />,
  Nginx: (p) => <SiNginx {...p} />,
  Apache: (p) => <SiApache {...p} />,

  // --- AI & DATA ---
  TensorFlow: (p) => <SiTensorflow {...p} />,
  PyTorch: (p) => <SiPytorch {...p} />,
  OpenAI: (p) => <SiOpenai {...p} />,
  Pandas: (p) => <SiPandas {...p} />,
  NumPy: (p) => <SiNumpy {...p} />,
  ScikitLearn: (p) => <SiScikitlearn {...p} />,
  Keras: (p) => <SiKeras {...p} />,

  // --- PROGRAMMING LANGUAGES ---
  Python: (p) => <FaPython {...p} />,
  Rust: (p) => <FaRust {...p} />,
  Go: (p) => <SiGo {...p} />,
  Cpp: (p) => <SiCplusplus {...p} />,
  Csharp: (p) => <TbBrandCSharp {...p} />,
  TypeScript: (p) => <SiTypescript {...p} />,
  Java: (p) => <FaJava {...p} />,
  PHP: (p) => <FaPhp {...p} />,
  Ruby: (p) => <SiRuby {...p} />,
  Swift: (p) => <FaSwift {...p} />,
  Kotlin: (p) => <SiKotlin {...p} />,
  Dart: (p) => <SiDart {...p} />,
  Scala: (p) => <SiScala {...p} />,
  Elixir: (p) => <SiElixir {...p} />,
  Haskell: (p) => <SiHaskell {...p} />,

  // --- FRONTEND & MOBILE ---
  React: (p) => <FaReact {...p} />,
  Vue: (p) => <FaVuejs {...p} />,
  Angular: (p) => <FaAngular {...p} />,
  Svelte: (p) => <SiSvelte {...p} />,
  Astro: (p) => <SiAstro {...p} />,
  Tailwind: (p) => <SiTailwindcss {...p} />,
  Nextjs: (p) => <SiNextdotjs {...p} />,
  Threejs: (p) => <SiThreedotjs {...p} />,
  HTML5: (p) => <FaHtml5 {...p} />,
  CSS3: (p) => <FaCss3Alt {...p} />,
  Sass: (p) => <FaSass {...p} />,
  Vite: (p) => <SiVite {...p} />,
  Webpack: (p) => <SiWebpack {...p} />,
  Babel: (p) => <SiBabel {...p} />,
  MUI: (p) => <SiMui {...p} />,
  ChakraUI: (p) => <SiChakraui {...p} />,
  Redux: (p) => <SiRedux {...p} />,
  Flutter: (p) => <SiFlutter {...p} />,
  Expo: (p) => <SiExpo {...p} />,

  // --- BACKEND ---
  Nodejs: (p) => <FaNodeJs {...p} />,
  Express: (p) => <SiExpress {...p} />,
  Spring: (p) => <SiSpring {...p} />,
  NestJS: (p) => <SiNestjs {...p} />,
  GraphQL: (p) => <SiGraphql {...p} />,
  Django: (p) => <SiDjango {...p} />,
  Flask: (p) => <SiFlask {...p} />,
  Laravel: (p) => <SiLaravel {...p} />,
  DotNet: (p) => <SiDotnet {...p} />,

  // --- DATABASE ---
  MySQL: (p) => <SiMysql {...p} />,
  PostgreSQL: (p) => <SiPostgresql {...p} />,
  Redis: (p) => <SiRedis {...p} />,
  MongoDB: (p) => <SiMongodb {...p} />,
  SQLite: (p) => <SiSqlite {...p} />,
  Oracle: (p) => <SiOracle {...p} />,
  MSSQL: (p) => <DiMsqlServer {...p} />,
  MariaDB: (p) => <SiMariadb {...p} />,
  Supabase: (p) => <SiSupabase {...p} />,
  Cassandra: (p) => <SiApachecassandra {...p} />,

  // --- TOOLS & BLOCKCHAIN ---
  Jira: (p) => <SiJira {...p} />,
  Trello: (p) => <SiTrello {...p} />,
  Notion: (p) => <SiNotion {...p} />,
  Slack: (p) => <SiSlack {...p} />,
  Discord: (p) => <SiDiscord {...p} />,
  Zoom: (p) => <SiZoom {...p} />,
  Bitcoin: (p) => <SiBitcoin {...p} />,
  Ethereum: (p) => <SiEthereum {...p} />,
  Solidity: (p) => <SiSolidity {...p} />,

  // --- GENERIC ---
  Generic: (p) => <BsBoxSeam {...p} />,
  Terminal: (p) => <BsTerminal {...p} />
};

export const SvgIcons = TechIcons;

// ==========================================
// --- 2. SKILL DATA CATALOG ---
// ==========================================
export type SkillCategory = 
  | 'System' | 'Hardware' | 'Software' | 'Language' | 'Frontend' 
  | 'Backend' | 'Database' | 'Cloud' | 'AI' | 'DevOps' | 'Mobile' | 'Tools';

export interface SkillDef {
    icon: keyof typeof TechIcons;
    url: string;
    category: SkillCategory;
    color: string;
    bg: string;
    border: string;
}

export const SKILL_LIBRARY: Record<string, SkillDef> = {
    // --- System (OS) ---
    'Linux': { icon: 'Linux', url: 'https://kernel.org', category: 'System', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    'Windows': { icon: 'Windows', url: 'https://microsoft.com/windows', category: 'System', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'macOS': { icon: 'Apple', url: 'https://apple.com/macos', category: 'System', color: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
    'Android': { icon: 'Android', url: 'https://android.com', category: 'System', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    'Ubuntu': { icon: 'Ubuntu', url: 'https://ubuntu.com', category: 'System', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    'Debian': { icon: 'Debian', url: 'https://debian.org', category: 'System', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },

    // --- Hardware ---
    'Raspberry Pi': { icon: 'RaspberryPi', url: 'https://raspberrypi.org', category: 'Hardware', color: 'text-pink-500', bg: 'bg-pink-600/10', border: 'border-pink-600/20' },
    'Arduino': { icon: 'Arduino', url: 'https://arduino.cc', category: 'Hardware', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
    'Intel': { icon: 'Intel', url: 'https://intel.com', category: 'Hardware', color: 'text-blue-300', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    'ARM': { icon: 'ARM', url: 'https://arm.com', category: 'Hardware', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'FPGA': { icon: 'FPGA', url: '#', category: 'Hardware', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'Nvidia': { icon: 'Nvidia', url: 'https://nvidia.com', category: 'Hardware', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },

    // --- AI & Data Science (NEW) ---
    'TensorFlow': { icon: 'TensorFlow', url: 'https://tensorflow.org', category: 'AI', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    'PyTorch': { icon: 'PyTorch', url: 'https://pytorch.org', category: 'AI', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    'OpenAI': { icon: 'OpenAI', url: 'https://openai.com', category: 'AI', color: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
    'Pandas': { icon: 'Pandas', url: 'https://pandas.pydata.org', category: 'AI', color: 'text-blue-900', bg: 'bg-blue-800/20', border: 'border-blue-500/20' },
    'NumPy': { icon: 'NumPy', url: 'https://numpy.org', category: 'AI', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'Scikit-Learn': { icon: 'ScikitLearn', url: 'https://scikit-learn.org', category: 'AI', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    'Keras': { icon: 'Keras', url: 'https://keras.io', category: 'AI', color: 'text-red-600', bg: 'bg-red-600/10', border: 'border-red-600/20' },

    // --- Cloud (NEW) ---
    'AWS': { icon: 'AWS', url: 'https://aws.amazon.com', category: 'Cloud', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    'Azure': { icon: 'Azure', url: 'https://azure.microsoft.com', category: 'Cloud', color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-600/20' },
    'GCP': { icon: 'GCP', url: 'https://cloud.google.com', category: 'Cloud', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'Firebase': { icon: 'Firebase', url: 'https://firebase.google.com', category: 'Cloud', color: 'text-yellow-500', bg: 'bg-yellow-600/10', border: 'border-yellow-600/20' },
    'Vercel': { icon: 'Vercel', url: 'https://vercel.com', category: 'Cloud', color: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
    'Netlify': { icon: 'Netlify', url: 'https://netlify.com', category: 'Cloud', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
    'Heroku': { icon: 'Heroku', url: 'https://heroku.com', category: 'Cloud', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },

    // --- DevOps (NEW) ---
    'Docker': { icon: 'Docker', url: 'https://docker.com', category: 'DevOps', color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-600/20' },
    'Kubernetes': { icon: 'Kubernetes', url: 'https://kubernetes.io', category: 'DevOps', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-600/20' },
    'Terraform': { icon: 'Terraform', url: 'https://terraform.io', category: 'DevOps', color: 'text-purple-500', bg: 'bg-purple-600/10', border: 'border-purple-600/20' },
    'Ansible': { icon: 'Ansible', url: 'https://ansible.com', category: 'DevOps', color: 'text-red-500', bg: 'bg-red-600/10', border: 'border-red-600/20' },
    'Jenkins': { icon: 'Jenkins', url: 'https://jenkins.io', category: 'DevOps', color: 'text-slate-300', bg: 'bg-slate-700/20', border: 'border-slate-500/20' },
    'GitLab': { icon: 'GitLab', url: 'https://gitlab.com', category: 'DevOps', color: 'text-orange-500', bg: 'bg-orange-600/10', border: 'border-orange-600/20' },
    'CircleCI': { icon: 'CircleCI', url: 'https://circleci.com', category: 'DevOps', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    'Nginx': { icon: 'Nginx', url: 'https://nginx.org', category: 'DevOps', color: 'text-green-500', bg: 'bg-green-600/10', border: 'border-green-600/20' },
    'Apache': { icon: 'Apache', url: 'https://httpd.apache.org', category: 'DevOps', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },

    // --- Software/Tools ---
    'Git': { icon: 'Git', url: 'https://git-scm.com', category: 'Software', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    'VSCode': { icon: 'VSCode', url: 'https://code.visualstudio.com', category: 'Software', color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-600/20' },
    'Figma': { icon: 'Figma', url: 'https://figma.com', category: 'Software', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'Photoshop': { icon: 'Photoshop', url: 'https://adobe.com', category: 'Software', color: 'text-blue-300', bg: 'bg-blue-900/20', border: 'border-blue-500/30' },
    'Illustrator': { icon: 'Illustrator', url: 'https://adobe.com', category: 'Software', color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30' },
    'AfterEffects': { icon: 'AfterEffects', url: 'https://adobe.com', category: 'Software', color: 'text-purple-500', bg: 'bg-purple-900/20', border: 'border-purple-500/30' },
    'Maya': { icon: 'Maya', url: 'https://autodesk.com', category: 'Software', color: 'text-teal-500', bg: 'bg-teal-600/10', border: 'border-teal-600/20' },

    // --- Tools (NEW) ---
    'Jira': { icon: 'Jira', url: 'https://atlassian.com/software/jira', category: 'Tools', color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-600/20' },
    'Trello': { icon: 'Trello', url: 'https://trello.com', category: 'Tools', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'Notion': { icon: 'Notion', url: 'https://notion.so', category: 'Tools', color: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
    'Slack': { icon: 'Slack', url: 'https://slack.com', category: 'Tools', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'Discord': { icon: 'Discord', url: 'https://discord.com', category: 'Tools', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    'Zoom': { icon: 'Zoom', url: 'https://zoom.us', category: 'Tools', color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-600/20' },
    'Bitcoin': { icon: 'Bitcoin', url: 'https://bitcoin.org', category: 'Tools', color: 'text-orange-500', bg: 'bg-orange-600/10', border: 'border-orange-600/20' },
    'Ethereum': { icon: 'Ethereum', url: 'https://ethereum.org', category: 'Tools', color: 'text-purple-300', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
    'Solidity': { icon: 'Solidity', url: 'https://soliditylang.org', category: 'Language', color: 'text-slate-300', bg: 'bg-slate-700/10', border: 'border-slate-500/20' },

    // --- Languages ---
    'Python': { icon: 'Python', url: 'https://python.org', category: 'Language', color: 'text-yellow-300', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    'Rust': { icon: 'Rust', url: 'https://rust-lang.org', category: 'Language', color: 'text-orange-600', bg: 'bg-orange-700/10', border: 'border-orange-700/20' },
    'Go': { icon: 'Go', url: 'https://go.dev', category: 'Language', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'C++': { icon: 'Cpp', url: 'https://isocpp.org', category: 'Language', color: 'text-blue-600', bg: 'bg-blue-700/10', border: 'border-blue-700/20' },
    'C#': { icon: 'Csharp', url: 'https://docs.microsoft.com/en-us/dotnet/csharp/', category: 'Language', color: 'text-purple-500', bg: 'bg-purple-600/10', border: 'border-purple-600/20' },
    'TypeScript': { icon: 'TypeScript', url: 'https://typescriptlang.org', category: 'Language', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'Java': { icon: 'Java', url: 'https://java.com', category: 'Language', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    'PHP': { icon: 'PHP', url: 'https://www.php.net', category: 'Language', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'Ruby': { icon: 'Ruby', url: 'https://www.ruby-lang.org', category: 'Language', color: 'text-red-600', bg: 'bg-red-600/10', border: 'border-red-600/20' },
    'Swift': { icon: 'Swift', url: 'https://swift.org', category: 'Language', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    'Kotlin': { icon: 'Kotlin', url: 'https://kotlinlang.org', category: 'Language', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'Dart': { icon: 'Dart', url: 'https://dart.dev', category: 'Language', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'Scala': { icon: 'Scala', url: 'https://scala-lang.org', category: 'Language', color: 'text-red-500', bg: 'bg-red-600/10', border: 'border-red-600/20' },
    'Elixir': { icon: 'Elixir', url: 'https://elixir-lang.org', category: 'Language', color: 'text-purple-600', bg: 'bg-purple-700/10', border: 'border-purple-700/20' },
    'Haskell': { icon: 'Haskell', url: 'https://www.haskell.org', category: 'Language', color: 'text-purple-300', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },

    // --- Frontend ---
    'HTML5': { icon: 'HTML5', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', category: 'Frontend', color: 'text-orange-500', bg: 'bg-orange-600/10', border: 'border-orange-600/20' },
    'CSS3': { icon: 'CSS3', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', category: 'Frontend', color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-600/20' },
    'Sass': { icon: 'Sass', url: 'https://sass-lang.com', category: 'Frontend', color: 'text-pink-500', bg: 'bg-pink-600/10', border: 'border-pink-600/20' },
    'React': { icon: 'React', url: 'https://react.dev', category: 'Frontend', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'Vue': { icon: 'Vue', url: 'https://vuejs.org', category: 'Frontend', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'Angular': { icon: 'Angular', url: 'https://angular.io', category: 'Frontend', color: 'text-red-500', bg: 'bg-red-600/10', border: 'border-red-600/20' },
    'Svelte': { icon: 'Svelte', url: 'https://svelte.dev', category: 'Frontend', color: 'text-orange-500', bg: 'bg-orange-600/10', border: 'border-orange-600/20' },
    'Astro': { icon: 'Astro', url: 'https://astro.build', category: 'Frontend', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'Next.js': { icon: 'Nextjs', url: 'https://nextjs.org', category: 'Frontend', color: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
    'Tailwind': { icon: 'Tailwind', url: 'https://tailwindcss.com', category: 'Frontend', color: 'text-cyan-300', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
    'Three.js': { icon: 'Threejs', url: 'https://threejs.org', category: 'Frontend', color: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
    'Vite': { icon: 'Vite', url: 'https://vitejs.dev', category: 'Frontend', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    'Webpack': { icon: 'Webpack', url: 'https://webpack.js.org', category: 'Frontend', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'Babel': { icon: 'Babel', url: 'https://babeljs.io', category: 'Frontend', color: 'text-yellow-500', bg: 'bg-yellow-600/10', border: 'border-yellow-600/20' },
    'MUI': { icon: 'MUI', url: 'https://mui.com', category: 'Frontend', color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-600/20' },
    'ChakraUI': { icon: 'ChakraUI', url: 'https://chakra-ui.com', category: 'Frontend', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
    'Redux': { icon: 'Redux', url: 'https://redux.js.org', category: 'Frontend', color: 'text-purple-600', bg: 'bg-purple-700/10', border: 'border-purple-700/20' },

    // --- Mobile (NEW) ---
    'Flutter': { icon: 'Flutter', url: 'https://flutter.dev', category: 'Mobile', color: 'text-cyan-500', bg: 'bg-cyan-600/10', border: 'border-cyan-600/20' },
    'React Native': { icon: 'React', url: 'https://reactnative.dev', category: 'Mobile', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'Expo': { icon: 'Expo', url: 'https://expo.dev', category: 'Mobile', color: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },

    // --- Backend ---
    'Node.js': { icon: 'Nodejs', url: 'https://nodejs.org', category: 'Backend', color: 'text-green-500', bg: 'bg-green-600/10', border: 'border-green-600/20' },
    'Express': { icon: 'Express', url: 'https://expressjs.com', category: 'Backend', color: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
    'Spring': { icon: 'Spring', url: 'https://spring.io', category: 'Backend', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    'NestJS': { icon: 'NestJS', url: 'https://nestjs.com', category: 'Backend', color: 'text-red-500', bg: 'bg-red-600/10', border: 'border-red-600/20' },
    'GraphQL': { icon: 'GraphQL', url: 'https://graphql.org', category: 'Backend', color: 'text-pink-500', bg: 'bg-pink-600/10', border: 'border-pink-600/20' },
    'Django': { icon: 'Django', url: 'https://djangoproject.com', category: 'Backend', color: 'text-green-600', bg: 'bg-green-700/10', border: 'border-green-700/20' },
    'Flask': { icon: 'Flask', url: 'https://flask.palletsprojects.com', category: 'Backend', color: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
    'Laravel': { icon: 'Laravel', url: 'https://laravel.com', category: 'Backend', color: 'text-red-500', bg: 'bg-red-600/10', border: 'border-red-600/20' },
    '.NET': { icon: 'DotNet', url: 'https://dotnet.microsoft.com', category: 'Backend', color: 'text-purple-500', bg: 'bg-purple-600/10', border: 'border-purple-600/20' },

    // --- Database ---
    'MySQL': { icon: 'MySQL', url: 'https://mysql.com', category: 'Database', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    'PostgreSQL': { icon: 'PostgreSQL', url: 'https://www.postgresql.org', category: 'Database', color: 'text-blue-300', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    'Redis': { icon: 'Redis', url: 'https://redis.io', category: 'Database', color: 'text-red-500', bg: 'bg-red-600/10', border: 'border-red-600/20' },
    'MongoDB': { icon: 'MongoDB', url: 'https://mongodb.com', category: 'Database', color: 'text-green-500', bg: 'bg-green-600/10', border: 'border-green-600/20' },
    'SQLite': { icon: 'SQLite', url: 'https://sqlite.org', category: 'Database', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    'Oracle': { icon: 'Oracle', url: 'https://oracle.com/database', category: 'Database', color: 'text-red-600', bg: 'bg-red-700/10', border: 'border-red-700/20' },
    'MSSQL': { icon: 'MSSQL', url: 'https://microsoft.com/sql-server', category: 'Database', color: 'text-red-500', bg: 'bg-red-600/10', border: 'border-red-600/20' },
    'MariaDB': { icon: 'MariaDB', url: 'https://mariadb.org', category: 'Database', color: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
    'Supabase': { icon: 'Supabase', url: 'https://supabase.com', category: 'Database', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    'Cassandra': { icon: 'Cassandra', url: 'https://cassandra.apache.org', category: 'Database', color: 'text-blue-300', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
};

export const DEFAULT_SKILLS = [
    'React', 'TypeScript', 'Node.js', 'Rust', 'Docker', 'Linux', 'VSCode'
];