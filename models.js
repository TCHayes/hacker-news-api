const mongoose = require('mongoose');

const newsItemSchema = mongoose.Schema({
	title: {type: String, required: true},
	url: {type: String, required: true},
	votes: {type: Number, default: 0}
});

newsItemSchema.methods.apiRepr = function() {
	return {
		id: this._id,
		title: this.title,
		url: this.url,
		votes: this.votes
	};
}

const NewsItem = mongoose.model('NewsItem', newsItemSchema);

module.exports = {NewsItem};