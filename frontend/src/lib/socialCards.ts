import siteConfig from '~/site.config'
import { Resvg } from '@resvg/resvg-js'
import satori, { type SatoriOptions } from 'satori'
import { html } from 'satori-html'
import { resolveThemeColorStyles } from '~/utils'
import path from 'path'
import fs from 'fs'
import type { ReactNode } from 'react'

const fontPath = path.resolve(
  './node_modules/@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf',
)
const fontData = fs.readFileSync(fontPath)

const avatarPath = path.resolve(siteConfig.socialCardAvatarImage)
let avatarBase64: string | undefined
if (
  fs.existsSync(avatarPath) &&
  (path.extname(avatarPath).toLowerCase() === '.jpg' ||
    path.extname(avatarPath).toLowerCase() === '.jpeg')
) {
  const avatarData = fs.readFileSync(avatarPath)
  avatarBase64 = `data:image/jpeg;base64,${avatarData.toString('base64')}`
}

const defaultTheme =
  siteConfig.themes.default === 'auto'
    ? siteConfig.themes.include[0]
    : siteConfig.themes.default

const themeStyles = await resolveThemeColorStyles(
  [defaultTheme],
  siteConfig.themes.overrides,
)
const bg = themeStyles[defaultTheme]?.background
const fg = themeStyles[defaultTheme]?.foreground
const accent = themeStyles[defaultTheme]?.accent

if (!bg || !fg || !accent) {
  throw new Error(`Theme ${defaultTheme} does not have required colors`)
}

const ogOptions: SatoriOptions = {
  fonts: [
    {
      data: fontData,
      name: 'JetBrains Mono',
      style: 'normal',
      weight: 400,
    },
  ],
  height: 630,
  width: 1200,
}

const markup = (title: string, pubDate: string | undefined, author: string) =>
  html(`<div tw="flex flex-col max-w-full justify-center h-full bg-[${bg}] text-[${fg}] p-12">
    <div style="border-width: 12px; border-radius: 80px;" tw="flex items-center max-w-full p-8 border-[${accent}]/30">
      ${
        avatarBase64
          ? `<div tw="flex flex-col justify-center items-center w-1/3 h-100">
            <img src="${avatarBase64}" tw="flex w-full rounded-full border-[${accent}]/30" />
        </div>`
          : ''
      }
      <div tw="flex flex-1 flex-col max-w-full justify-center items-center">
        ${pubDate ? `<p tw="text-3xl max-w-full text-[${accent}]">${pubDate}</p>` : ''}
        <h1 tw="text-6xl my-14 text-center leading-snug">${title}</h1>
        ${author !== title ? `<p tw="text-4xl text-[${accent}]">${author}</p>` : ''}
      </div>
    </div>
  </div>`)

export async function renderSocialCardPng(input: {
  title: string
  pubDate?: string
  author: string
}): Promise<Uint8Array> {
  const svg = await satori(
    markup(input.title, input.pubDate, input.author) as ReactNode,
    ogOptions,
  )
  return new Resvg(svg).render().asPng()
}

