import { presetHeroPatterns } from '@julr/unocss-preset-heropatterns'
import extratorUna from '@una-ui/extractor-vue-script'
import presetUna from '@una-ui/preset'
import prefixes from '@una-ui/preset/prefixes'
import { defineConfig, presetAttributify, presetIcons, presetWebFonts, presetWind3, transformerDirectives, transformerVariantGroup } from 'unocss'
import presetAnimations from 'unocss-preset-animations'

export default defineConfig({
  presets: [
    presetWind3(),
    presetIcons(),
    presetUna(),
    presetAttributify(),
    presetAnimations(),
    presetHeroPatterns(),
    presetWebFonts({
      fonts: {
        sans: {
          name: 'Inter',
          weights: [400, 500, 600, 700]
        }
      }
    })
  ],
  extractors: [
    extratorUna({
      prefixes
    })
  ],
  transformers: [transformerVariantGroup(), transformerDirectives()],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        'app/(components|src)/**/*.{js,ts}'
      ]
    }
  }
})
