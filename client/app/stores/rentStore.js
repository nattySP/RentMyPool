// get pool listings from the server
var _fetchEntries = function () {
  return new Promise(function (resolve, reject) {
    $.get("/rentItems", function (data) {
      resolve(data);
    });
  });
};

// add a listing to the server
var _postBooking = function (date, id) {
  return new Promise(function (resolve, reject) {
    $.ajax({
      url: "/book",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({date : date, _id : id}),
      statusCode: {
        302: function (data) {
          resolve({
            statusCode: 302,
            data: data
          });
        },
        500: function (err) {
          console.log("Error:", err)
          reject(err);
        }
      }
    });
  });
};

var _cancelBooking = function(data) {
  console.log('cancelBooking Data: ', data);
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: "/deleteBooking",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({booking: data}),
      statusCode: {
        201: function (data) {
          resolve({
            statusCode: 201,
            data: data
          });
        },
        500: function (err) {
          console.log("Error:", err);
          reject(err);
        }
      }
    });
  });
};

var _getUserReviews = function(id) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: "/userReviews",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({user_id: id}),
      statusCode: {
        201: function (data) {
          resolve({
            statusCode: 201,
            data: data
          });
        },
        500: function (err) {
          console.log("Error:", err);
          reject(err);
        }
      }
    });
  });
};

var _postReview = function(review) {
  console.log('_postReview');
  console.log(review);
  return new Promise(function (resolve, reject) {
    $.ajax({
      url: "/review",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(review),
      statusCode: {
        201: function (data) {
          resolve({
            statusCode: 201,
            data: data
          });
        },
        500: function (err) {
          console.log("Error:", err)
          reject(err);
        }
      }
    });
  });
};

// call weather underground api
var _getWeather = function(city, state, requestedMonth, requestedDay, weatherYear, callback) {
  $.ajax({
    url : "http://api.wunderground.com/api/3bebaec867a8aa26/forecast10day/conditions/q/" + state + "/" + city + ".json",
    dataType : "jsonp",
    success : function(parsed_json) {
      // compare current date with requested date
      var forecasts = parsed_json['forecast']['simpleforecast']['forecastday'];

      // try to find weather for requested day
      var weatherDay = 0; // index of day to show

      for(var i=0;i<forecasts.length;i++) {
        if(forecasts[i].date.day == requestedDay && forecasts[i].date.month == requestedMonth) {
          weatherDay = i; // 
        } 
      }

      var location = parsed_json['current_observation']['display_location']['city'];
      var state = parsed_json['current_observation']['display_location']['state'];
      var icon = forecasts[weatherDay]['icon_url'];
      var conditions = forecasts[weatherDay]['conditions'];
      var highTemp = forecasts[weatherDay]['high']['fahrenheit'];
      var day = forecasts[weatherDay]['date']['day'];
      var month = forecasts[weatherDay]['date']['month'];
      var dayName = forecasts[weatherDay]['date']['weekday'];

      // update data for weather component
      callback({show: true, location: location+', '+state, date: month+'/'+day, dayName: dayName, highTemp: highTemp, conditions: conditions, icon: icon});
    }
  });
};

var RentStore = ObjectAssign({}, EventEmitter.prototype, {

  addListener: function(eventName, callback) {
    this.on(eventName, callback);
  },

  removeDaListener: function(eventName, callback) {
    this.removeListener(eventName, callback);
  },

  addPoolTypeAddListener: function(callback) {
    this.on(ListingsConstants.POOL_TYPE_ADD, callback);
  },

  addPoolTypeRemoveListener: function(callback) {
    this.on(ListingsConstants.POOL_TYPE_REMOVE, callback);
  },

  removePoolTypeAddListener: function(callback) {
    this.removeListener(ListingsConstants.POOL_TYPE_ADD, callback);
  },

  removePoolTypeRemoveListener: function(callback) {
    this.removeListener(ListingsConstants.POOL_TYPE_REMOVE, callback);
  }, 

  addRemoveDetailsListener: function(callback) {
    this.on(RentConstants.REMOVE_DETAILS, callback);
  }

});

// these actions are called when the dispatcher in rentActions emits an action (ex. ENTRY_CLICKED or FETCH_ENTRIES)
RentDispatcher.register(function (action) {
  var actions = {};

  actions[RentConstants.ENTRY_CLICKED] = function () {
    RentStore.emit(RentConstants.ENTRY_CLICKED, action.load);
  };

  // fetch data from the server, then emit a change to listening views and send the listing data
  actions[RentConstants.FETCH_ENTRIES] = function () {
    _fetchEntries()
      .then(function (data) {
        RentStore.emit(RentConstants.FETCH_ENTRIES, data.results);
      });
  };

  actions[RentConstants.NEW_BOOKING] = function () {
    console.log('new booking');
    console.log(action.load);
    _postBooking(action.load.listing.date, action.load.listing._id)
      .then(function (data) {
        RentStore.emit(RentConstants.NEW_BOOKING, data);
      })
      .catch(function (err) {
        console.log("Booking Error.",err);
      });
  };

  actions[RentConstants.FILTER_CHANGE] = function () {
    RentStore.emit(RentConstants.FILTER_CHANGE, action.load);
  };

  actions[RentConstants.REVIEW_SUBMITTED] = function () {
    console.log('REVIEW SUBMITTED!')
    console.log(action.load);
    //post request to server
    _postReview(action.load)
      .then(function (data) {
        console.log('posted');
        RentStore.emit(RentConstants.NEW_REVIEW, data.data);
      })
      .catch(function (err) {
        console.log('error', err);
      });
  };

  actions[RentConstants.FETCH_REVIEWS] = function() {
    console.log('fetching reviews...');
    console.log(action.load);

    //get the user's reviews from server
    _getUserReviews(action.load)
      .then(function (data) {
        console.log('got reviews');
        console.log(data.data);
        RentStore.emit(RentConstants.REVIEW_SUBMITTED, data.data);
      })
      .catch(function (err) {
        console.log('error', err);
      });
  };

  actions[RentConstants.CITYSTATE] = function() {
    RentStore.emit(RentConstants.CITYSTATE, action.load);
  };

  actions[RentConstants.REMOVE_DETAILS] = function(){
    RentStore.emit(RentConstants.REMOVE_DETAILS, null);
  }

  actions[RentConstants.CANCEL_BOOKING] = function() {
    console.log('cancel booking');
    _cancelBooking(action.load)
      .then(function (data) {
        console.log('deleted');
        AppActions.fetchUser();
      })
      .catch(function (err) {
        console.log('error', err);
      });
  };

  actions[RentConstants.BOOK_DATE] = function() {
    RentStore.emit(RentConstants.BOOK_DATE, action.load);
  }

  actions[action.type]();
});

ListingsDispatcher.register(function (action) {
  var actions = {};

  actions[ListingsConstants.POOL_TYPE_ADD] = function () {
    console.log('pool type add dispatched event heard in rentStore');
    RentStore.emit(ListingsConstants.POOL_TYPE_ADD, action.load);
  };

  actions[ListingsConstants.POOL_TYPE_REMOVE] = function () {
    console.log('pool type remove dispatched event heard in rent store');
    RentStore.emit(ListingsConstants.POOL_TYPE_REMOVE, action.load);
  };
  
  if (actions[action.type]){
    actions[action.type]();
  }

})
