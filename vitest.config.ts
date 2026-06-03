import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig(async (configEnv) => {
  const resolvedViteConfig = typeof viteConfig === 'function'
    ? await viteConfig(configEnv)
    : viteConfig

  return mergeConfig(
    resolvedViteConfig,
    defineConfig({
    test: {
      environment: 'jsdom',
      environmentOptions: {
        jsdom: {
          url: 'http://localhost/'
        }
      },
      setupFiles: ['src/stores/__tests__/setup.ts'],
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
    }),
  )
})
