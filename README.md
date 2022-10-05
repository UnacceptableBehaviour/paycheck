# paycheck
Single page PWA to add up hours, and work out tax and NI contributions to compare to payroll.
See app here: https://unacceptablebehaviour.github.io/paycheck/

## Contents  
1. [Contents](#contents)  
2. [AIM:](#aim)  
3. [Directory structure & main files](#directory-structure--main-files)  
4. [Create Icon](#create-icon)  
5. [Process ICON file into platform images & manifest file:](#process-icon-file-into-platform-images--manifest-file)  
	1. [Upload SVG (create png assets)](#upload-svg-create-png-assets)  
	2. [Notes on Above](#notes-on-above)  
6. [Adding Manifest](#adding-manifest)  
		1. [Difference manifest.json vs manifest.webmanifest vs site.webmanifest](#difference-manifestjson-vs-manifestwebmanifest-vs-sitewebmanifest)  
		2. [THE MANIFEST](#the-manifest)  
		3. [FIELDS](#fields)  
		4. [Icon paths](#icon-paths)  
		5. [Manifest Difference between "scope": "./" vs "scope": "/"](#manifest-difference-between-scope--vs-scope-)  
		6. [HTML - Icon/Manifest support](#html---iconmanifest-support)  
7. [Service Worker](#service-worker)  
	1. [SCOPE](#scope)  
8. [QUESTIONS / TODO](#questions--todo)  


## AIM:  

PWA appshell  
  
## Directory structure & main files  
```
docs (dir)
    index.html                # entry point
    service_worker.js         # proxy - internet fetch intercept - cache strategies

    static (dir)
        manifest.webmanifest  # phenotype - directs the browser how to present app on device

        paycheck.css          # CSS styling

        paycheck.js           # App.main
        focus.js              # additional function - require / import / include

        assets (dir)          # assets
            app_icons               
            icons
            images

    apple-touch-icon.png      # device icon
    favicon.ico               # device icon
```
  
## Create Icon
This will be the main icon from which all other client facing touch icons are derived.  
Tool: [Inkscape](https://inkscape.org/release/inkscape-1.2.1/) Desktop, Open Source   
File > Document Properties > Page Size > Icon 48x48  
* Custom Size > 512 x 512 px  
* Display in px  
  
Create icon artwork: 
[SVG](https://github.com/UnacceptableBehaviour/paycheck/blob/main/icon/payCheckIconMain512x512.svg)-[PNG](https://github.com/UnacceptableBehaviour/paycheck/blob/main/icon/payCheckIconMain512x512.png)  
The background will be transparent in PNG format.  
  
Export PNG Image...   
* Export Area > Select Page  
* Export As > Choose filename  
Click EXPORT  
  
TODO:  
Understand relationship between DPI and PX in SVG  
What aren't these independent resolution settings?   
Inkscape setting image to 512 x 512 pixels 72 dpi for web  
  
<img src="https://github.com/UnacceptableBehaviour/paycheck/blob/main/icon/payCheckIconMain512x512.png" alt="App Icon" width="180" height="180"/>  
  
## Process ICON file into platform images & manifest file:
There are quite a few site that will do this I used https://realfavicongenerator.net/ [here](https://realfavicongenerator.net/)  
  
### Upload SVG (create png assets)  
Walk various settings using GUI  
  
**Favicon for Desktop Browsers and Google Result Pages**  
Default
  
**Favicon for iOS - Web Clip**  
Add background colour: #008100  
Margin: 0px  
Assets: ios7 & later, Check: declare only hires icon  
  
**Favicon for Android**  
Main Setting > No Change  
Options:  
Standalone  
Start URL:https://unacceptablebehaviour.github.io/paycheck/  
Assets:
Create All  
  
**Windows Metro**  
Use original favicon.  
Use colour: #008100  
Declare assets in ```browserconfig.xml```  
* SML square  
* MED square  
Linked to in index.HTML: ```<meta name="msapplication-config" content="static/assets/app_icons/browserconfig.xml">```  
  
**macOS Safari**  
Turn image into monochrome (this one already is)  
Theme colour #008100  
  
**Favicon Generator Options**  
Path: /static/assets/app_icons
http://example.com/favicon.ico  
Compression:Default  
AppName: payCheck  
Additional files: README.md, html_code.html 
  
**Download zip of items**  

Image files in ```paycheck/docs/static/assets/app_icons```  
favicon.ico in root: ```paycheck/docs```  
apple-touch-icon.png in root: ```paycheck/docs```  
  
### Notes on Above 
This package was generated with [RealFaviconGenerator](https://realfavicongenerator.net/) [v0.16]  (https://realfavicongenerator.net/change_log#v0.16)  
**Icon set Version:** scratch/icon_ideas/20220903_favicon_package_v0.16  
  
|No purpose attribute| "purpose":"maskable"|
|-|-|
![No purpose attribute](https://github.com/UnacceptableBehaviour/paycheck/blob/main/notes/no_purpose.png)|![purpose attribute set to maskable](https://github.com/UnacceptableBehaviour/paycheck/blob/main/notes/maskable.png)  
  
Getting rid of annoying little white fleck on the edge, combination of setting background or theme colour in the manifest and setting the purpose to maskable. TODO quick test of which.

  
**Issues w/ manifest:**  
"theme_color": "#ffffff", SB #008100  
"background_color": "#ffffff", SB #008100  
  
  
**MISSING or WRONG:**  
"id": "/paycheck/",  
"scope": "/paycheck/",  
"start_url": "/paycheck/index.html",  
"orientation": "portrait",  
"description": "Single page PWA - Calculate work hours, tax NI, pension etc for the month. Share results."  
  
**WARNING**  
HTML points to wrong manifest file!  
```
IS
<link rel="manifest" href="static/app_icons/site.webmanifest">
SB
<link rel="manifest" href="static/manifest.webmanifest">
```
   
**WARNING**  
Don't forget to run ```build_cache_file_list.py``` and update SW cache list & version number!  
  
**WARNING**  
Missing from HTML includes (flagged by Lighthouse):
```
<meta name="viewport" content="width=device-width, initial-scale=1">
```
  
Checking the favicon version adds version to a lot of things!  
```
CHECK: http://example.com/favicon.ico
<link rel="apple-touch-icon" sizes="180x180" href="/static/icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/static/icons/favicon-16x16.png">
<link rel="manifest" href="/static/icons/site.webmanifest">
<link rel="mask-icon" href="/static/icons/safari-pinned-tab.svg" color="#008100">
<link rel="shortcut icon" href="/static/icons/favicon.ico">
<meta name="msapplication-config" content="/static/icons/browserconfig.xml">
```
  
**REF:** Maskable Icons https://web.dev/maskable-icon/#what  
**REF:** https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs  
  
## Adding Manifest
REF to spec: [W3 Web Application Manifest](https://w3c.github.io/manifest/#web-application-manifest). 
[Ref Mozilla Clear Concise](https://developer.mozilla.org/en-US/docs/Web/Manifest).  
  
#### Difference manifest.json vs manifest.webmanifest vs site.webmanifest
Apparently no real difference although most comments & the spec lean towards using ```manifest.webmanifest```.  
The important thing to note is it's in JSON format. Lint it here: https://jsonlint.com/
  
**Include manifest from index.html using the following:**  
```
<!-- Startup configuration -->
<link rel="manifest" href="manifest.webmanifest">

<!-- Fallback application metadata for legacy browsers -->
<meta name="application-name" content="payCheck">
<link rel="icon" sizes="16x16 32x32 48x48" href="lo_def.ico">
<link rel="icon" sizes="512x512" href="hi_def.png">
```
  
  
#### THE MANIFEST  
**REF:** [Ref Mozilla Clear Concise](https://developer.mozilla.org/en-US/docs/Web/Manifest).  
  
```
{
  "name": "payCheck",
  "id": "/paycheck/",
  "short_name": "payCheck",
  "description": "Single page PWA - Calculate work hours, tax NI, pension etc for the month. Share results.",
  "icons": [
    {
      "src": "assets/app_icons/payCheckIconMain512x512_sqr.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "assets/app_icons/android-chrome-36x36.png",
      "sizes": "36x36",
      "type": "image/png"
    },
    {
      "src": "assets/app_icons/android-chrome-48x48.png",
      "sizes": "48x48",
      "type": "image/png"
    },
    {
      "src": "assets/app_icons/android-chrome-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "assets/app_icons/android-chrome-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "assets/app_icons/android-chrome-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "assets/app_icons/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/app_icons/android-chrome-256x256.png",
      "sizes": "256x256",
      "type": "image/png"
    },
    {
      "src": "assets/app_icons/android-chrome-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "assets/app_icons/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    } 
  ],
  "screenshots" : [
    {
      "src": "assets/images/screenshot.png",
      "sizes": "320x512",
      "type": "image/webp",
      "platform": "narrow",
      "label": "Home screen"
    }
  ],  
  "theme_color": "#008100",
  "background_color": "#008100",
  "scope": "/paycheck/",
  "start_url": "/paycheck/index.html",
  "display": "standalone",
  "orientation": "portrait" 
}
```

#### FIELDS
**REF:** https://developer.mozilla.org/en-US/docs/Web/Manifest/icons#values

**Screen Shots**  
REF: https://www.apptweak.com/en/aso-blog/app-screenshot-icon-video-guidelines-ios-gp  
Mixed browser support!  
Should be at least 320 x 320  
![screen shot - home screen](https://github.com/UnacceptableBehaviour/paycheck/blob/main/docs/static/assets/images/screenshot.png)  
(image used 320x711)  
  
**ID**  
REF: [Chrome devtools](https://developer.chrome.com/blog/pwa-manifest-id/?utm_source=devtools)  
ID uniquely identifies app.  
If not present 'start_url' is used instead. (So NOT critical, yet)  
  

#### Icon paths
Icon paths are **relative to manifest file**   
GOOD: ```"src": "./assets/app_icons/android-chrome-192x192.png",```
  
BAD: ```"src": "paycheck/static/assets/app_icons/android-chrome-512x512.png",```
  
#### Manifest Difference between "scope": "./" vs "scope": "/"
The scope member is a string that defines the navigation scope of this web application's application context. It restricts what web pages can be viewed while the manifest is applied. If the user **navigates outside** the scope, it **reverts to a normal web page inside a browser tab or window**.
**If the scope is a relative URL, the base URL will be the URL of the manifest.**
  
The paths in the Q are relative paths, relative to the manifest file, one up from index.html.  
  
index.html is here:
```
"scope": "https://unacceptablebehaviour.github.io/paycheck/",
```
  
SEE Service Worker for more on scope.
  
  
**REF:** Shortcuts & screen shots https://web.dev/add-manifest/  
  
#### HTML - Icon/Manifest support
  
Insert the following code in the `head` section of html pages:  
**NOTE: manifest renamed & moved from that generated by tool!**
```
<link rel="apple-touch-icon" sizes="180x180" href="/static/icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/static/icons/favicon-16x16.png">

**<link rel="manifest" href="/static/manifest.webmanifest">**

<link rel="mask-icon" href="/static/icons/safari-pinned-tab.svg" color="#008100">
<link rel="shortcut icon" href="/static/icons/favicon.ico">
<meta name="apple-mobile-web-app-title" content="payCheck">
<meta name="application-name" content="payCheck">
<meta name="msapplication-TileColor" content="#008100">
<meta name="msapplication-config" content="/static/icons/browserconfig.xml">
<meta name="theme-color" content="#008100">    
```
  
  
## Service Worker
Worth reading [this great gist](https://gist.github.com/kosamari/7c5d1e8449b2fbc97d372675f16b566e) from [kosamari](https://gist.github.com/kosamari).  
  
Also [solid PWA tutorial](https://www.youtube.com/watch?v=6a-YsesNzIA) 9hrs in total.
  
**Getting local host to serve w/o changing SW:**  
Serving website from **docs** directory
  
```
> cd path_to_repo/
> ln -s docs paycheck                   # create simlink to doc dir using repo name - URL path
> http-server -c-1                      # run http-server w/ caching disabled
> http://127.0.0.1:8081/paycheck/       # using relevant port
```
  
SW.js says: 	https://unacceptablebehaviour.github.io/paycheck/  
manifest:	https://unacceptablebehaviour.github.io/paycheck/  
  
### SCOPE
**Dev Cycle - SW updates**  
(Disable browser cache: Network > Disable Cache)  
Set correct manifest file in index.html (web/local)  
Delete cache from cache storage  
Unregister service worker  
Hard Reload [ or Empty (Browser) Cache & Hard Reload (if cache not disabled) ]   
  
LOCAL works like this:  
```
/paycheck/service_worker.js

/paycheck/index.html:
<link rel="manifest" href="static/manifest.local">
navigator.serviceWorker.register('/paycheck/service_worker.js', {scope: '/paycheck/'})

/paycheck/static/manifest.local
  "scope": "http://127.0.0.1:8080/paycheck/",
  "start_url": "index.html",
```
  
LOCAL ALSO works like this - **change in manifest > scope:** note: file has not moved!    
```
/paycheck/service_worker.js

/paycheck/index.html:
<link rel="manifest" href="static/manifest.local">
navigator.serviceWorker.register('/paycheck/service_worker.js', {scope: '/paycheck/'})

/paycheck/static/manifest.local
  "scope": "/paycheck/",
  "start_url": "index.html",
```
  
WEB - NO WORK :/ (Worked in paycheck_beta_20220903)
```
/paycheck/service_worker.js

/paycheck/index.html:
<link rel="manifest" href="manifest.webmanifest">
navigator.serviceWorker.register('/paycheck/service_worker.js', {scope: '/paycheck/'})

/paycheck/static/manifest.webmanifest
  "scope":     "https://unacceptablebehaviour.github.io/paycheck/",
  "start_url": "https://unacceptablebehaviour.github.io/paycheck/",

Console:
SW Registered   https://unacceptablebehaviour.github.io/paycheck/
```


REF: [Getting around the place in root restriction - SO](https://stackoverflow.com/questions/35780397/understanding-service-worker-scope/48068714#48068714)  
REF: [W3 Spec - Service worker](https://w3c.github.io/ServiceWorker/#dom-serviceworkerglobalscope-serviceworker)  
    
  
## QUESTIONS / TODO
In manifest file try "display": "fullscreen"  
Check favicon with the [favicon checker](https://realfavicongenerator.net/favicon_checker)  
  
**Run lighthouse:**
Manifest has NO maskable icon.

