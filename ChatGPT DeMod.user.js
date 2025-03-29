// ==UserScript==
// @name         ChatGPT DeMod
// @namespace    pl.4as.chatgpt
// @version      5.2
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

(function () {
	'use strict';
	const target_window = typeof(unsafeWindow) === 'undefined' ? window : unsafeWindow;
	const original_fetch = target_window.fetch;

	const DEMOD_ID = 'demod-cont';
	const DEMOD_KEY = 'DeModState';
	var is_on = false;
	var is_over = false;

	const ButtonState = {
		DISABLED: 0,
		OFF: 1,
		ON: 2,
	};

	var demod_button;
	function updateDeModState() {
		if (is_on) {
			updateButton(demod_button, ButtonState.ON, "DeMod:");
		} else {
			updateButton(demod_button, ButtonState.OFF, "DeMod:");
		}
	}

	const ModerationResult = {
		UNKNOWN: 0,
		SAFE: 1,
		FLAGGED: 2,
		BLOCKED: 3,
	};

	var demod_status;
	function updateDeModMessageState(mod_result) {
		if (demod_status === null)
			return;

		switch (mod_result) {
		case ModerationResult.UNKNOWN:
			demod_status.style.border = '0px';
			demod_status.textContent = "Latest: None";
			demod_status.style.backgroundColor = '#9A9A9A';
			break;
		case ModerationResult.SAFE:
			demod_status.style.border = '0px';
			demod_status.textContent = "Latest: Safe";
			demod_status.style.backgroundColor = '#4CAF50';
			break;
		case ModerationResult.FLAGGED:
			demod_status.style.border = '1px dotted white';
			demod_status.textContent = "Latest: Flagged";
			demod_status.style.backgroundColor = '#ACA950';
			break;
		case ModerationResult.BLOCKED:
			demod_status.style.border = '1px solid white';
			demod_status.textContent = "Latest: BLOCKED";
			demod_status.style.backgroundColor = '#AF4C50';
			break;
		}
	}

	function updateButton(button, state, label) {
		if (button === null)
			return;

		if (is_over) {
			button.style.height = 'auto';
			button.style.border = '0px';
			button.style.padding = '4px 12px';
			button.style.opacity = 1;
			button.style.borderRadius = '4px';
			switch (state) {
			case ButtonState.DISABLED:
				button.style.opacity = 0.5;
				button.style.backgroundColor = '#AAAAAA';
				button.textContent = label + " N/A";
				break;
			case ButtonState.OFF:
				button.style.backgroundColor = '#AF4C50';
				button.textContent = label + " Off";
				break;
			case ButtonState.ON:
				button.style.border = '1px dotted white';
				button.style.padding = '3px 11px';
				button.style.backgroundColor = '#4CAF50';
				button.textContent = label + " On";
				break;
			}
		} else {
			button.textContent = "";
			button.style.height = '6px';
			button.style.padding = '0px';
			button.style.opacity = 1;
			button.style.borderRadius = '0px';
			switch (state) {
			case ButtonState.DISABLED:
				button.style.opacity = 0.5;
				button.style.backgroundColor = '#AAAAAA';
				break;
			case ButtonState.OFF:
				button.style.backgroundColor = '#AF4C50';
				break;
			case ButtonState.ON:
				button.style.border = '1px dotted white';
				button.style.backgroundColor = '#4CAF50';
				break;
			}
		}
	}

	function hasFlagged(text) {
		return text.match(/(\"blocked\"|\"flagged\"): ?true/ig);
	}
	function hasBlocked(text) {
		return text.match(/(\"blocked\"): ?true/ig);
	}

	function clearFlagging(text) {
		// repeated replacement to ensure the style stays consistant
		text = text.replaceAll(/\"flagged\": true/ig, "\"flagged\": false");
		text = text.replaceAll(/\"blocked\": true/ig, "\"blocked\": false");
		text = text.replaceAll(/\"flagged\":true/ig, "\"flagged\":false");
		text = text.replaceAll(/\"blocked\":true/ig, "\"blocked\":false");
		return text;
	}

	const ConversationType = {
		UNKNOWN: 0,
		INIT: 1,
		PROMPT: 2,
	};

	// DeMod state control
	function getDeModState() {
		var state = target_window.localStorage.getItem(DEMOD_KEY);
		if (state == null)
			return true;
		return (state == "false") ? false : true;
	}

	function setDeModState(demod_on) {
		target_window.localStorage.setItem(DEMOD_KEY, demod_on);
	}

	const FORCE_REDOWNLOAD = true; //for debugging, set to 'true' to always redownload the response.
	// Interceptors shared data
	const DONE = "[DONE]";
	var init_cache = null;
	var backup_cache = null;

	var response_blocked = false;
	var payload = null;
	var last_response = null;
	var last_conv_id = null;
	var mod_result = ModerationResult.UNKNOWN;
	var sequence_shift = 0; //each sequence in the generated response has an id and all ids need to match, so DeMod shifts them to insert own messages if needed.

	var decoder = new TextDecoder();
	var encoder = new TextEncoder();
	function decodeData(data) {
		if (typeof data == 'string') {
			return data;
		} else if (data.byteLength != undefined) {
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

	function redirectConversations(url, conversation_id) {
		var idx = url.indexOf("/textdocs");
		if (idx !== -1)
			return url.substring(0, idx);

		idx = url.indexOf("/conversations");
		if (idx === -1)
			return url;
		return url.substring(0, idx) + "/conversation/" + conversation_id;
	}

	function parseLatest(redownload_text) {
		var latest = null;
		var redownload_object = null;
		try {
			redownload_object = JSON.parse(redownload_text);
		} catch (e) {
			console.log("[DEMOD] Failed to parse re-downloaded response.");
		}
		if (redownload_object !== null && redownload_object.hasOwnProperty('mapping')) {
			var latest_time = 0;
			for (var map_key in redownload_object.mapping) {
				var map_obj = redownload_object.mapping[map_key];
				if (map_obj.hasOwnProperty('message') && map_obj.message != null
					 && map_obj.message.hasOwnProperty('create_time') && map_obj.message.create_time > latest_time) {
					latest = map_obj.message;
				}
			}
		}

		return latest;
	}

	async function redownloadLatest() {
		var original_request = init_cache;
		if (original_request === null) {
			if (last_conv_id === null)
				return null;
			original_request = backup_cache;
		}

		var fetch_url = null;
		if (typeof(original_request[0]) !== 'string') {
			fetch_url = redirectConversations(original_request[0].href, last_conv_id);
			original_request[0] = cloneRequest(original_request[0], fetch_url, "GET", "");
		} else {
			fetch_url = redirectConversations(original_request[0], last_conv_id);
			original_request[0] = fetch_url;
			original_request[1].method = "GET";
			delete original_request[1].body;
		}

		var latest = null;
		var init_redownload = original_fetch(...original_request);
		var redownload_result = await init_redownload;
		if (redownload_result.ok) {
			var redownload_text = await redownload_result.text();
			latest = parseLatest(redownload_text);
		}

		if (latest === null) {
			console.log("[DEMOD] Failed to read the latest response. Trying in few seconds...");
			await new Promise(r => setTimeout(r, 3000));

			init_redownload = original_fetch(...original_request);
			redownload_result = await init_redownload;
			if (redownload_result.ok) {
				redownload_text = await redownload_result.text();
				latest = parseLatest(redownload_text);
			}
		}

		if (latest !== null)
			console.log("[DEMOD] Latest response redownloaded successfully.");

		return latest;
	}

	class ChatPayload {
		data;
		message;

		constructor() {
			this.data = {
				"p": "",
				"o": "patch",
				"v": [{
						"p": "/message/content/parts/0",
						"o": "append",
						"v": ""
					}, {
						"p": "/message/status",
						"o": "replace",
						"v": "finished_successfully"
					}, {
						"p": "/message/end_turn",
						"o": "replace",
						"v": true
					}, {
						"p": "/message/metadata",
						"o": "append",
						"v": {
							"is_complete": true,
							"finish_details": {
								"type": "stop",
								"stop_tokens": [200002]
							}
						}
					}
				]
			}
		}

		getData() {
			return "event: delta\ndata: " + JSON.stringify(this.data) + "\n\n";
		}

		update(chunk_data) {
			if (ChatPayload.isPatch(chunk_data)) {
				this.data = chunk_data;
				if (this.message !== null)
					this.setMessage(this.message);
			}
		}

		setText(text) {
			var v = this.data.v;
			for (let i = 0; i < v.length; ++i) {
				var entry = v[i];
				if (entry.hasOwnProperty("p") && entry.p.indexOf("parts") !== -1) {
					entry.o = "replace";
					entry.v = text;
				}
			}
		}

		setMessage(message) {
			var v = this.data.v;
			for (let i = v.length - 1; i > -1; --i) {
				var value = v[i];
				if (value.hasOwnProperty("p") && value.p.indexOf("parts") !== -1) {
					v.splice(i, 1);
				}
			}

			var parts = message.content.parts;
			for (let i = parts.length - 1; i > -1; --i) {
				var part = parts[i];
				v.push({
					"p": "/message/content/parts/" + i,
					"o": "replace",
					"v": part
				});
			}

			v.push({
				"p": "/message/status",
				"o": "replace",
				"v": "finished_successfully"
			});

			v.push({
				"p": "/message/metadata",
				"o": "append",
				"v": {
					"is_complete": true,
					"finish_details": {
						"type": "stop",
						"stop_tokens": [200002]
					}
				}
			});
		}

		static isPatch(chunk_data) {
			return chunk_data.hasOwnProperty("o") && chunk_data.o === "patch" && chunk_data.hasOwnProperty("v");
		}

		static getConversationId(chunk_data) {
			if (chunk_data.hasOwnProperty('conversation_id'))
				return chunk_data.conversation_id;
			if (chunk_data.hasOwnProperty('v') && chunk_data.v.hasOwnProperty('conversation_id'))
				return chunk_data.v.conversation_id;
			return null;
		}
	}

	class ChatResponse {
		chunk;
		chunk_start;
		payload;
		conversation_id;
		is_done = false;
		is_blocked = false;
		handle_latest = false;
		mod_result = ModerationResult.SAFE;
		queue = [];

		constructor(existing_payload, decoded_chunk, download_latest) {
			this.payload = existing_payload;
			this.chunk = decoded_chunk;
			this.chunk_start = this.chunk.indexOf("data: ");
			this.handle_latest = download_latest;
		}

		async process(current_blocked) {
			this.is_blocked = current_blocked;

			if (this.chunk_start == -1) {
				this.queue.push(this.chunk);
				return;
			}

			if (hasFlagged(this.chunk) || ChatPayload.isPatch(this.chunk) || (this.is_blocked && this.chunk.indexOf(DONE) !== -1) || FORCE_REDOWNLOAD) {
				while (this.chunk_start != -1 && !this.is_done) {
					var chunk_end = this.chunk.indexOf("\n", this.chunk_start);
					if (chunk_end == -1)
						chunk_end = this.chunk.length - 1;
					var chunk_text = this.chunk.substring(this.chunk_start + 5, chunk_end).trim();

					if (chunk_text === DONE) {
						this.is_done = true;
						if (this.handle_latest && (this.is_blocked || FORCE_REDOWNLOAD)) {
							console.log("[DEMOD] Blocked response finished, attempting to reload it from history.");
							var latest = await redownloadLatest();
							if (latest !== null) {
								this.payload.setMessage(latest);
								this.queue.push(this.payload.getData());
							} else {
								this.payload.setText("DeMod: Request completed, but DeMod failed to access the history. Try refreshing the conversation instead.");
								this.queue.push(this.payload.getData());
							}
						}

					} else {
						var chunk_data = null;
						try {
							chunk_data = JSON.parse(chunk_text);
							var conv_id = ChatPayload.getConversationId(chunk_data);
							if (conv_id !== null) {
								this.conversation_id = conv_id;
								last_conv_id = conv_id;
							}
						} catch (e) {}

						if (chunk_data !== null) {
							if (chunk_data.hasOwnProperty('moderation_response')) {
								var has_flag = chunk_data.moderation_response.flagged === true;
								var has_block = chunk_data.moderation_response.blocked === true;
								if (has_flag || has_block) {
									if (has_flag) {
										if (this.mod_result !== ModerationResult.BLOCKED)
											this.mod_result = ModerationResult.FLAGGED;
									}
									console.log("[DEMOD] Received chunk contains flagging/blocking properties, clearing");
									chunk_data.moderation_response.flagged = false;
									chunk_data.moderation_response.blocked = false;
								}

								if (has_block) {
									console.log("[DEMOD] Message has been BLOCKED. Waiting for ChatGPT to finalize the request...");
									this.mod_result = ModerationResult.BLOCKED;
									this.is_blocked = true;
									this.payload.setText("DeMod: Moderation has intercepted the response and is actively blocking it. Waiting for ChatGPT to finalize the request so DeMod can fetch it from the conversation's history...");
									//this.queue.push(this.payload.getData());
								}
							}
						}
					}

					this.chunk_start = this.chunk.indexOf("data: ", chunk_end + 1);
				}

				var cleaned = clearFlagging(this.chunk);
				this.queue.push(cleaned);
			} else {
				this.queue.push(this.chunk);
			}

			return true;
		}
	}

	class ChatEvent {
		event;
		response_data;
		response_object;
		response_body;
		response = null;
		sequence_id;
		constructor(current_payload, event) {
			this.event = event;
			this.response_data = decodeData(event.data);
			this.response_object = JSON.parse(this.response_data);
			this.sequence_id = this.response_object.sequenceId;
			if (this.has_body) {
				this.response_body = atob(this.response_object.data.body);
				this.response = new ChatResponse(current_payload, this.response_body, false);
			}
		}

		get is_valid() {
			return this.response != null;
		}
		get conversation_id() {
			return this.response.conversation_id;
		}
		get has_body() {
			return this.response_object != null && this.response_object.type == "message" && this.response_object.dataType == "json" && this.response_object.data.body != null;
		}
		get is_blocked() {
			return this.response.is_blocked;
		}
		get is_done() {
			return this.response.is_done;
		}
		get mod_result() {
			return this.response.mod_result;
		}
		get payload() {
			if (this.is_valid)
				return this.response.payload;
			else
				return null;
		}

		async process(current_blocked) {
			await this.response.process(current_blocked);

			var data = "";
			for (const entry of this.response.queue) {
				data += entry;
			}

			this.response_body = data;
		}

		getEvent() {
			this.response_object.sequenceId = this.sequence_id;
			this.response_object.data.body = btoa(this.response_body);
			var updated_data = JSON.stringify(this.response_object);
			return cloneEvent(this.event, updated_data);
		}

		clone() {
			var copy = new ChatEvent(this.payload, this.event);
			copy.response_body = this.response_body;
			return copy;
		}
	}

	// Intercepter for old fetch() based communication
	const intercepter_fetch = async function (target, this_arg, args) {
		if (!is_on) {
			return target.apply(this_arg, args);
		}

		var original_arg = args;
		var fetch_url = args[0];
		var is_request = false;
		if (typeof(fetch_url) !== 'string') {
			fetch_url = fetch_url.href;
			is_request = true;
		}

		if (fetch_url.indexOf('/share/create') != -1) {
			console.log("[DEMOD] Share request detected, blocking.");
			return new Response("", {
				status: 404,
				statusText: "Not found"
			});
		}

		var is_conversation = fetch_url.indexOf('/complete') !== -1 || (fetch_url.indexOf('/conversation') !== -1 && fetch_url.indexOf('/conversations') === -1);
		var convo_type = ConversationType.UNKNOWN;
		if (is_conversation) {
			if (fetch_url.indexOf("/gen_title") != -1) {
				var init_url = fetch_url.replace("/gen_title", "");
				if (is_request) {
					console.log("[DEMOD] Generating title (Request).");
					args = cloneRequest(args[0], init_url, "GET", null);
					args.headers.delete("Content-Type");
				} else {
					console.log("[DEMOD] Generating title (basic).");
					args = JSON.parse(JSON.stringify(args));
					args[0] = init_url;
					args[1].method = "GET";
					delete args[1].headers["Content-Type"];
					delete args[1].body;
				}
			}

			var conv_request = null;
			if (is_request) {
				if (args[0] !== undefined && args[0].hasOwnProperty('text') && (typeof args[0].text === 'function')) {
					conv_request = await args[0].text();
				}
			} else {
				if (args[1] !== undefined && args[1].hasOwnProperty('body')) {
					conv_request = args[1].body;
				}
			}

			if (conv_request) {
				convo_type = ConversationType.PROMPT;
				var conv_body = JSON.parse(conv_request);

				if (is_request) {
					args[0] = cloneRequest(args[0], fetch_url, args[0].method, conv_body);
				} else {
					args[1].body = JSON.stringify(conv_body);
				}
			} else if(fetch_url.indexOf('/conversation/') !== -1) {
				convo_type = ConversationType.INIT;
				init_cache = args;
			}
		} else if (fetch_url.indexOf('/conversations') !== -1) {
			backup_cache = JSON.parse(JSON.stringify(args));
		}

		var original_promise = target.apply(this_arg, original_arg);

		if (is_conversation) {
			var original_result = await original_promise;

			if (!original_result.ok) {
				return original_result;
			}

			switch (convo_type) {
			case ConversationType.PROMPT: {

					payload = new ChatPayload();
					sequence_shift = 0;
					last_response = null;
					response_blocked = false;
					mod_result = ModerationResult.SAFE;
					updateDeModMessageState(mod_result);

					console.log("[DEMOD] Processing basic prompted conversation. Scanning for moderation results...");
					const stream = new ReadableStream({
						async start(controller) {
							var reader = original_result.body.getReader();

							while (true) {
								const {
									done,
									value
								} = await reader.read();

								var raw_chunk = value || new Uint8Array;
								var chunk = decoder.decode(raw_chunk);
								var response = new ChatResponse(payload, chunk, true);

								await response.process(response_blocked);

								if (mod_result < response.mod_result) {
									mod_result = response.mod_result;
									updateDeModMessageState(mod_result);
								}
								response_blocked = response.is_blocked;
								payload = response.payload;

								for (const entry of response.queue) {
									const encoded_chunk = encoder.encode(entry);
									controller.enqueue(encoded_chunk);
								}

								if (response.is_done || done) {
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
					console.log("[DEMOD] Processing conversation initialization. Checking if the conversation has existing moderation results.");

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

	const intercepter = new Proxy(original_fetch, {
		apply: intercepter_fetch
	});
	target_window.fetch = intercepter;

	// Interceptor for new WebSocket communication (credit to WebSocket Logger for making this possible)
	var original_websocket = target_window.WebSocket;
	target_window.WebSocket = new Proxy(original_websocket, {
		construct: function (target, args, newTarget) {
			var ws = new target(...args);
			console.log("[DEMOD] WebSocket interceptor created, connecting to: " + args[0]);

			var buffer = [];

			async function processMessage(original_onmessage, event) {
				if (!is_on)
					original_onmessage(event);

				var response = new ChatEvent(payload, event);
				if (response.is_valid) {
					await response.process(response_blocked);

					if (mod_result < response.mod_result) {
						mod_result = response.mod_result;
						updateDeModMessageState(mod_result);
					}

					response_blocked = response.is_blocked;
					payload = response.payload;

					if (response.has_body) {
						last_response = response.clone();
						last_response.sequence_id += sequence_shift;
					}

					if (response_blocked) {
						if (response.is_done) {
							if (last_response != null) {
								console.log("[DEMOD] Response blocked, redownloading from history.");
								var latest = await redownloadLatest();
								last_response.replace(latest);
								buffer.push(last_response);
								sequence_shift++;
							}
						}
					}

					response.sequence_id += sequence_shift;
					buffer.push(response);

					var entry;
					try {
						for (entry of buffer) {
							var entry_event = entry.getEvent();
							original_onmessage(entry_event);
						}
						buffer.length = 0;
					} catch (e) {
						console.log("[DEMOD] Failed to send parsed response: " + entry.response_data + "\n\nWith body: " + entry.response_body);
					}
				} else {
					original_onmessage(event);
				}
			};

			var ws_proxy = {
				set: function (target, prop, v) {
					if (prop == 'onmessage') {
						var original_onmessage = v;
						v = (e) => processMessage(original_onmessage, e);
					}
					return (target[prop] = v);
				}
			};

			return new Proxy(ws, ws_proxy);
		}
	});

	var demod_init = async function () {
		if (document.getElementById(DEMOD_ID) || !document.body)
			return;

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
		demod_button = document.createElement('button');
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
		demod_status = document.createElement('div');
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
		demod_status.style.backgroundColor = '#9A9A9A';
		demod_status.textContent = "Latest: None";

		demod_div.appendChild(demod_status);

		demod_div.onmouseover = function () {
			is_over = true;
			demod_status.style.fontSize = '10px';
			demod_status.style.height = '32px';
			demod_status.style.padding = '7px 3px';
			updateDeModState();
		};
		demod_div.onmouseout = function () {
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

		document.body.appendChild(demod_div);
		is_on = getDeModState();
		updateDeModState();
		console.log("[DEMOD] DeMod UI attached.");
	};

	if (document.readyState === 'loading') {
		target_window.addEventListener("DOMContentLoaded", demod_init);
	} else {
		demod_init();
	}

	const observer = new MutationObserver(demod_init);
	observer.observe(document.documentElement || document.body, {
		childList: true,
		subtree: true
	});

	window.addEventListener('popstate', demod_init);
})();
