// ==UserScript==
// @name         ChatGPT DeMod
// @namespace    pl.4as.chatgpt
// @version      4.4
// @description  Hides moderation results during conversations with ChatGPT
// @author       4as
// @match        *://chatgpt.com/*
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

        var target_window = typeof(unsafeWindow)==='undefined' ? window : unsafeWindow;

        // DeMod state control
        function getDeModState() {
            var state = target_window.localStorage.getItem(DEMOD_KEY);
            if (state == null) return true;
            return (state == "false") ? false : true;
        }

        function setDeModState(demod_on) {
            target_window.localStorage.setItem(DEMOD_KEY, demod_on);
        }

        // EXPERIMENTAL
        // Redraw tests are used to detect updates in the browser's window. When conversation is lagging those updates will not be present.
        // If lag is detected DeMod will throttle text streaming so the browser has time to catch up.
        var redraw_test = 0;
        var has_redraw = false;
        function testRedraw(timestamp) {
            has_redraw = true;
            redraw_test = target_window.requestAnimationFrame(testRedraw);
        }
        function stopRedrawTests() {
            target_window.cancelAnimationFrame(redraw_test);
            redraw_test = 0;
        }
        function startRedrawTests() {
            if( redraw_test !== 0 ) stopRedrawTests();
            redraw_test = target_window.requestAnimationFrame(testRedraw);
        }

        // Interceptors shared data
        var init_cache = null;
        var original_fetch = target_window.fetch;
        var is_blocked = false;
        var payload = null;
        var last_response = null;
        var mod_result = ModerationResult.UNKNOWN;

        var decoder = new TextDecoder();
        var encoder = new TextEncoder();
        function decodeData(data) {
            if (typeof data == 'string') {
                return data;
            }
            else if (data.byteLength != undefined) {
                return decoder.decode(new Uint8Array(data));
            }
            return null;
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

        function cloneEvent(event, new_data) {
            return new MessageEvent('message', {
                data: new_data,
                origin: event.origin,
                lastEventId: event.lastEventId,
                source: event.source,
                ports: event.ports
            });
        }

        async function redownloadLatest() {
            var latest = null;
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
                    var latest_time = 0;
                    for( var map_key in redownload_object.mapping ) {
                        var map_obj = redownload_object.mapping[map_key];
                        if( map_obj.hasOwnProperty('message') && map_obj.message != null
                           && map_obj.message.hasOwnProperty('create_time') && map_obj.message.create_time > latest_time ) {
                            latest = map_obj.message;
                            latest_time = latest.create_time;
                        }
                    }
                }
            }

            return latest;
        }

        class ChatResponse {
            chunk;
            chunk_start;
            payload;
            conversation_id;
            is_done = false;
            is_blocked = false;
            has_content = false;
            handle_latest = false;
            mod_result = ModerationResult.SAFE;
            last_text;
            queue = [];
            constructor(existing_payload, decoded_chunk, download_latest) {
                this.payload = existing_payload;
                this.chunk = decoded_chunk;
                this.chunk_start = this.chunk.indexOf("data: ");
                this.handle_latest = download_latest;
            }
            async process(is_blocked) {
                this.is_blocked = is_blocked;

                if( this.chunk_start == -1 ) {
                    this.queue.push(this.chunk);
                    return;
                }

                while( this.chunk_start != -1 && !this.is_done ) {
                    var chunk_end = this.chunk.indexOf("\n", this.chunk_start);
                    if( chunk_end == -1 ) chunk_end = this.chunk.length-1;
                    var chunk_text = this.chunk.substring(this.chunk_start+5, chunk_end).trim();

                    if( chunk_text == "[DONE]" ) {
                        this.is_done = true;
                        if( this.handle_latest && this.is_blocked) {
                            var latest = await redownloadLatest();
                            if( latest !== null ) {
                                this.payload.message = latest;
                                this.queue.push("data: "+JSON.stringify(this.payload)+"\n\n");
                            }
                            else {
                                this.payload.message.content.parts[0] = "DeMod: Request completed, but DeMod failed to access the history. Try refreshing the conversation instead.";
                                this.queue.push("data: "+JSON.stringify(this.payload)+"\n\n");
                            }
                        }
                        this.queue.push("data: "+chunk_text+"\n\n");
                    }
                    else {
                        var chunk_data = null;
                        try {
                            chunk_data = JSON.parse(chunk_text);
                            if( chunk_data.hasOwnProperty('conversation_id')) this.conversation_id = chunk_data.conversation_id;
                            if( this.payload === null ) {
                                this.payload = {"conversation_id":this.conversation_id, "message":null};
                            }
                            if( (this.payload.message == null && chunk_data.hasOwnProperty('message'))
                               || (this.payload.message.create_date === null && chunk_data.message.create_date !== null) ) {
                                this.payload = JSON.parse(chunk_text); // parse again to make a copy
                                this.payload.message.content = {content_type: "text", "parts": [""]};
                            }
                        }
                        catch(e) { }

                        this.has_content = chunk_data !== null && chunk_data.hasOwnProperty('message') && chunk_data.message.hasOwnProperty('content');

                        if( chunk_data !== null ) {
                            if( chunk_data.hasOwnProperty('moderation_response') ) {
                                var has_flag = chunk_data.moderation_response.flagged === true;
                                var has_block = chunk_data.moderation_response.blocked === true;
                                if( has_flag || has_block ) {
                                    if( has_flag ) {
                                        if( this.mod_result !== ModerationResult.BLOCKED ) this.mod_result = ModerationResult.FLAGGED;
                                    }
                                    console.log("Received chunk contains flagging/blocking properties, clearing");
                                    chunk_data.moderation_response.flagged = false;
                                    chunk_data.moderation_response.blocked = false;
                                }

                                if( has_block ) {
                                    console.log("Message has been BLOCKED. Waiting for ChatGPT to finalize the request...");
                                    this.mod_result = ModerationResult.BLOCKED;
                                    this.is_blocked = true;
                                    if( this.payload !== null && this.payload.message !== null ) {
                                        this.payload.message.author.role = "assistant";
                                        this.payload.message.weight = 1;
                                        this.payload.message.content.parts[0] = "DeMod: Moderation has intercepted the response and is actively blocking it. Waiting for ChatGPT to finalize the request so DeMod can fetch it from the conversation's history...";
                                        chunk_data = this.payload;
                                    }
                                }
                            }

                            if( this.has_content && chunk_data.message.content.hasOwnProperty('content_type') && chunk_data.message.content.content_type === 'text' && chunk_data.message.content.hasOwnProperty('parts') ) {
                                this.last_text = JSON.parse(JSON.stringify(chunk_data)); // cloning
                            }
                            else {
                                this.queue.push("data: "+JSON.stringify(chunk_data)+"\n\n");
                            }
                        }
                        else {
                            this.queue.push("data: "+chunk_text+"\n\n");
                        }
                    }

                    this.chunk_start = this.chunk.indexOf("data: ", chunk_end+1);
                }

                return true;
            }

            replace(latest) {
                if( latest !== null ) {
                    this.payload.message = latest;
                    return "data: "+JSON.stringify(this.payload)+"\n\n";
                }
                else {
                    this.payload.message.content.parts[0] = "DeMod: Request completed, but DeMod failed to access the history. Try refreshing the conversation instead.";
                    return "data: "+JSON.stringify(this.payload)+"\n\n"
                }
            }
        }

        class ChatEvent {
            event;
            response_data;
            response_object;
            response_body;
            response = null;
            payload = null;
            constructor(current_payload, event) {
                this.event = event;
                this.payload = current_payload;
                this.response_data = decodeData(event.data);
                if( this.response_data != null ) {
                    this.response_object = JSON.parse(this.response_data);
                    if( this.has_body ) {
                        this.response_body = atob(this.response_object.data.body);
                        this.response = new ChatResponse(this.payload, this.response_body, false);
                    }
                }
            }

            get is_valid() { return this.response != null; }
            get has_body() { return this.response_object != null && this.response_object.type == "message" && this.response_object.dataType == "json" && this.response_object.data.body != null; }
            get has_content() { return this.is_valid && this.has_body && this.response.has_content; }
            get is_blocked() { return this.response.is_blocked; }
            get is_done() { return this.response.is_done; }
            get mod_result() { return this.response.mod_result; }

            async process(is_blocked) {
                await this.response.process(is_blocked);

                var data = "";
                for(const entry of this.response.queue) {
                    data += entry;
                }

                this.setBody(data);
            }

            replace(latest) {
                if( this.response == null ) {
                    this.response = new ChatResponse(this.payload, "", false);
                }
                var data = this.response.replace(latest);
                this.setBody(data);
            }

            setBody(body) {
                this.response_body = body;
                this.response_object.data.body = btoa(this.response_body);
                this.response_data = JSON.stringify(this.response_object);
                this.event = cloneEvent(this.event, this.response_data);
            }
        }

        // Intercepter for old fetch() based communication
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

            var is_conversation = fetch_url.indexOf('/complete')!=-1 || (fetch_url.indexOf('/conversation') != -1 && fetch_url.indexOf('/conversations') == -1);
            var convo_type = ConversationType.UNKNOWN;
            if( is_conversation ) {
                if( fetch_url.indexOf("/gen_title") != -1 ) {
                    var init_url = fetch_url.replace("/gen_title", "");
                    if( is_request ) {
                        arg = cloneRequest(arg[0], init_url, "GET", null);
                        arg.headers.delete("Content-Type");
                    }
                    else {
                        arg = JSON.parse(JSON.stringify(arg));
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

                        last_response = null;
                        is_blocked = false;
                        mod_result = ModerationResult.SAFE;
                        updateDeModMessageState(mod_result);
                        startRedrawTests();

                        console.log("Processing basic prompted conversation. Scanning for moderation results...");
                        const stream = new ReadableStream({
                            async start(controller) {
                                var reader = original_result.body.getReader();
                                var timestamp = Date.now();
                                var time_delay = 2000; // delay starts large as to not fill the controller too early

                                var text_response;
                                var buffer = [];
                                function flushBuffer() {
                                    for( const entry of buffer ) {
                                        controller.enqueue(entry);
                                    }
                                    if( text_response !== null ) {
                                        controller.enqueue(text_response);
                                    }
                                    text_response = null;
                                    buffer.length = 0;
                                }

                                while (true) {
                                    const { done, value } = await reader.read();

                                    var raw_chunk = value || new Uint8Array;
                                    var chunk = decoder.decode(raw_chunk);
                                    var response = new ChatResponse(payload, chunk, true);

                                    await response.process(is_blocked);

                                    if( mod_result < response.mod_result ) {
                                        mod_result = response.mod_result;
                                        updateDeModMessageState(mod_result);
                                    }
                                    is_blocked = response.is_blocked;
                                    payload = response.payload;

                                    for( const entry of response.queue ) {
                                        buffer.push( encoder.encode(entry) );
                                    }
                                    if( response.last_text !== null ) {
                                        text_response = "data: "+JSON.stringify(response.last_text)+"\n\n";
                                        text_response = encoder.encode(text_response);
                                    }

                                    if( has_redraw ) {
                                        has_redraw = false;
                                        var current_time = Date.now();
                                        if( (current_time-timestamp) > time_delay ) {
                                            timestamp = current_time;
                                            time_delay = 1000;
                                            flushBuffer();
                                        }
                                    }

                                    if( response.is_done || done ) {
                                        flushBuffer();
                                        stopRedrawTests();
                                        controller.close();
                                        break;
                                    }
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

        // Interceptor for new WebSocket communication (credit to WebSocket Logger for making this possible)
        var original_websocket = target_window.WebSocket;
        target_window.WebSocket = new Proxy(original_websocket, {
            construct: function (target, args, newTarget) {
                var ws = new target(...args);
                console.log("WebSocket interceptor created, connecting to: " + args[0]);

                var buffer = [];

                async function processMessage(original_onmessage, event) {
                    var response = new ChatEvent(payload, event);
                    if( response.is_valid ) {
                        await response.process(is_blocked);

                        if( mod_result < response.mod_result ) {
                            mod_result = response.mod_result;
                            updateDeModMessageState(mod_result);
                        }

                        var blocked = response.is_blocked;
                        payload = response.payload;

                        if(blocked) {
                           if( response.is_done ) {
                               console.log("Response finalized.");
                               if( last_response != null ) {
                                   var latest = await redownloadLatest();
                                   last_response.replace(latest);
                                   buffer.push(last_response);
                               }
                               buffer.push(response);
                            }
                            else {
                                if( blocked != is_blocked ) {
                                    is_blocked = true;
                                    last_response = response;
                                }
                                else if( response.has_body ) {
                                    last_response = null;
                                    buffer.push(response);
                                }
                                else {
                                    buffer.push(response);
                                }
                            }
                        }
                        else {
                            buffer.push(response);
                        }

                        var entry;
                        try {
                            for(entry of buffer) {
                                original_onmessage(entry.event);
                            }
                            buffer.length = 0;
                        }
                        catch(e) {
                            console.log("Failed to send parsed response: "+entry.response_data+"\n\nWith body: "+entry.response_body);
                        }
                    }
                    else {
                        original_onmessage(event);
                    }
                };

                var ws_proxy = {
                    set: function (target, prop, v) {
                        if (prop == 'onmessage') {
                            var original_onmessage = v;
                            v = (e) => processMessage(original_onmessage, e);
                        }
                        return target[prop] = v;
                    }
                };

                return new Proxy(ws, ws_proxy);
            }
        });

        // Bonus functionality: blocking tracking calls
        XMLHttpRequest.prototype.realOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            if( is_on && url.indexOf("/track/?") != -1 ) return;
            this.realOpen (method, url, async, user, password);
        }

        document.body.appendChild(demod_div);
        is_on = getDeModState();
        updateDeModState();
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
