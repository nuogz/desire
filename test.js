let MongoClient = require('mongodb').MongoClient;
let s = process.argv[2];

console.log(s);

MongoClient.connect('mongodb://localhost:27017/kq', function(err, db) {
	let collection = db.collection(`${s}`);

	let rd = require(`./serv/kq/data/${s}/data.json`),
		rm = require(`./serv/kq/data/${s}/mark.json`),
		rda = [];

	for(let id in rd) {
		rd[id].mark = rm[id];
		rda.push(rd[id]);
	}

	console.log(rda.length);

	collection.insert(rda, function(err) {
		if(err) {
			console.log(`${s} data erro`);
			console.log(err);
			return;
		}
		else
			console.log(`${s} data done`);
	});
});
