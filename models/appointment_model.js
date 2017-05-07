var mongoose = require('mongoose');
//var DateTimeModel = require('../models/date_time_model');
//var DateTimeModelSchema = mongoose.model('DateTimeModel').schema;
var Schema = mongoose.Schema;

var Appointment = new mongoose.Schema({
    hr_email : { type: String },
    referral_email: { type: String },
    selectedDate : { type: String },
});

module.exports = mongoose.model('Appointment', Appointment);