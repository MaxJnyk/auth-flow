import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    // Основной файл
    index: 'src/index.ts',
    // Файл для тестирования
    testing: 'src/testing.ts',
    // Основные модули
    core: 'src/core.ts',
    fingerprint: 'src/infrastructure/services/fingerprint.service.ts',
    // Субпути для более гранулярного импорта
    'adapters/react': 'src/adapters/react/index.ts',
    'adapters/react-hooks': 'src/adapters/react/hooks/index.ts',
    'adapters/react-providers': 'src/adapters/react/providers/index.ts',
    'adapters/react-lazy': 'src/adapters/react/lazy/index.ts',
    'adapters/telegram': 'src/adapters/telegram/index.ts',
    'infrastructure/http': 'src/infrastructure/http/index.ts',
    'infrastructure/storage': 'src/infrastructure/storage/index.ts',
    utils: 'src/utils/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: {
    preset: 'recommended',
    moduleSideEffects: false,
  },
  minify: true,
  external: ['react', 'react-dom', 'axios', 'cookies-next', 'zod'],
  esbuildOptions(options) {
    options.jsx = 'transform'
    options.target = ['es2020', 'node14']
    options.platform = 'browser'
    options.pure = ['console.log', 'console.info', 'console.debug']
    options.legalComments = 'none'
  },
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    }
  },
})
