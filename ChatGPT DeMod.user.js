// ==UserScript==
// @name         ChatGPT DeMod
// @namespace    pl.4as.chatgpt
// @version      3.5
// @description  Hides moderation results during conversations with ChatGPT
// @author       4as
// @match        *://chat.openai.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @downloadURL  https://raw.githubusercontent.com/4as/ChatGPT-DeMod/main/ChatGPT%20DeMod.user.js
// @updateURL    https://raw.githubusercontent.com/4as/ChatGPT-DeMod/main/ChatGPT%20DeMod.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

'use strict';

var demod_init = async function() {
    'use strict';

    function main () {
        const DEMOD_ID = 'demod-cont';
        if( document.getElementById(DEMOD_ID) !== null ) return;

        const DEMOD_KEY = 'DeModState';
        var is_on = false;
        var is_over = false;

        // Adding the "hover" area for the DeMod button.
        const demod_div = document.createElement('div');
        demod_div.setAttribute('id', DEMOD_ID);
        demod_div.style.position = 'fixed';
        demod_div.style.top = '0px';
        demod_div.style.left = '50%';
        demod_div.style.transform = 'translate(-50%, 0%)';
        demod_div.style.width = '254px';
        demod_div.style.height = '24px';
        demod_div.style.display = 'inline-block';
        demod_div.style.verticalAlign = 'top';
        demod_div.style.zIndex = 999;

        // Adding the actual DeMod button
        const demod_button = document.createElement('button');
        demod_button.style.color = 'white';
        demod_button.style.height = '6px';
        demod_button.style.width = '124px';
        demod_button.style.border = 'none';
        demod_button.style.cursor = 'pointer';
        demod_button.style.outline = 'none';
        demod_button.style.display = 'inline-block';
        demod_button.style.verticalAlign = 'top';

        demod_div.appendChild(demod_button);

        const demod_space = document.createElement('div');
        demod_space.style.width = '4px';
        demod_space.style.display = 'inline-block';
        demod_space.style.verticalAlign = 'top';

        demod_div.appendChild(demod_space);

        // Adding the last message status indicator
        const demod_status = document.createElement('div');
        demod_status.style.color = 'white';
        demod_status.style.height = '6px';
        demod_status.style.border = '0px';
        demod_status.style.padding = '0px';
        demod_status.style.width = '124px';
        demod_status.style.fontSize = '0px';
        demod_status.style.border = 'none';
        demod_status.style.outline = 'none';
        demod_status.style.display = 'inline-block';
        demod_status.style.verticalAlign = 'top';
        demod_status.style.textAlign = 'center';
        demod_status.style.backgroundColor ='#9A9A9A';
        demod_status.textContent = "Latest: None";

        demod_div.appendChild(demod_status);

        demod_div.onmouseover = function() {
            is_over = true;
            demod_status.style.fontSize = '10px';
            demod_status.style.height = '32px';
            demod_status.style.padding = '7px 3px';
            updateDeModState();
        };
        demod_div.onmouseout = function() {
            is_over = false;
            demod_status.style.fontSize = '0px';
            demod_status.style.height = '6px';
            demod_status.style.padding = '0px';
            updateDeModState();
        };

        demod_button.addEventListener('click', () => {
            is_on = !is_on;
            setDeModState(is_on);
            updateDeModState();
        });

        const ButtonState = {
            DISABLED : 0,
            OFF : 1,
            ON : 2,
        };

        function updateDeModState() {
            if( is_on ) {
                updateButton(demod_button, ButtonState.ON, "DeMod:");
            }
            else {
                updateButton(demod_button, ButtonState.OFF, "DeMod:");
            }
        }

        const ModerationResult = {
            UNKNOWN : 0,
            SAFE : 1,
            FLAGGED : 2,
            BLOCKED : 3,
        };

        function updateDeModMessageState(mod_result) {
            switch(mod_result) {
                case ModerationResult.UNKNOWN:
                    demod_status.style.border = '0px';
                    demod_status.textContent = "Latest: None";
                    demod_status.style.backgroundColor ='#9A9A9A';
                    break;
                case ModerationResult.SAFE:
                    demod_status.style.border = '0px';
                    demod_status.textContent = "Latest: Safe";
                    demod_status.style.backgroundColor ='#4CAF50';
                    break;
                case ModerationResult.FLAGGED:
                    demod_status.style.border = '1px dotted white';
                    demod_status.textContent = "Latest: Flagged";
                    demod_status.style.backgroundColor ='#ACA950';
                    break;
                case ModerationResult.BLOCKED:
                    demod_status.style.border = '1px solid white';
                    demod_status.textContent = "Latest: BLOCKED";
                    demod_status.style.backgroundColor ='#AF4C50';
                    break;
            }
        }

        function updateButton(button, state, label) {
            if( is_over ) {
                button.style.height = 'auto';
                button.style.border = '0px';
                button.style.padding = '4px 12px';
                button.style.opacity = 1;
                button.style.borderRadius = '4px';
                switch(state) {
                    case ButtonState.DISABLED:
                        button.style.opacity = 0.5;
                        button.style.backgroundColor ='#AAAAAA';
                        button.textContent = label + " N/A";
                        break;
                    case ButtonState.OFF:
                        button.style.backgroundColor ='#AF4C50';
                        button.textContent = label + " Off";
                        break;
                    case ButtonState.ON:
                        button.style.border = '1px dotted white';
                        button.style.padding = '3px 11px';
                        button.style.backgroundColor ='#4CAF50';
                        button.textContent = label + " On";
                        break;
                }
            }
            else {
                button.textContent = "";
                button.style.height = '6px';
                button.style.padding = '0px';
                button.style.opacity = 1;
                button.style.borderRadius = '0px';
                switch(state) {
                    case ButtonState.DISABLED:
                        button.style.opacity = 0.5;
                        button.style.backgroundColor ='#AAAAAA';
                        break;
                    case ButtonState.OFF:
                        button.style.backgroundColor ='#AF4C50';
                        break;
                    case ButtonState.ON:
                        button.style.border = '1px dotted white';
                        button.style.backgroundColor ='#4CAF50';
                        break;
                }
            }
        }

        updateDeModState();

        // Experimental substitution, might confuse moderation in some cases, but usually doesn't work.
        // Change to "true" if you want to test it for yourself.
        const USE_SUBSTITUTION = false;
        const SUBSITUTE_BACKWARDS = false; //enable backwards in case you're actually using Cyrillic to communicate with ChatGPT and you want to substitute to English
        const glyph_english = ['A', 'B', 'C', 'E', 'H', 'I', 'J', 'K', 'M', 'O', 'P', 'S', 'T', 'X', 'Y', 'a', 'c', 'e', 'o', 'p', 'x', 'y', ' '];
        const glyph_cyrillic = ['А', 'В', 'С', 'Е', 'Н', 'І', 'Ј', 'К', 'М', 'О', 'Р', 'Ѕ', 'Т', 'Х', 'Ү', 'а', 'с', 'е', 'о', 'р', 'х', 'у', ' '];
        function substituteGlyps(text, is_backwards) {
            var idx = 0;
            if( !is_backwards ) {
                for(idx in glyph_english) {
                    text = text.replaceAll(glyph_english[idx], glyph_cyrillic[idx]);
                }
            }
            else {
                for(idx in glyph_cyrillic) {
                    text = text.replaceAll(glyph_cyrillic[idx], glyph_english[idx]);
                }
            }
            return text;
        }

        function hasFlagging(text) {
            return text.match(/(\"flagged\"|\"blocked\"): ?true/ig);
        }

        function clearFlagging(text) {
            text = text.replaceAll(/\"flagged\": ?true/ig, "\"flagged\": false");
            text = text.replaceAll(/\"blocked\": ?true/ig, "\"blocked\": false");
            return text;
        }

        const ConversationType = {
            UNKNOWN : 0,
            INIT : 1,
            PROMPT : 2,
        };

        var init_cache = null;
        var current_message = null;
        var used_opening = Math.random() > 0.5;
        var currently_responding = false;
        var intercept_count_normal = 0;
        var intercept_count_extended = 0;
        var intercept_count_total = 0;

        var target_window = typeof(unsafeWindow)==='undefined' ? window : unsafeWindow;
        var original_fetch = target_window.fetch;
        target_window.fetch = async function(...arg) {
            if( !is_on ) {
                return original_fetch(...arg);
            }

            var original_arg = arg;
            var fetch_url = arg[0];
            var is_request = false;
            if( typeof(fetch_url) !== 'string' ) {
                fetch_url = fetch_url.url;
                is_request = true;
            }

            if( fetch_url.indexOf('/share/create') != -1 ) {
                return new Response("", { status: 404, statusText: "Not found" } );
            }

            var is_conversation = fetch_url.indexOf('/conversation') != -1 && fetch_url.indexOf('/conversations') == -1;
            var convo_type = ConversationType.UNKNOWN;
            if( is_conversation ) {
                if( fetch_url.indexOf("/gen_title") != -1 ) {
                    var init_url = fetch_url.replace("/gen_title", "");
                    if( is_request ) {
                        arg = cloneRequest(arg[0], init_url, "GET", null);
                        arg.headers.delete("Content-Type");
                    }
                    else {
                        arg[0] = init_url;
                        arg[1].method = "GET";
                        delete arg[1].headers["Content-Type"];
                        delete arg[1].body;
                    }
                }

                var conv_request = null;
                if( is_request ) {
                    if( arg[0] !== undefined && arg[0].hasOwnProperty('text') && (typeof arg[0].text === 'function') ) {
                        conv_request = await arg[0].text();
                    }
                }
                else {
                    if( arg[1] !== undefined && arg[1].hasOwnProperty('body') ) {
                        conv_request = arg[1].body;
                    }
                }

                if( conv_request ) {
                    convo_type = ConversationType.PROMPT;
                    var conv_body = JSON.parse( conv_request );

                    conv_body.supports_modapi = false;

                    if( USE_SUBSTITUTION ) {
                        if( conv_body.hasOwnProperty('messages') && conv_body.messages[0].hasOwnProperty('content') && conv_body.messages[0].content.hasOwnProperty('parts') ) {
                            for(var msg_key in conv_body.messages) {
                                for(var content_key in conv_body.messages[msg_key].content.parts) {
                                    var jumble = conv_body.messages[msg_key].content.parts[content_key].split("<||>");
                                    for (var i = 1; i < jumble.length; i+=2) {
                                        jumble[i] = substituteGlyps(jumble[i], SUBSITUTE_BACKWARDS);
                                    }
                                    conv_body.messages[msg_key].content.parts[content_key] = jumble.join('');
                                }
                            }
                        }
                    }

                    if( is_request ) {
                        arg[0] = cloneRequest(arg[0], fetch_url, arg[0].method, conv_body);
                    }
                    else {
                        arg[1].body = JSON.stringify(conv_body);
                    }
                }
                else {
                    convo_type = ConversationType.INIT;
                    init_cache = arg;
                }
            }

            var original_promise = original_fetch(...original_arg);
            if( is_conversation ) {
                var original_result = await original_promise;

                if( !original_result.ok ) {
                    return original_result;
                }

                switch(convo_type) {
                    case ConversationType.PROMPT: {
                        console.log("Processing basic prompted conversation. Scanning for moderation results...");
                        var is_done = false;
                        var encoder = new TextEncoder();
                        var decoder = new TextDecoder();
                        var reader = original_result.body.getReader();
                        var payload = null;
                        var is_blocked = false;
                        var mod_result = ModerationResult.SAFE;

                        const stream = new ReadableStream({
                            async start(controller) {
                                try {
                                    while (true) {
                                        const { done, value } = await reader.read();

                                        var raw_chunk = value || new Uint8Array;
                                        var chunk = raw_chunk ? decoder.decode(raw_chunk, {stream: !original_result.done}) : "";
                                        var chunk_start = chunk.indexOf("data: ");
                                        while( chunk_start != -1 && !is_done) {
                                            var chunk_end = chunk.indexOf("\n", chunk_start);
                                            if( chunk_end == -1 ) chunk_end = chunk.length-1;
                                            var chunk_text = chunk.substring(chunk_start+5, chunk_end).trim();

                                            if( chunk_text == "[DONE]" ) {
                                                is_done = true;
                                                if( is_blocked && payload !== null ) {
                                                    var is_redownloaded = false;
                                                    var init_redownload = original_fetch(...init_cache);
                                                    var redownload_result = await init_redownload;
                                                    if( redownload_result.ok ) {
                                                        var redownload_text = await redownload_result.text();
                                                        var redownload_object = null;
                                                        try {
                                                            redownload_object = JSON.parse(redownload_text);
                                                        }
                                                        catch(e) { }
                                                        if( redownload_object !== null && redownload_object.hasOwnProperty('mapping') ) {
                                                            var latest = null;
                                                            var latest_time = 0;
                                                            for( var map_key in redownload_object.mapping ) {
                                                                var map_obj = redownload_object.mapping[map_key];
                                                                if( map_obj.hasOwnProperty('message') && map_obj.message.create_time > latest_time ) {
                                                                    latest = map_obj.message;
                                                                    latest_time = latest.create_time;
                                                                }
                                                            }

                                                            if( latest !== null ) {
                                                                payload.message.content.parts = latest.content.parts;
                                                                var inject_redownload = "data: "+JSON.stringify(payload)+"\n\n";
                                                                controller.enqueue( encoder.encode(inject_redownload) );
                                                                is_redownloaded = true;
                                                            }
                                                        }
                                                    }

                                                    if( !is_redownloaded ) {
                                                        payload.message.content.parts[0] = "DeMod: Request completed, but DeMod failed to access the history. Try refreshing the conversation instead.";
                                                        controller.enqueue( encoder.encode("data: "+JSON.stringify(payload)+"\n\n") );
                                                    }
                                                }
                                            }
                                            else if( payload === null ) {
                                                try {
                                                    payload = JSON.parse( chunk_text );
                                                    if( !payload.hasOwnProperty('message') ) {
                                                        payload = null;
                                                    }
                                                    else {
                                                        payload.message.content = {content_type: "text", "parts": [""]};
                                                    }
                                                }
                                                catch(e) {
                                                    payload = null;
                                                }
                                            }

                                            if( chunk_text.match(/\"flagged\": ?true/ig) ) {
                                                if( mod_result !== ModerationResult.BLOCKED ) mod_result = ModerationResult.FLAGGED;
                                                console.log("Message has been flagged. Preventing removal.");
                                            }

                                            var chunk_cleaned = clearFlagging(chunk_text);
                                            controller.enqueue( encoder.encode("data: "+chunk_cleaned+"\n\n") );

                                            if( chunk_text.match(/\"blocked\": ?true/ig) ) {
                                                mod_result = ModerationResult.BLOCKED;
                                                console.log("Message has been BLOCKED. Waiting for ChatGPT to finalize the request...");
                                                is_blocked = true;
                                                if( payload !== null ) {
                                                    payload.message.content.parts[0] = "DeMod: Moderation has intercepted the response and is activily blocking it. Waiting for ChatGPT to finalize the request so DeMod can fetch it from the conversation's history...";
                                                    controller.enqueue( encoder.encode("data: "+JSON.stringify(payload)+"\n\n") );
                                                }
                                            }

                                            updateDeModMessageState(mod_result);

                                            chunk_start = chunk.indexOf("data: ", chunk_end+1);
                                        }

                                        if( is_done || done ) {

                                            controller.close();
                                            break;
                                        }
                                    }
                                } catch (error) {
                                    controller.error(error);
                                }
                            },
                        });

                        return new Response(stream, {
                            status: original_result.status,
                            statusText: original_result.statusText,
                            headers: original_result.headers,
                        });
                        break;
                    }
                    case ConversationType.INIT: {
                        console.log("Processing conversation initialization. Checking if the conversation has existing moderation results.");

                        var convo_init = await original_result.text();
                        convo_init = clearFlagging(convo_init);

                        updateDeModMessageState(ModerationResult.UNKNOWN);

                        return new Response(convo_init, {
                            status: original_result.status,
                            statusText: original_result.statusText,
                            headers: original_result.headers,
                        });
                        break;
                    }
                }
            }

            return original_promise;
        }

        // Bonus functionality: blocking tracking calls
        XMLHttpRequest.prototype.realOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            if( is_on && url.indexOf("/track/?") != -1 ) return;
            this.realOpen (method, url, async, user, password);
        }

        function getDeModState() {
            var state = target_window.localStorage.getItem(DEMOD_KEY);
            if (state == null) return true;
            return (state == "false") ? false : true;
        }

        function setDeModState(demod_on) {
            target_window.localStorage.setItem(DEMOD_KEY, demod_on);
        }

        function cloneRequest(request, fetch_url, method, body) {
            return new Request(fetch_url, {
                method: method,
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

        is_on = getDeModState();
        updateDeModState();
        document.body.appendChild(demod_div);
        console.log("DeMod interceptor is ready.");
    }

    // The script's core logic is being injected into the page to work around different JavaScript contexts
    var script = document.createElement('script');
    script.appendChild(document.createTextNode('('+ main +')();'));
    (document.body || document.head || document.documentElement).appendChild(script);

    // Alternative method of adding DeMod to the chat in case the script injection fails
    var target_window = typeof(unsafeWindow)==='undefined' ? window : unsafeWindow;
    target_window.addEventListener("load", main);
};

var target_window = typeof(unsafeWindow)==='undefined' ? window : unsafeWindow;
var current_url = window.location.href;
if( current_url.match("/c/") || current_url.match("/share/") ) {
    window.location.replace("https://chat.openai.com");
}
else if( document.body == null ) {
    target_window.addEventListener("DOMContentLoaded", demod_init);
}
else {
    demod_init();
}