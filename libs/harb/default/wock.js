const UL = require('url');

module.exports = async function($) {
	const { C, G } = $;

	const WebSocket = require('ws');

	const wockServ = new WebSocket.Server({
		noServer: true,
		perMessageDeflate: {
			zlibDeflateOptions: {
				chunkSize: 1024,
				memLevel: 7,
				level: 3,
			},
			zlibInflateOptions: {
				chunkSize: 10 * 1024
			},
			clientNoContextTakeover: true,
			serverNoContextTakeover: true,
			serverMaxWindowBits: 10,
			concurrencyLimit: 10,
			threshold: 1024,
		},
	});

	const prefix = UL.resolve(C.prefix || '/', C.wock.prefix || '/');
	const ping = C.wock.ping !== false;

	// 各时机函数
	const handles = {
		before: [],
		after: [],
		upgrade: [],
		close: [],
	};

	// 时机中间件
	for(const func of C.wock.before || []) {
		handles.before.push(await func($));
	}
	for(const func of C.wock.after || []) {
		handles.after.push(await func($));
	}
	for(const func of C.wock.upgrade || []) {
		handles.upgrade.push(await func($));
	}
	for(const func of C.wock.close || []) {
		handles.close.push(await func($));
	}

	// 挂载到http协议下
	$.serv.on('upgrade', function(request, socket, head) {
		if(UL.parse(request.url).pathname == prefix) {
			for(const func of handles.upgrade) {
				if(typeof func == 'function') {
					func(request, socket, head);
				}
			}

			wockServ.handleUpgrade(request, socket, head, function(ws) {
				wockServ.emit('connection', ws, request);
			});
		}
	});

	// 事件Map
	const handDict = {
		ping(wock) { wock.cast('pong'); }
	};

	wockServ.on('connection', function(wock) {
		wock.cast = function(type, ...data) {
			try {
				wock.send(JSON.stringify({ type, data }));
			}
			catch(error) {
				if(error.message.indexOf('CLOSED') == -1) {
					G.error('服务', `Socket事件{${type}}`, error);
				}
			}
		};

		let check;
		let pingOut;
		let timeOut;
		let outCount = 0;

		let oneOff = false;
		const closeHandle = function(reason) {
			if(oneOff) { return; }

			oneOff = true;

			for(const func of C.wock.close) {
				if(typeof func == 'function') {
					func(reason, wock);
				}
			}

			if(ping) {
				clearTimeout(pingOut);
				clearTimeout(timeOut);
			}
		};

		wock.on('error', function(error) { closeHandle(`错误，${error.message}`); });
		wock.on('close', function() { closeHandle('关闭连接'); });

		if(ping) {
			check = function(clearCount = true) {
				clearTimeout(pingOut);
				clearTimeout(timeOut);

				if(clearCount) {
					outCount = 0;
				}

				pingOut = setTimeout(function() {
					wock.cast('ping');

					timeOut = setTimeout(function() {
						outCount++;

						if(outCount >= 4) {
							wock.close();
						}
						else {
							check(false);
						}
					}, 24000);
				}, 10000);
			};
		}

		wock.on('message', async function(raw) {
			if(ping) {
				check();
			}

			let event = {};
			try {
				event = JSON.parse(raw);
			}
			catch(error) { return; }

			if(event.type && handDict[event.type]) {
				if(event.data instanceof Array) {
					handDict[event.type](wock, ...event.data);
				}
				else {
					handDict[event.type](wock, event.data);
				}
			}
		});

		if(ping) {
			check();
		}
	});

	$.wockMan = {
		serv: wockServ,

		add(name, func) {
			if(!name && !(func instanceof Function)) { return false; }

			handDict[name] = func;
		},
		del(name) {
			if(!name) { return false; }

			delete handDict[name];
		},
		get(name) {
			return handDict[name];
		},
		run(name, ...data) {
			handDict[name](...data);
		}
	};
};