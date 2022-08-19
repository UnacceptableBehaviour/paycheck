# paycheck
Single page PWA to add up hours, and work out tax and NI contributions to compare to payroll.

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
  
## Process ICON file into platform images & manifest file:
There are quite a few site that will do this I used https://realfavicongenerator.net/ [here](https://realfavicongenerator.net/)  
  
### Upload SVG (create png assets)  
Walk various settings using GUI  
  
##### Favicon for Desktop Browsers and Google Result Pages
Default
  
##### Favicon for iOS - Web Clip
Add background colour: #008100
Margin: 0px
Assets: ios7 & later, Check: declare only hires icon
  
##### Favicon for Android
Background colour #008100
Apply Drop shadow
Start URL:https://unacceptablebehaviour.github.io/paycheck/
Just hires recommended icons.
  
##### Windows Metro
Use original favicon.
Use colour: #008100
Declare assets in ```browserconfig.xml```
* SML square
* MED square

##### macOS Safari
Turn image into monochrome (this one already is)
Theme colour #008100

###### Favicon Generator Options
Path: /static/icons
http://example.com/favicon.ico?V=0.01
Compression:Default
AppName: payCheck
Additional files: README.md html_code.html 


Download zip of items
Experiments in ```/paycheck/scratch```
Prototype 1 in ```/paycheck/scratch/realfavicongenerator.net.2-1```
Image files in ```paycheck/docs/static/images```
favicon.ico in root: ```paycheck/docs```



### icon_ideas/realfavicongenerator.net.2-1/README.md

#### Your Favicon Package

This package was generated with [RealFaviconGenerator](https://realfavicongenerator.net/) [v0.16](https://realfavicongenerator.net/change_log#v0.16)

##### Install instructions

To install this package:

Extract this package in the root of your web site. If your site is <code>http://www.example.com</code>, you should be able to access a file named <code>http://www.example.com/favicon.ico</code>.

Insert the following code in the `head` section of your pages:

    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#008100">
    <meta name="apple-mobile-web-app-title" content="payCheck">
    <meta name="application-name" content="payCheck">
    <meta name="msapplication-TileColor" content="#00a300">
    <meta name="msapplication-TileImage" content="/mstile-144x144.png">
    <meta name="theme-color" content="#008100">
  
*Optional* - Check your favicon with the [favicon checker](https://realfavicongenerator.net/favicon_checker)
  


## QUESTIONS / TODO
Where should the browserconfig.xml go on the site? Looks like windows config item.

