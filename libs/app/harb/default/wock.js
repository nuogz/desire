module.exports = async function($, wockInfo = {}) {
	let { G, C } = $;

	let WebSocket = require('ws');

	let wockServ = new WebSocket.Server({
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

	let prefix = _ul.resolve(C.serv.prefix || '/', C.serv.wock.prefix || '/');
	let ping = C.serv.wock.ping != undefined && !C.serv.wock.ping;

	// 挂载到http协议下
	$.Serv.on('upgrade', function(request, socket, head) {
		if(_ul.parse(request.url).pathname == prefix) {
			for(let func of $.WockMan.upgradeFunc) {
				if(typeof func == 'function') {
					func(request, socket, head);
				}
			}

			wockServ.handleUpgrade(request, socket, head, function(ws) {
				wockServ.emit('connection', ws, request);
			});
		}
	});

	// 获取前后置函数
	let beforeFunc = [];
	let afterFunc = [];

	// 前置中间件
	for(let func of (wockInfo.before || [])) {
		beforeFunc.push(await func($));
	}
	for(let func of (wockInfo.after || [])) {
		afterFunc.push(await func($));
	}

	wockInfo.before = beforeFunc;
	wockInfo.after = afterFunc;

	// 事件Map
	let handDict = {
		ping: function(wock) {
			wock.cast('pong');
		}
	};

	wockServ.on('connection', function(wock) {
		wock.cast = function(type, ...data) {
			try {
				wock.send(JSON.stringify({ type, data }));
			}
			catch(error) {
				if(error.message.indexOf('CLOSED') == -1) {
					G.error(error.stack);
				}
			}
		};

		let check;
		let pingOut;
		let timeOut;
		let outCount = 0;

		let oneOff = false;
		let closeHandle = function(reason) {
			if(oneOff) { return; }

			oneOff = true;

			for(let func of $.WockMan.closeFunc) {
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

	$.WockMan = {
		serv: wockServ,

		closeFunc: [],
		upgradeFunc: [],

		add: function(name, func) {
			if(!name && !(func instanceof Function)) { return false; }

			handDict[name] = func;
		},
		del: function(name) {
			if(!name) { return false; }

			delete handDict[name];
		},
		get: function(name) {
			return handDict[name];
		},
		run: function(name, ...data) {
			handDict[name](...data);
		}
	};
};