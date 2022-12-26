# ChatGPT-DeMod
This userscript for Tempermonkey allows you to disable moderation checks during conversations with ChatGPT. That is, it will prevent "This content might violate our content policy" warnings from being triggered.

# Installation
First of all you will have to install [Tampermonkey](https://www.tampermonkey.net) plugin for your browser. Then you'll have to install the userscript, which can be done in multiple ways, but the easiest is probably to just open the *ChatGPT DeMod.user.js* file in the raw view and Tampermonkey should detect it and open the installation page. If not, copy the contents of the file, and then in Tampermonkey's options click the **+** tab to create a new script. Paste the copied contents into it and save it.
Make sure the script is enabled by navigating the **Installed Userscripts** tab.

# Usage
Once activated the script adds a floating button to the ChatGPT conversation page.
The button will read either "DeMod: Off" or "DeMod: On." Clicking it switches between the two modes. While DeMod is **On** the script will intercept moderation calls and replace them with a random text from its database.
In other words DeMod makes the conversation seems like it's about something completely else that what you're actually sending and receiving.
It's handled this way to ensure that nothing will seem out of place. ChatGPT's backend has some security checks and we don't want to trigger them by blocking anything. Instead the checks still go through but for a different text.
