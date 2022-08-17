
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
// /js_canvas_IO_docs/

let verion_numner_passed_in = '00.03';

const CACHE_NAME = `dtk-gitio-cache_${verion_numner_passed_in}`;  // TODO add version number for ServWrkr updates

// run
// build_cache_file_list.py from /js_canvas_IO_docs/docs
// to create updated list

// dont cache SW - chanes to SW force and update of SW and consequently caches - update version above
//'/js_canvas_IO_docs/service_worker.js',  // https://stackoverflow.com/questions/55027512/should-i-cache-the-serviceworker-file-in-a-pwa
const FILES_TO_CACHE = [
  '/js_canvas_IO_docs/static/offline.html',
  '/js_canvas_IO_docs/static/favicon.ico',
  '/js_canvas_IO_docs/static/manifest.json',
  '/js_canvas_IO_docs/static/css/bootstrap.min.css',
  '/js_canvas_IO_docs/static/css/recipe_dtk_multi.css',
  '/js_canvas_IO_docs/static/css/styles.css',
  '/js_canvas_IO_docs/static/css/weigh_in.css',
  '/js_canvas_IO_docs/static/images/s&p pork arancini.jpg',
  '/js_canvas_IO_docs/static/images/20170918_164301_banh_xeo.jpg',
  '/js_canvas_IO_docs/static/images/20200528_163128_guinea fowl tagine w couscous & salad.jpg',
  '/js_canvas_IO_docs/static/images/20200528_161914_green leaf & orange beet.jpg',
  '/js_canvas_IO_docs/static/images/mathPaint.png',
  '/js_canvas_IO_docs/static/images/20200313_133803_couscous chermoula partner.jpg',
  '/js_canvas_IO_docs/static/images/20200313_133803_chermoula.jpg',
  '/js_canvas_IO_docs/static/images/20200313_133803_guinea fowl tagine.jpg',
  '/js_canvas_IO_docs/static/images/20200625_224208_kofte & couscous salad sandwich.jpg',
  '/js_canvas_IO_docs/static/images/svg/cog.svg',
  '/js_canvas_IO_docs/static/images/svg/home.svg',
  '/js_canvas_IO_docs/static/images/svg/weigh_in.svg',
  '/js_canvas_IO_docs/static/images/svg/pencil.svg',
  '/js_canvas_IO_docs/static/images/svg/snap.svg',
  '/js_canvas_IO_docs/static/images/svg/graph.svg',
  '/js_canvas_IO_docs/static/images/svg/check1.svg',
  '/js_canvas_IO_docs/static/images/svg/heart.svg',
  '/js_canvas_IO_docs/static/images/png/home.png',
  '/js_canvas_IO_docs/static/images/png/cog.png',
  '/js_canvas_IO_docs/static/images/png/search.png',
  '/js_canvas_IO_docs/static/images/png/heart.png',
  '/js_canvas_IO_docs/static/images/png/check1.png',
  '/js_canvas_IO_docs/static/images/png/snap.png',
  '/js_canvas_IO_docs/static/images/png/pencil.png',
  '/js_canvas_IO_docs/static/images/png/edit.png',
  '/js_canvas_IO_docs/static/images/png/weigh_in.png',
  '/js_canvas_IO_docs/static/images/icons/icon-192x192.png',
  '/js_canvas_IO_docs/static/images/icons/icon-32x32.png',
  '/js_canvas_IO_docs/static/images/icons/icon-256x256.png',
  '/js_canvas_IO_docs/static/images/icons/icon-152x152.png',
  '/js_canvas_IO_docs/static/images/icons/icon-512x512.png',
  '/js_canvas_IO_docs/static/images/icons/icon-144x144.png',
  '/js_canvas_IO_docs/static/images/icons/icon-128x128.png',
  '/js_canvas_IO_docs/static/html/home.html',
  '/js_canvas_IO_docs/static/html/recipe_dtk_multi.html',
  '/js_canvas_IO_docs/static/html/weigh_in.html',
  '/js_canvas_IO_docs/static/html/blank.html',
  '/js_canvas_IO_docs/static/html/recipe.html',
  '/js_canvas_IO_docs/static/html/tracker.html',
  '/js_canvas_IO_docs/static/html/snap.html',
  '/js_canvas_IO_docs/static/html/mathPaint.html',
  '/js_canvas_IO_docs/static/js_modules/module_page_snap.js',
  '/js_canvas_IO_docs/static/js_modules/module_page_diffusion.js',
  '/js_canvas_IO_docs/static/js_modules/module_page_mathPaint.js',
  '/js_canvas_IO_docs/static/js_modules/weigh_in.js',
  '/js_canvas_IO_docs/static/js_modules/navbarMod.js',
  '/js_canvas_IO_docs/static/js_modules/module_page_home.js',
  '/js_canvas_IO_docs/static/js_modules/module_page_tracker.js',
  '/js_canvas_IO_docs/static/js_modules/module_page_flock.js',
  '/js_canvas_IO_docs/static/js_modules/module_page_mathPaintCanvas.js',
  '/js_canvas_IO_docs/static/js_modules/dtk_storage.js',
  '/js_canvas_IO_docs/static/js_modules/module_page_blank.js',
  '/js_canvas_IO_docs/static/js_modules/module_page_randomTarget.js',
  '/js_canvas_IO_docs/static/js_modules/app.js',
  '/js_canvas_IO_docs/static/js_modules/module_page_weigh_in.js',
  '/js_canvas_IO_docs/static/js_modules/content/u8_fp_flock.js',
  '/js_canvas_IO_docs/static/js_modules/content/index.html',
  '/js_canvas_IO_docs/static/js_modules/content/u9_fp_random_target.js',
  '/js_canvas_IO_docs/static/js_modules/content/recipe_dtk_multi.js',
  '/js_canvas_IO_docs/static/js_modules/content/require_random.js',
  '/js_canvas_IO_docs/static/js_modules/content/mathTiles.js',
  '/js_canvas_IO_docs/static/js_modules/content/u10_fp_math_functions.js',
  '/js_canvas_IO_docs/static/js_modules/content/u7_fp_diffusion_port.js',
  '/js_canvas_IO_docs/static/js_modules/content/u8_fp_flock_port.js',
  '/js_canvas_IO_docs/static/js_modules/content/u7_fp_diffusion.js',
  '/js_canvas_IO_docs/static/js_modules/content/u9_fp_random_target_port.js',
  '/js_canvas_IO_docs/static/js_modules/content/blankCanvas.js',
  '/js_canvas_IO_docs/static/js_modules/content/mathTilesCanvas.js',
  '/js_canvas_IO_docs/static/js_modules/content/lib/algos_sftest.js',
  '/js_canvas_IO_docs/static/js_modules/content/lib/algos_sftest/index.js',
  '/js_canvas_IO_docs/static/js_modules/content/lib/algos_sftest/package.json',
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
