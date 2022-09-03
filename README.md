# paycheck
Single page PWA to add up hours, and work out tax and NI contributions to compare to payroll.
See app here: https://unacceptablebehaviour.github.io/paycheck/


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
Linked to in HTML: ```<meta name="msapplication-config" content="static/app_icons/browserconfig.xml">```  
  
**macOS Safari**  
Turn image into monochrome (this one already is)  
Theme colour #008100  
  
**Favicon Generator Options**  
Path: /static/icons  
http://example.com/favicon.ico?V=0.01  
Compression:Default  
AppName: payCheck  
Additional files: README.md html_code.html 
  
### Notes on Above 
Icon set Version: scratch/icon_ideas/20220903_favicon_package_v0.16  
  
This package was generated with [RealFaviconGenerator](https://realfavicongenerator.net/) [v0.16](https://realfavicongenerator.net/change_log#v0.16) 
**Issues w/ manifest:**  
"theme_color": "#ffffff", SB #008100
"background_color": "#ffffff", SB #008100
in ICON array, need to add app_icons to image paths.
MISSING:  
"id": "/paycheck/", 
"scope": "https://unacceptablebehaviour.github.io/paycheck/",  
"orientation": "portrait",  
"description": "Single page PWA - Calculate work hours, tax NI, pension etc for the month. Share results."  
  
**WARNING**
HTML points to wrong manifest file!
```
IS
<link rel="manifest" href="static/app_icons/site.webmanifest?v=0.01">
SB
<link rel="manifest" href="static/manifest.webmanifest?v=0.01">
  
**WARNING**
Don't for get to run ```build_cache_file_list.py``` and update SW cache list!
  
  
Checking the favicon version adds version to a lot of things!  
```
CHECK: http://example.com/favicon.ico?V=0.01
<link rel="apple-touch-icon" sizes="180x180" href="/static/icons/apple-touch-icon.png?v=0.01">
<link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32x32.png?v=0.01">
<link rel="icon" type="image/png" sizes="16x16" href="/static/icons/favicon-16x16.png?v=0.01">
<link rel="manifest" href="/static/icons/site.webmanifest?v=0.01">
<link rel="mask-icon" href="/static/icons/safari-pinned-tab.svg?v=0.01" color="#008100">
<link rel="shortcut icon" href="/static/icons/favicon.ico?v=0.01">
<meta name="msapplication-config" content="/static/icons/browserconfig.xml?v=0.01">
```

#### Download zip of items
Experiments in ```/paycheck/scratch```  
Prototype 1 in ```/paycheck/scratch/realfavicongenerator.net.2-1```  
Prototype 2 in ```/paycheck/scratch/20220903_favicon_package_v0.16```  
Image files in ```paycheck/docs/static/app_icons```  
favicon.ico in root: ```paycheck/docs```  
apple-touch-icon.png in root: ```paycheck/docs```  
  
**REF:** Maskable Icons https://web.dev/maskable-icon/#what  
**REF:** https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs  
  
### Adding Manifest
REF to spec: [W3 Web Application Manifest](https://w3c.github.io/manifest/#web-application-manifest). 
[Ref Mozilla Clear Concise](https://developer.mozilla.org/en-US/docs/Web/Manifest).  
  
#### Difference manifest.json vs manifest.webmanifest vs site.webmanifest
Apparently no real difference although most comments & the spec lean towards using ```manifest.webmanifest```.  
  
**Include is using the following:**  
```
<!-- Startup configuration -->
<link rel="manifest" href="manifest.webmanifest">

<!-- Fallback application metadata for legacy browsers -->
<meta name="application-name" content="payCheck">
<link rel="icon" sizes="16x16 32x32 48x48" href="lo_def.ico">
<link rel="icon" sizes="512x512" href="hi_def.png">
```
  
#### THE MANIFEST
```
{
  "name": "payCheck",
  "id": "/paycheck/",
  "short_name": "payCheck",
  "icons": [
    {
      "src": "./icons/android-chrome-192x192.png?v=0.01",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "./icons/android-chrome-512x512.png?v=0.01",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#008100",
  "background_color": "#008100",
  "scope": "https://unacceptablebehaviour.github.io/paycheck/",
  "start_url": "https://unacceptablebehaviour.github.io/paycheck/",
  "display": "standalone",
  "orientation": "portrait"
}
```
  
#### THE MANIFEST v2
```
{
  "name": "payCheck",
  "id": "/paycheck/",
  "short_name": "payCheck",
  "icons": [
    {
      "src": "app_icons/android-chrome-36x36.png?v=0.01",
      "sizes": "36x36",
      "type": "image/png"
    },
    {
      "src": "app_icons/android-chrome-48x48.png?v=0.01",
      "sizes": "48x48",
      "type": "image/png"
    },
    {
      "src": "app_icons/android-chrome-72x72.png?v=0.01",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "app_icons/android-chrome-96x96.png?v=0.01",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "app_icons/android-chrome-144x144.png?v=0.01",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "app_icons/android-chrome-192x192.png?v=0.01",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "app_icons/android-chrome-256x256.png?v=0.01",
      "sizes": "256x256",
      "type": "image/png"
    },
    {
      "src": "app_icons/android-chrome-384x384.png?v=0.01",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "app_icons/android-chrome-512x512.png?v=0.01",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#008100",
  "background_color": "#008100",
  "scope": "https://unacceptablebehaviour.github.io/paycheck/",
  "start_url": "https://unacceptablebehaviour.github.io/paycheck/",
  "display": "standalone",
  "orientation": "portrait",
  "description": "Single page PWA - Calculate work hours, tax NI, pension etc for the month. Share results."
}
```

#### FIELDS
**ID**  

https://developer.chrome.com/blog/pwa-manifest-id/?utm_source=devtools
  

#### Icon paths
Icon path are **relative to manifest file**.
GOOD: ```"src": "./app_icons/android-chrome-192x192.png?v=0.01",```
  
BAD: ```"src": "paycheck/static/app_icons/android-chrome-512x512.png?v=0.01",```
  
#### Manifest Difference between "scope": "./" vs "scope": "/"
The scope member is a string that defines the navigation scope of this web application's application context. It restricts what web pages can be viewed while the manifest is applied. If the user **navigates outside** the scope, it **reverts to a normal web page inside a browser tab or window**.
**If the scope is a relative URL, the base URL will be the URL of the manifest.**
  
The paths in the Q are relative paths, relative to the manifest file, one up from index.html.  
  
index.html is here:
```
"scope": "https://unacceptablebehaviour.github.io/paycheck/",
```
  
**REF:** Shortcuts & screen shots https://web.dev/add-manifest/  
  
#### HTML - Icon/Manifest support
  
Insert the following code in the `head` section of html pages:  
**NOTE: manifest renamed & moved from that generated by tool!**
```
<link rel="apple-touch-icon" sizes="180x180" href="/static/icons/apple-touch-icon.png?v=0.01">
<link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32x32.png?v=0.01">
<link rel="icon" type="image/png" sizes="16x16" href="/static/icons/favicon-16x16.png?v=0.01">

**<link rel="manifest" href="/static/manifest.webmanifest?v=0.01">**

<link rel="mask-icon" href="/static/icons/safari-pinned-tab.svg?v=0.01" color="#008100">
<link rel="shortcut icon" href="/static/icons/favicon.ico?v=0.01">
<meta name="apple-mobile-web-app-title" content="payCheck">
<meta name="application-name" content="payCheck">
<meta name="msapplication-TileColor" content="#008100">
<meta name="msapplication-config" content="/static/icons/browserconfig.xml?v=0.01">
<meta name="theme-color" content="#008100">    
```

  

## QUESTIONS / TODO
In manifest file try "display": "fullscreen"  
Check favicon with the [favicon checker](https://realfavicongenerator.net/favicon_checker)  
Run lighthouse.
