module.exports = async(dbinfo) => {
	let connect;

	if(!connect) {
		connect = await require('mongodb').MongoClient.connect(`mongodb://${dbinfo.user}:${dbinfo.pswd}@${dbinfo.dest}:${dbinfo.port}/${dbinfo.name}`);

		delete dbinfo.user;
		delete dbinfo.pswd;
	}

	let db = connect.db(dbinfo.name);

	return {
		coll: async(collname) => {
			let coll = db.collection(collname);

			return {
				find: async(query) => {
					return coll.find(query);
				}
			};
		}
	};
};