
# ChatGPT-DeMod
This userscript for Tampermonkey and Greasemonkey allows you to disable moderation checks during conversations with ChatGPT, i.e. it will prevent "This content might violate our content policy" warnings from being triggered.  
![Warning message removed](res/demod-warning.png)  

# Installation
First of all you will have to install [Tampermonkey](https://www.tampermonkey.net) plugin for your browser on PC (if you're on a mobile then Kiwi browser for Android and Userscripts for Safari on iOS will work just as well). Then you'll have to install the userscript, which can be done in one of the following ways:  
1. The easiest way is probably to just open the *ChatGPT DeMod.user.js* file in the [raw view](https://github.com/4as/ChatGPT-DeMod/raw/main/ChatGPT%20DeMod.user.js) and Tampermonkey should detect it and open the installation page.  
2. If the above method doesn't do anything special then copy the link https://github.com/4as/ChatGPT-DeMod/raw/main/ChatGPT%20DeMod.user.js and then navigate to the Tampermonkey settings (through your browser's addons/extensions settings). Once you're there switch to the **Utilities** tab and scroll to the bottom of the page. At the very end you will find the "Import from URL" text field - paste the link into it and press **Install**.  
3. On some browsers your only option might be to download the [DeMod script](https://github.com/4as/ChatGPT-DeMod/raw/main/ChatGPT%20DeMod.user.js) or copy its contents into a dedicated place for scripts. For example for UserScripts on Safari you have to pick a dedicated folder for scripts on your iOS device so you can then download the DeMod script file into it.  

Make sure the script is enabled by navigating the **Installed Userscripts** tab.

# Usage
Once activated the script adds a floating button to the ChatGPT's conversation page.
The button starts partly hidden and only a small stripe of pixels will be visible at the top of the page.  
![Progress results](res/demod-hidden.png)  
(The button will be green and dotted with white line if in **On** state)  
If you move your mouse close to it the button will reveal itself and become clickable. If you're on the mobile devices you can just tap somewhere close to it - the tappable area is significantly larger than just those few pixels initially visible.  
**If you do not see the button then the script IS NOT WORKING.** Do not assume the script is working if you don't see the indicator.  
![Progress results](res/demod-shown.png)  
The button will read either "DeMod: Off" or "DeMod: On." Clicking it switches between the two modes. While DeMod is **On** the script will intercept moderation calls and replace them with random texts from its database.  
In other words DeMod makes the conversation look like it's about something completely different that what you're actually sending (and receiving).  
It's done this way to ensure that nothing will seem out of place. No one knows what kind of security checks does the ChatGPT's backend use, so to not risk anything by blocking something we shouldn't the checks still go through but with different messages.  
To further ensure that nothing seems out of place keep in mind you can always turn DeMod off if you don't need it.
