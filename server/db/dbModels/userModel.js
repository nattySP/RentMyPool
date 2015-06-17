var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
    username : { type: String, required:  true, unique: true },
    password : { type:String, required: true},
    reviews: Array,
    avgRating: Number, 
    bookings: Array //averaged from star rating values
    //info on user
    // - email
    // - firstName
    // - lastName
});

var User = mongoose.model('User', userSchema);

User.prototype.comparePassword = function(attemptedPassword, callback) {
  var realPassword = this.get('password');
  console.log('attemptedPassword: ', attemptedPassword);
  bcrypt.compare(attemptedPassword, this.password, function(err, isMatch) {
    if(err) { 
        console.log('error in password compare!');
        callback(err);
    }
    console.log('comparePassword isMatch: ', isMatch);
    callback(null, isMatch);
  });
};

userSchema.pre('save', function(next) {
    var self = this;
    bcrypt.hash(this.password, null, null, function(err, hash) {
        if(err) {
            console.log('error in hashing!', err)
        } else {
            self.password = hash;
            console.log('hash success! ', self.password);
            next();
        }
    });
});

module.exports = User;
