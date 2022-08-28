
console.log('service_worker.js LOADING');

// https://developers.google.com/web/fundamentals/primers/service-workers
// One subtlety with the register() method is the location of the service worker file. You'll notice in this
// case that the service worker file is at the root of the domain. This means that the service worker's scope
// will be the entire origin. In other words, this service worker will receive fetch events for everything on
// this domain. If we register the service worker file at /example/sw.js, then the service worker would only
// see fetch events for pages whose URL starts with /example/ (i.e. /example/page1/, /example/page2/).
// for flask thats /application/static 
//
// for github.io?
// https://gist.github.com/kosamari/7c5d1e8449b2fbc97d372675f16b566e
// depends if you are using /docs/  or /master/
// /paycheck/

let verion_numner_passed_in = '00.03';

const CACHE_NAME = `paycheck-gitio-cache_${verion_numner_passed_in}`;  // TODO add version number for ServWrkr updates

// run
// build_cache_file_list.py from /paycheck/docs
// to create updated list

// dont cache SW - changes to SW force and update of SW and consequently caches - update version above
//'/paycheck/service_worker.js',  // https://stackoverflow.com/questions/55027512/should-i-cache-the-serviceworker-file-in-a-pwa
const FILES_TO_CACHE = [
  '/paycheck/static/paycheck.css',
  '/paycheck/static/paycheck.js',
  '/paycheck/static/manifest.webmanifest',
  '/paycheck/static/focus.js',
  '/paycheck/static/icons/favicon-16x16.png',
  '/paycheck/static/icons/mstile-310x310.png',
  '/paycheck/static/icons/android-chrome-384x384.png',
  '/paycheck/static/icons/mstile-144x144.png',
  '/paycheck/static/icons/safari-pinned-tab.svg',
  '/paycheck/static/icons/favicon.ico',
  '/paycheck/static/icons/apple-touch-icon-120x120.png',
  '/paycheck/static/icons/android-chrome-192x192.png',
  '/paycheck/static/icons/apple-touch-icon.png',
  '/paycheck/static/icons/android-chrome-256x256.png',
  '/paycheck/static/icons/mstile-70x70.png',
  '/paycheck/static/icons/apple-touch-icon-152x152.png',
  '/paycheck/static/icons/apple-touch-icon-180x180.png',
  '/paycheck/static/icons/mstile-310x150.png',
  '/paycheck/static/icons/apple-touch-icon-76x76.png',
  '/paycheck/static/icons/android-chrome-512x512.png',
  '/paycheck/static/icons/mstile-150x150.png',
  '/paycheck/static/icons/android-chrome-36x36.png',
  '/paycheck/static/icons/android-chrome-96x96.png',
  '/paycheck/static/icons/android-chrome-72x72.png',
  '/paycheck/static/icons/apple-touch-icon-60x60.png',
  '/paycheck/static/icons/browserconfig.xml',
  '/paycheck/static/icons/android-chrome-48x48.png',
  '/paycheck/static/icons/favicon-32x32.png',
  '/paycheck/static/icons/android-chrome-144x144.png',
];


self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      console.log(`[ServiceWorker] No of FILES_TO_CACHE:${FILES_TO_CACHE.length}`);
      
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});


self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {               // DELETE all caches EXCEPT the one just created!
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});


// fetch event - service network requests 
//self.addEventListener('fetch', function(event) {
//  event.respondWith(fetch(event.request));          // pass request to network
//});

// fetch event - network only w/ OFFLINE page
//self.addEventListener('fetch', (evt) => {
//  if (evt.request.mode !== 'navigate') {
//    return;
//  }
//  evt.respondWith(fetch(evt.request).catch(() => {
//      return caches.open(CACHE_NAME).then((cache) => {
//        return cache.match('static/offline.html');
//      });
//    })
//  );
//});

// fetch event - Cache falling back to network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
