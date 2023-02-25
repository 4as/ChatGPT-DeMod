// ==UserScript==
// @name         ChatGPT DeMod
// @namespace    pl.4as.chatgpt
// @version      1.2
// @description  Prevents moderation checks during conversations with ChatGPT
// @author       4as
// @match        *://chat.openai.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @downloadURL  https://raw.githubusercontent.com/4as/ChatGPT-DeMod/main/ChatGPT%20DeMod.user.js
// @updateURL    https://raw.githubusercontent.com/4as/ChatGPT-DeMod/main/ChatGPT%20DeMod.user.js
// @grant        GM.setValue
// @grant        GM.getValue
// @run-at       document-start
// ==/UserScript==

'use strict';

var url = "https://raw.githubusercontent.com/4as/ChatGPT-DeMod/main/conversations.json";
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
updateDeModState()

demod_button.style.position = 'fixed';
demod_button.style.bottom = '2px';
demod_button.style.left = '50%';
demod_button.style.transform = 'translate(-50%, 0%)';
demod_button.style.color = 'white';
demod_button.style.padding = '12px 20px';
demod_button.style.border = 'none';
demod_button.style.cursor = 'pointer';
demod_button.style.outline = 'none';
demod_button.style.borderRadius = '4px';
demod_button.style.zIndex = 999;

demod_button.addEventListener('click', () => {
    is_on = !is_on;
    setDeModState(is_on);
    updateDeModState();
});

function updateDeModState() {
    demod_button.textContent = "DeMod: "+(is_on?"On":"Off");
	demod_button.style.backgroundColor = is_on?'#4CAF50':'#AF4C50';
}

var current_message = null;
var used_opening = Math.random() > 0.5;
var currently_responding = false;
var intercept_count_normal = 0;
var intercept_count_extended = 0;
var intercept_count_total = 0;

const target_window = typeof(unsafeWindow)==='undefined' ? window : unsafeWindow;
const original_fetch = target_window.fetch;

target_window.fetch = async (...arg) => {
    var fetch_url = arg[0];
	var is_request = false;
	if( typeof(fetch_url) !== 'string' ) {
		fetch_url = fetch_url.url;
		is_request = true;
	}
    if( has_conversations && fetch_url.indexOf('/moderation') != -1 ) {
        if( is_on ) {
            intercept_count_total ++;
			var request_body = "";
			if( is_request ) {
				request_body = await arg[0].text();
			}
			else {
				request_body = arg[1].body;
			}
            var body = JSON.parse( request_body );
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
                if( text == null ) text = "Hi!";
                intercept_count_normal ++;
                body.input = text;
            }
            else {
                var intercepted = false;
                for(var j = 0; j<body.messages.length; j++) {
                    var msg = body.messages[j];
                    if( msg.content.content_type == "text" ) {
                        msg.content.parts = [current_message.output];
                        intercepted = true;
                    }
                }
                if( intercepted ) {
                    intercept_count_extended ++;
                }
                else {
                    console.error("Moderation call interception failed, unknown format! Message:\n"+JSON.stringify(body));
                }
            }
            console.log("Moderation call intercepted. Normal count: "+intercept_count_normal+", extended count: "+intercept_count_extended+", total: "+intercept_count_total);
            currently_responding = !currently_responding;
			if( is_request ) {
                var request = arg[0];
				arg[0] = new Request(fetch_url, {
					method: request.method,
					headers: request.headers,
					body: JSON.stringify(body),
					referrer: request.referrer,
					referrerPolicy: request.referrerPolicy,
					mode: request.mode,
					credentials: request.credentials,
					cache: request.cache,
					redirect: request.redirect,
					integrity: request.integrity,
				});
			}
			else {
				arg[1].body = JSON.stringify(body);
			}
        }
        used_opening = true;
    }
    return original_fetch(...arg);
}


(async () => {
    'use strict';
    is_on = await getDeModState();
    await fetch(url)
        .then(res => res.json())
        .then(out => { (conversations = out); has_conversations = true; console.log("Conversations loaded! Openings: "+conversations.openings.length+", main: "+conversations.conversations.length+", endings: "+conversations.endings.length); } )
        .catch(err => { console.log("Failed to download conversations: "+err); } );
    if( conversations != null ) {
        conversation_page = Math.floor(Math.random() * conversations.conversations.length);
        updateDeModState();
        document.body.appendChild(demod_button);
    }

    XMLHttpRequest.prototype.realOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        if( is_on && url.indexOf("/track/?") != -1 ) return;
        this.realOpen (method, url, async, user, password);
    }

})();


async function getDeModState() {
    if( typeof(GM) !== 'undefined' ) {
        return await GM.getValue(DEMOD_KEY, false);
    }
    else {
        var state = target_window.localStorage.getItem(DEMOD_KEY);
        if (state == null) return true;
        return (state == "false") ? false : true;
    }
}

function setDeModState(state) {
    if( typeof(GM) !== 'undefined' ) {
        return GM.setValue(DEMOD_KEY, state);
    }
    else {
        target_window.localStorage.setItem(DEMOD_KEY, state);
    }
}
