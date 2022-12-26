# ChatGPT-DeMod
This userscript for Tempermonkey allows you to disable moderation checks during conversations with ChatGPT. That is, it will prevent "This content might violate our content policy" warnings from being triggered.

# Installation
First of all you will have to install [Tampermonkey](https://www.tampermonkey.net) plugin for your browser. Then there are two ways to install the ChatGPT-DeMod userscript:  
1. Get link to the *ChatGPT DeMod.user.js* file from the release page, then open Tampermonkey's options and navigate to **Utilities** tab. Once there scroll to the bottom of the page and paste the link into the **Import from URL** textfield and press **Install**.
2. Open the *ChatGPT DeMod.user.js* file in raw view and copy the contents. Then in Tampermonkey's options click the **+** tab to create a new script. Paste the copied contents into it and save it.

Make sure the script is enabled by navigating the **Installed Userscripts** tab.

# Usage
Once activated the script adds a floating button to the ChatGPT conversation page.
The button will read either "DeMod: Off" or "DeMod: On." Clicking it switches between the two modes. While DeMod is **On** the script will intercept moderation calls and replace them with a random text from its database.
In other words DeMod makes the conversation seems like it's about something completely else that what you're actually sending and receiving.
It's handled this way to ensure that nothing will seem out of place. ChatGPT's backend has some security checks and we don't want to trigger them.
