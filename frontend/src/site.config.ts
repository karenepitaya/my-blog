import type { SiteConfig } from '~/types'

const config: SiteConfig = {
  site: 'https://blog.karenepitaya.xyz',
  title: 'Karene\'s Blog',
  description: 'A multi-author blog powered by our server public API',
  author: 'Karene Pitayas',
  tags: [
    'Astro',
    'MultiTerm',
    'Blog',
    'karenepitaya'
  ],
  socialCardAvatarImage: './src/content/avatar.jpg',
  font: 'JetBrains Mono Variable',
  pageSize: 6,
  trailingSlashes: false,
  navLinks: [
    {
      name: 'Home',
      url: '/',
      external: undefined
    },
    {
      name: 'About',
      url: '/about',
      external: undefined
    },
    {
      name: 'Archive',
      url: '/posts',
      external: undefined
    },
    {
      name: 'GitHub',
      url: 'https://github.com/karenepitaya',
      external: true
    }
  ],
  themes: {
    mode: 'select',
    default: 'catppuccin-mocha',
    include: [
      'andromeeda',
      'aurora-x',
      'ayu-dark',
      'catppuccin-frappe',
      'catppuccin-latte',
      'catppuccin-macchiato',
      'catppuccin-mocha',
      'dark-plus',
      'dracula',
      'dracula-soft',
      'everforest-dark',
      'everforest-light',
      'github-dark',
      'github-dark-default',
      'github-dark-dimmed',
      'github-dark-high-contrast',
      'github-light',
      'github-light-default',
      'github-light-high-contrast',
      'gruvbox-dark-hard',
      'gruvbox-dark-medium',
      'gruvbox-dark-soft',
      'gruvbox-light-hard',
      'gruvbox-light-medium',
      'gruvbox-light-soft',
      'houston',
      'kanagawa-dragon',
      'kanagawa-lotus',
      'kanagawa-wave',
      'laserwave',
      'light-plus',
      'material-theme',
      'material-theme-darker',
      'material-theme-lighter',
      'material-theme-ocean',
      'material-theme-palenight',
      'min-dark',
      'min-light',
      'monokai',
      'night-owl',
      'nord',
      'one-dark-pro',
      'one-light',
      'plastic',
      'poimandres',
      'red',
      'rose-pine',
      'rose-pine-moon',
      'rose-pine-dawn',
      'slack-dark',
      'slack-ochin',
      'snazzy-light',
      'solarized-dark',
      'solarized-light',
      'synthwave-84',
      'tokyo-night',
      'vesper',
      'vitesse-black',
      'vitesse-dark',
      'vitesse-light'
    ],
    overrides: undefined
  },
  socialLinks: {
    github: 'https://github.com/karenepitaya',
    twitter: 'https://github.com/karenepitaya',
    mastodon: 'https://github.com/karenepitaya',
    bluesky: 'https://github.com/karenepitaya',
    linkedin: 'https://github.com/karenepitaya',
    email: 'https://github.com/karenepitaya'
  },
  characters: {
    owl: '/owl.webp',
    unicorn: '/unicorn.webp',
    duck: '/duck.webp'
  },
  giscus: undefined
}

export default config
