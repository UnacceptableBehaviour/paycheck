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

let verion_numner_passed_in = '00.08';  // < - - - - - - - - - - - - - - - - - - - - - - //
                                                                                          //
const CACHE_NAME = `paycheck-gitio-cache_${verion_numner_passed_in}`;                     //
                                                                                          //
// * * * * * * * * * * * * * * * * * * * * * * * * * * *                                  //
// run                                                                                    //
// build_cache_file_list.py from /paycheck/docs                                           //
// to create updated list                                                                 //
// * * * * * * * * * * * * * * * * * * * * * * * * * * *                                  //
// DONT cache SW - changes to SW force an update of SW, and consequently caches - UPDATE VERSION ABOVE
//'/paycheck/service_worker.js',  // https://stackoverflow.com/questions/55027512/should-i-cache-the-serviceworker-file-in-a-pwa
const FILES_TO_CACHE = [
  '/',
  '/paycheck/',
  '/paycheck/favicon.ico',
  '/paycheck/index.html',
  '/paycheck/apple-touch-icon.png',
  '/paycheck/static/paycheck.css',
  '/paycheck/static/paycheck.js',
  '/paycheck/static/manifest.local',
  '/paycheck/static/focus.js',
  '/paycheck/static/manifest.webmanifest',
  '/paycheck/static/images/screenshot_sml.jpg',
  '/paycheck/static/app_icons/favicon-16x16.png',
  '/paycheck/static/app_icons/android-chrome-384x384.png',
  '/paycheck/static/app_icons/safari-pinned-tab.svg',
  '/paycheck/static/app_icons/favicon.ico',
  '/paycheck/static/app_icons/apple-touch-icon-120x120.png',
  '/paycheck/static/app_icons/android-chrome-192x192.png',
  '/paycheck/static/app_icons/apple-touch-icon.png',
  '/paycheck/static/app_icons/android-chrome-256x256.png',
  '/paycheck/static/app_icons/mstile-70x70.png',
  '/paycheck/static/app_icons/apple-touch-icon-152x152.png',
  '/paycheck/static/app_icons/apple-touch-icon-180x180.png',
  '/paycheck/static/app_icons/payCheckIconMain512x512.svg',
  '/paycheck/static/app_icons/apple-touch-icon-76x76.png',
  '/paycheck/static/app_icons/android-chrome-512x512.png',
  '/paycheck/static/app_icons/mstile-150x150.png',
  '/paycheck/static/app_icons/android-chrome-36x36.png',
  '/paycheck/static/app_icons/android-chrome-96x96.png',
  '/paycheck/static/app_icons/android-chrome-72x72.png',
  '/paycheck/static/app_icons/apple-touch-icon-60x60.png',
  '/paycheck/static/app_icons/browserconfig.xml',
  '/paycheck/static/app_icons/android-chrome-48x48.png',
  '/paycheck/static/app_icons/favicon-32x32.png',
  '/paycheck/static/app_icons/android-chrome-144x144.png',
  '/paycheck/static/icons/hol-right.png',
  '/paycheck/static/icons/email-svgrepo-com.png',
  '/paycheck/static/icons/hol-left.svg',
  '/paycheck/static/icons/hol-left.png',
  '/paycheck/static/icons/email-svgrepo-com.svg',
  '/paycheck/static/icons/hol-right.svg',
];

console.log(`service_worker.js V:${CACHE_NAME}`);

self.addEventListener('install', (evt) => {
  console.log(`[ServiceWorker] Install V:${CACHE_NAME}`);
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      console.log(`[ServiceWorker] No of FILES_TO_CACHE:${FILES_TO_CACHE.length}`);
      FILES_TO_CACHE.forEach( file => {
          console.log(`[SW] caching: ${file}`);
          try {
            cache.add(file);
          } catch(e) {
            consoel.log(`FAILED TO CACHE: ${file} ERR:${e}`);
          }          
        }
      );
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
var fc = 0;

self.addEventListener('fetch', function(event) {
  fc += 1;
  console.log(`[SW] fetch:${fc}`);
  console.log(event);
  
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
  
});
