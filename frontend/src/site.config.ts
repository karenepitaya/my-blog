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
  faviconUrl: 'https://assets.karenepitaya.xyz/test/blog/image/favicon/2026/01/02/favicon-1767300139451-2092699c.png',
  socialCardAvatarImage: './src/content/avatar.jpg',
  font: 'JetBrains Mono Variable',
  pageSize: 6,
  homePageSize: 6,
  archivePageSize: 6,
  categoryPageSize: 6,
  tagPageSize: 6,
  trailingSlashes: false,
  navLinks: [
    {
      name: 'Home',
      url: '/'
    },
    {
      name: 'About',
      url: '/about'
    },
    {
      name: 'Archive',
      url: '/posts'
    },
    {
      name: 'GitHub',
      url: 'https://github.com/karenepitaya',
      external: true
    }
  ],
  themes: {
    mode: 'light-dark-auto',
    default: 'auto',
    include: [
      'gruvbox-light-soft',
      'rose-pine-moon'
    ]
  },
  socialLinks: {
    github: 'https://github.com/karenepitaya',
    twitter: 'https://github.com/karenepitaya',
    email: 'https://github.com/karenepitaya'
  },
  giscus: null,
  characters: {
    owl: 'https://assets.karenepitaya.xyz/test/blog/image/character_avatar/2026/01/15/59200b25-7cef-48b4-b719-a79baac2ac16.webp',
    unicorn: 'https://assets.karenepitaya.xyz/test/blog/image/character_avatar/2026/01/15/445efd6f-6eda-47b5-baec-4abe8b99607a.webp',
    duck: 'https://assets.karenepitaya.xyz/test/blog/image/character_avatar/2026/01/15/6426679e-1c59-4374-a217-671379e2557c.webp'
  },
  enableSeasonEffect: true,
  seasonEffectType: 'auto',
  seasonEffectIntensity: 0.8,
  enableAnniversaryEffect: false,
  enableAuthorCard: true,
  enableAboutAuthorCard: true,
  enableFooterAuthorCard: true,
  authorCardStyle: 'detailed',
  enableRecommendations: true,
  recommendationMode: 'random',
  recommendationCount: 6,
  enableCharacters: true,
  activeCharacters: [
    {
      id: 'owl',
      name: 'owl',
      avatar: 'https://assets.karenepitaya.xyz/test/blog/image/character_avatar/2026/01/15/59200b25-7cef-48b4-b719-a79baac2ac16.webp',
      enable: true
    },
    {
      id: 'unicorn',
      name: 'unicorn',
      avatar: 'https://assets.karenepitaya.xyz/test/blog/image/character_avatar/2026/01/15/445efd6f-6eda-47b5-baec-4abe8b99607a.webp',
      enable: true
    },
    {
      id: 'duck',
      name: 'duck',
      avatar: 'https://assets.karenepitaya.xyz/test/blog/image/character_avatar/2026/01/15/6426679e-1c59-4374-a217-671379e2557c.webp',
      enable: true
    }
  ],
  siteMode: 'normal',
  maintenance: {
    startAt: '2026-01-21T23:59',
    endAt: '2026-01-22T23:59',
    reason: '测试'
  }
}

export default config
