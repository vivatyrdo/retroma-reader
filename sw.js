const CACHE_NAME = 'retroma-reader-v1';

// Список файлов, которые мы хотим кэшировать
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/db.js',
    './js/library.js',
    './js/reader.js',
    './manifest.json',
    // Внешние библиотеки (чтобы работали оффлайн)
    'https://unpkg.com/@phosphor-icons/web',
    'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js'
];

// 1. Установка Service Worker (кэширование файлов)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Кэширование всех ресурсов');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Активация (удаление старых кэшей, если мы обновим версию)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Удаление старого кэша', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

// 3. Перехват запросов (если файл есть в кэше — берем оттуда, если нет — качаем)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Если нашли в кэше, возвращаем его
            if (cachedResponse) {
                return cachedResponse;
            }
            // Если нет, идем в сеть
            return fetch(event.request);
        })
    );
});