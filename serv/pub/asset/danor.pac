var matches = [
	'google.com',
	'google-analytics.com',
	'gstatic.com',
	'blogspot.com',
	'blogspot.jp',
	'blogger.com',
	'blogblog.com',
	'youtube.com',
	'youtu.be',
	'twitter.com',
	't.co',
	'twimg.com',
	'facebook.com',
	'fbcdn.net',
	'wikipedia.org',
	'disqus.com',
	'nicovideo.jp',
	'surrenderat20.net',
	'sencha.com'
];

function FindProxyForURL(url, host) {
	var match;

	for(var i in matches) {
		match = matches[i];
		if(dnsDomainIs(host, match))
			return 'SOCKS5 127.0.0.1:1080';
	}

	return 'DIRECT';
}