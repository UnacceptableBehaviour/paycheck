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

const KEY_SW_INFO = 'sw_info'; // must match in paycheck.js!
const SERVICE_WORKER_VERSION = '00.38';  // < - - - - - - - - - - - - - - - - - - - - - - //
                                                                                          //
const CACHE_NAME = `paycheck-gitio-cache_${SERVICE_WORKER_VERSION}`;                      //
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
  '/paycheck/static/focus.js',
  '/paycheck/static/manifest.webmanifest',
  '/paycheck/static/assets/images/QR-code-w-icon-noShort.png',
  '/paycheck/static/assets/images/screenshot.png',
  '/paycheck/static/assets/app_icons/favicon.ico',
  '/paycheck/static/assets/app_icons/payCheckIcon-192.png',
  '/paycheck/static/assets/app_icons/apple-touch-icon.png',
  '/paycheck/static/assets/app_icons/mstile-70x70.png',
  '/paycheck/static/assets/app_icons/payCheckIcon-512.png',
  '/paycheck/static/assets/app_icons/payCheckIcon.svg',
  '/paycheck/static/assets/app_icons/mstile-150x150.png',
  '/paycheck/static/assets/app_icons/browserconfig.xml',
  '/paycheck/static/assets/icons/hol-right.png',
  '/paycheck/static/assets/icons/debug.svg',
  '/paycheck/static/assets/icons/email-svgrepo-com.png',
  '/paycheck/static/assets/icons/butn-UP.svg',
  '/paycheck/static/assets/icons/hol-left.svg',
  '/paycheck/static/assets/icons/hol-left.png',
  '/paycheck/static/assets/icons/email-svgrepo-com.svg',
  '/paycheck/static/assets/icons/debug.png',
  '/paycheck/static/assets/icons/hol-right.svg',
  '/paycheck/static/assets/icons/calculator.png',
  '/paycheck/static/assets/icons/butn-DWN.svg',
  '/paycheck/static/assets/icons/calculator.svg',
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
      return; //cache.addAll(FILES_TO_CACHE);
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

// allow retrieval of SW version from paycheck.js
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_SW_VERSION') {
    event.ports[0].postMessage({ version: SERVICE_WORKER_VERSION });
  }
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

// self.addEventListener('fetch', function(event) {
//   fc += 1;
//   console.log(`[SW] fetch:${fc}`);
//   console.log(event.request.url);
//   console.log(event);
  
//   event.respondWith(
//     caches.match(event.request).then(function(response) {
//       return response || fetch(event.request);
//     })
//   );
  
// });

self.addEventListener('fetch', function(event) {
  fc += 1;
  console.log(`[SW] fetch:${fc}`);
  console.log(event.request.url);
  console.log(event);
  
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
      return fetch(event.request).then(function(networkResponse) {
        return networkResponse;
      }).catch(function(error) {
        console.error('Fetching failed:', error);
        throw error;
      });
    })
  );
});
