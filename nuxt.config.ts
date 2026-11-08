export default defineNuxtConfig({
  devtools: {
    enabled: false
  },
  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    '@vee-validate/nuxt',
    '@una-ui/nuxt'
  ],
  una: {
    prefix: 'N',
    global: true
  },
  nitro: {
    imports: {
      dirs: ['server/utils/**']
    },
    experimental: {
      tasks: true
    }
  },
  unocss: {
    preflight: true
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        lib: ['ESNext', 'DOM', 'DOM.Iterable']
      }
    }
  },
  routeRules: {
    '/dashboard': { redirect: '/' }
  },
  compatibilityDate: '2026-06-09'
})
