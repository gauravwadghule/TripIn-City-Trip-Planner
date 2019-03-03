var mongoose =require('mongoose');

var poiSchema = new mongoose.Schema({
place_id:{ type: String, unique: true},
name: String,
rating: Number,
formatted_address: String,
types:[],
best_time: String,
best_season: String,
city: String,
updated_at: { type: Date, default: Date.now },
geometry:[{location:[],viewport:[]}],
icon: String,
id: String,
opening_hours:[],
photos: [],
plus_code: [],
reference: String

});
module.exports = mongoose.model('poi', poiSchema);