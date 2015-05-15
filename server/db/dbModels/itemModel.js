var mongoose = require('mongoose');


var itemSchema = mongoose.Schema({
  name: {type: String, required: true},
  address: {type: String, required: true},
  price: {type: Number, required: true},
  poolType: String, 
  calendar: {},
  rules: [],
  startDate: String,
  endDate: String,
  date: "", //change to an array for date ranges
  user_id: {type: String, required: true},
  img : {type: String, required: false},
  booker_id: { type: String }
});

var Item = mongoose.model('Item', itemSchema );

module.exports = Item;
