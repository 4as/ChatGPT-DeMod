// ==UserScript==
// @name         ChatGPT DeMod
// @namespace    pl.4as.chatgpt
// @version      0.1
// @description  Prevents moderation checks during conversations with ChatGPT
// @author       4as
// @match        *://chat.openai.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM.setValue
// @grant        GM.getValue
// @run-at       document-start
// ==/UserScript==

'use strict';

var url = "https://gist.githubusercontent.com/4as/b626bd495b52d35b3d565a1731e158f0/raw/beb2bf0d324bcb25c980c47bc95a45d5a35f90e2/gistfile1.txt";
var has_conversations;
var conversations;

function getOpening() {
    if( !has_conversations ) return "Hi";
    var idx = Math.floor(Math.random() * conversations.openings.length);
    return conversations.openings[idx];
}

var conversation_page = 0;
var conversation_idx = 0;
function getConversation() {
    if( !has_conversations ) return "Can you tell me what exactly can you do?";
    if( conversation_page >= conversations.conversations.length ) conversation_page = 0;
    if( conversation_idx == conversations.conversations[conversation_page].length ) return null;
    let message = conversations.conversations[conversation_page][conversation_idx];
    conversation_idx ++;
    return message;
}

function getEnding() {
    if( !has_conversations ) return "Can you tell me what exactly can you do?";
    conversation_page ++;
    conversation_idx = 0;
    var idx = Math.floor(Math.random() * conversations.endings.length);
    return conversations.endings[idx];
}

const DEMOD_KEY = 'DeModState';
var is_on = false;

 // Adding DeMod button
const demod_button = document.createElement('button');
demod_button.textContent = "DeMod: Off";

demod_button.style.position = 'fixed';
demod_button.style.top = '34px';
demod_button.style.left = '50%';
demod_button.style.transform = 'translate(-50%, -50%)';
demod_button.style.backgroundColor = '#4CAF50';
demod_button.style.color = 'white';
demod_button.style.padding = '12px 20px';
demod_button.style.border = 'none';
demod_button.style.cursor = 'pointer';
demod_button.style.outline = 'none';
demod_button.style.borderRadius = '4px';
demod_button.style.zIndex = 999;

demod_button.addEventListener('click', () => {
    is_on = !is_on;
    GM.setValue(DEMOD_KEY, is_on);
    updateDeModState();
});

function updateDeModState() {
    demod_button.textContent = "DeMod: "+(is_on?"On":"Off");
}

var current_message = null;
var used_opening = Math.random() > 0.5;
var currently_responding = false;

const original_fetch = unsafeWindow.fetch;

unsafeWindow.fetch = async (...arg) => {
    if( has_conversations && arg[0].indexOf('/moderations') != -1 ) {
        if( is_on ) {
            var body = JSON.parse(arg[1].body);
            if( body.hasOwnProperty("input") ) {
                var text = null;
                if( currently_responding ) {
                    text = current_message.input + "\n\n"+current_message.output;
                }
                else {
                    if( !used_opening ) {
                        current_message = getOpening();
                    }
                    else {
                        current_message = getConversation();
                        if(current_message == null) current_message = getEnding();
                    }
                    text = current_message.input;
                }
                console.log("Moderation call intercepted for plain input! Responding: "+currently_responding+". Sending text: "+text);
                body.input = text;
            }
            else for(var j = 0; j<body.messages.length; j++) {
                var msg = body.messages[j];
                if( msg.content.content_type == "text" ) {
                    console.log("Moderation call intercepted for segmented input! Responding: "+currently_responding+". Sending output: "+current_message.output);
                    msg.content.parts = [current_message.output];
                }
            }
            currently_responding = !currently_responding;
            arg[1].body = JSON.stringify(body);
        }
        used_opening = true;
    }
    return original_fetch(...arg);
}

(async () => {
    'use strict';
    is_on = await GM.getValue(DEMOD_KEY, false);
    await fetch(url)
        .then(res => res.json())
        .then(out => { (conversations = out); has_conversations = true; console.log("Conversations loaded! Openings: "+conversations.openings.length+", main: "+conversations.conversations.length+", endings: "+conversations.endings.length); } )
        .catch(err => { console.log("Failed to download conversations: "+err); } );
    conversation_page = Math.floor(Math.random() * conversations.conversations.length);
    updateDeModState();
    document.body.appendChild(demod_button);
})();