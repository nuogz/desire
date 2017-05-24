let connect;

module.exports = async(dbname) => {
	if(!connect)
		connect = await require('mongodb').MongoClient.connect('mongodb://localhost:27017/');

	let coll = connect.db(dbname);

	return async() => {
		return {
			find: async (query) => {
				return coll.find(query);
			}

		}
	};
};