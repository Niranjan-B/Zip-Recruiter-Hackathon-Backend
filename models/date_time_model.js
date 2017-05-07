var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DateTimeModel = new Schema({
    avDate : { type: String },
    times : [String]
});

module.exports = mongoose.model('DateTimeModel', DateTimeModel);