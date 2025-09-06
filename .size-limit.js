module.exports = [
  {
    name: 'Основной бандл',
    path: 'dist/index.js',
    limit: '30 KB', // Реальный размер ~24.6 KB
  },
  {
    name: 'React адаптеры',
    path: 'dist/adapters/react.js',
    limit: '5 KB', // Реальный размер ~4.31 KB
  },
  {
    name: 'HTTP инфраструктура',
    path: 'dist/infrastructure/http.js',
    limit: '15 KB', // Реальный размер ~12.71 KB
  },
  {
    name: 'Хранилище токенов',
    path: 'dist/infrastructure/storage.js',
    limit: '1.5 KB', // Реальный размер ~937 B
  },
  {
    name: 'Утилиты',
    path: 'dist/utils.js',
    limit: '3 KB', // Реальный размер ~2.19 KB
  },
  {
    name: 'ESM бандл',
    path: 'dist/index.mjs',
    limit: '1 KB', // Реальный размер ~645 B
  },
  {
    name: 'Telegram адаптер',
    path: 'dist/adapters/telegram.js',
    limit: '4 KB', // лимит для мониторинга
  },
]
