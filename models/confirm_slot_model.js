var mongoose = require('mongoose');
//var DateTimeModel = require('../models/date_time_model');
//var DateTimeModelSchema = mongoose.model('DateTimeModel').schema;
var Schema = mongoose.Schema;

var ConfirmSlotModel = new mongoose.Schema({
    hr_email : { type: String },
    referral_email: { type: String },
    available_dates : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DateTimeModel'
    }]
});

module.exports = mongoose.model('ConfirmSlotModel', ConfirmSlotModel);