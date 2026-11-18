/*
 * Service Worker（アプリ本体ファイルのキャッシュのみ）
 * - メニューデータは IndexedDB にあり、ここでは一切キャッシュ・送信しない。
 * - アプリを更新したら CACHE_VERSION を上げる（例：crewmeshi-v1 → crewmeshi-v2）。
 * - 古いキャッシュ（crewmeshi- で始まる別バージョン）だけを削除する。IndexedDB・localStorage には触れない。
 * - プッシュ通知・バックグラウンド同期は実装しない。
 */
var CACHE_VERSION = 'crewmeshi-v1';

var APP_FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/dates.js',
  './js/storage.js',
  './js/validate.js',
  './js/ui.js',
  './js/app.js',
  './js/editor.js',
  './js/manage.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png',
  './sample/sample-2099-01.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(APP_FILES.map(function (u) { return new Request(u, { cache: 'reload' }); }));
    })
  );
  // 自動では有効化しない（画面の「更新する」ボタンで SKIP_WAITING を受け取ってから切り替える）
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf('crewmeshi-') === 0 && k !== CACHE_VERSION) return caches.delete(k);
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部への通信は扱わない（そもそも発生しない）
  var scopePath = new URL(self.registration.scope).pathname;
  if (url.pathname.indexOf(scopePath) !== 0) return;

  if (req.mode === 'navigate') {
    // ページ遷移：キャッシュの index.html を返す（ハッシュ方式なので常に同じHTML）
    event.respondWith(
      caches.match('./index.html', { cacheName: CACHE_VERSION }).then(function (hit) {
        return hit || fetch(req);
      }).catch(function () { return fetch(req); })
    );
    return;
  }
  event.respondWith(
    caches.match(req, { cacheName: CACHE_VERSION, ignoreSearch: true }).then(function (hit) {
      return hit || fetch(req);
    })
  );
});
