// view for an individual entry in the pool listing
var ListEntry = React.createClass({

  handleClick: function () {
    RentActions.entryClicked(this.props);
  },

  render: function () {
    var listing; 
    if (Object.keys(this.props.listing).length){
      listing = this.props.listing.name +' - ' + this.props.listing.address + ' - ' + this.props.listing.price + ' - ' + new Date(this.props.listing.startDate).toDateString().slice(3)+ ' - ' + new Date(this.props.listing.endDate).toDateString().slice(3);
    } else {
      listing = 'Sorry, no listings match that criteria';
    }

    return (
      <div className="listEntry" onClick={this.handleClick}>
        {listing}
      </div>
    );
  }

});

// view for the list of available pools
var Listings = React.createClass({

  getInitialState: function () {
    return {
      data: [],
      allData: []
    };
  },

  /*
   * before mounting:
   * - add listeners. 
   *   addFetchEntriesListener listens for changes in the data (ex. adding a new listing), and refreshes the list
   *    addFilterChangeListener listens for search input and filters the data
   * - fetch the entries from the server, which triggers this.refreshResults
   *
   */
  componentWillMount: function () {
    RentStore.addListener(RentConstants.FETCH_ENTRIES, this.refreshResults);
    RentStore.addListener(RentConstants.FILTER_CHANGE, this.handleFilterChange);

    RentActions.fetchEntries();
  },

  componentWillUnmount: function () {
    RentStore.removeDaListener(RentConstants.FETCH_ENTRIES, this.refreshResults);
    RentStore.removeDaListener(RentConstants.FILTER_CHANGE, this.handleFilterChange);    
  },

  handleNewEntries: function (data) {
    if (data.length) {
      this.setState({data: data});
    } else {
      this.setState({data: [{ }]}); 
    }
  },

  convertDate: function(date) {
    var dateString = date.split('/');
    dateString.push(dateString.shift());
    dateString.push(dateString.shift());
    var dateInt = parseInt(dateString.join(''));
    return dateInt
  },

  handleFilterChange: function (data) {
    var newEntries =  this.state.allData;
    if(!!data.date){
      var component = this; 
      var targetDate = this.convertDate(data.date);
      newEntries = newEntries.filter(function (item, index) {
        if (component){
          var startDate = component.convertDate(item.startDate);
          var endDate = component.convertDate(item.endDate)
          if(targetDate >= startDate && targetDate <= endDate)
            return true;
          else return false;
        }
      });
    }

    if(data.location)
      newEntries = newEntries.filter(function (item, index) {
        if(item.address.includes(data.location))
          return true;
        else return false;
      });

    if(data.poolType)
      newEntries = newEntries.filter(function (item, index) {
        if(item.poolType.includes(data.poolType))
          return true;
        else return false;
      });

    this.handleNewEntries(newEntries);
  },

  refreshResults: function (data) {
      this.setState({allData: data},
        function () {
          this.handleNewEntries(data);
        });
  },

  render: function () {
    var listItems = this.state.data.map(function (item, index) {
      return (
        <ListEntry key={index} listing ={item} />
      );
    });

    return (
      <div className="listings">
        {listItems}
      </div>
    );
  }
});

var Filter = React.createClass({

  getInitialState: function() {
    return {
      date: null,
      location : null,
      poolType: []
    };
  },

  componentWillMount: function() {
    RentStore.addPoolTypeAddListener(this.handlePoolTypeAdd);
    RentStore.addPoolTypeRemoveListener(this.handlePoolTypeRemove);
  },

  componentDidMount: function () {
    $( "#datepicker" ).datepicker()
      .on("input change", this.handleDateChange);
  },

  componentWillUnmount: function () {
    RentStore.removePoolTypeAddListener(this.handlePoolTypeAdd); 
    RentStore.removePoolTypeRemoveListener(this.handlePoolTypeRemove);
  },

  handleDateChange: function(e) {
    var date = e.target.value;
    this.setState({
      date: date
    },
      function () {
        RentActions.filterChange(this.state);
        RentActions.removeDetails(); 
      }
    );
  },

  handleLocationChange: function(e) {
    this.setState({
      location: e.target.value
    },
      function () {
        RentActions.filterChange(this.state);
        RentActions.removeDetails(); 
      }
    );
  },

  handlePoolTypeAdd: function (data) {
    this.setState({ 
    poolType: this.state.poolType.concat([data])
    }, function(){
      console.log('filter state: ', this.state.poolType);
      RentActions.filterChange(this.state);
      RentActions.removeDetails(); 
    })
  },

  handlePoolTypeRemove: function (data) {
    var newTypeList = this.state.poolType.filter(function(type){
      return type !== data; 
    });
    this.setState({
      poolType: newTypeList
    }, function(){
      console.log('new state: ', this.state.poolType);
      RentActions.filterChange(this.state);
      RentActions.removeDetails(); 
    });
  },
  
  render: function () {

    return (
      <div className="filter">
      <div id="filter-input">
        <input type="text" id="datepicker" name="date" placeholder="Date" />
        <input type="text" name="location" placeholder="Location" onChange={this.handleLocationChange} />
        <input type="text" name="poolType" placeholder="pool type" value={this.state.poolType} />
      </div>
      <div id="dropdown-filter">
        <DropdownClass  />
      </div>  
      </div>
    );
  }
});


// view for an individual booking, including a map view and image of the pool
// this view shows when a listing is selected from the list

var Booking = React.createClass({

  getInitialState: function() {
    return {
      noDetails: true,
      rental: {},
      reviews: [],
      errors: '',
      avgRating: 0,
      date: ''
    };
  },

  componentDidUpdate: function() {
    $( "#bookDate" ).datepicker()
      .on("input change", this.handleBookDate);
  },
  
  componentDidMount: function () {
    RentStore.addListener(RentConstants.ENTRY_CLICKED, this.handleEntryClicked);
    RentStore.addListener(RentConstants.REVIEW_SUBMITTED, this.refreshReviews);
    RentStore.addListener(RentConstants.NEW_REVIEW, this.handleNewReviews);
    RentStore.addRemoveDetailsListener(this.removeDetails);
  },

  componentWillUnmount: function () {
    RentStore.removeDaListener(RentConstants.ENTRY_CLICKED, this.handleEntryClicked);
    RentStore.removeDaListener(RentConstants.REVIEW_SUBMITTED, this.refreshReviews);
  },

  removeDetails: function () {
    this.setState({
      noDetails: true
    })
  },

  //shows the entry that was clicked
  handleEntryClicked: function (load) {
    // get the listing entry
    this.setState({
      noDetails: false,
      rental: load
    }, function() { 
        //convert date string to mo/day/year
        // var date = '';
        var date = new Date(); 
        date = (date.getMonth() + 1).toString() + '/' + date.getDate().toString() + '/' + date.getFullYear().toString();
        console.log('date string!!!!!! ', date);
        this.state.rental.listing.date = date; 
        //get reviews
        RentActions.fetchReviews(this.state.rental.listing.user_id);
    });
  },

  handleBookDate: function(e) {
    var date = e.target.value;
    this.setState({
      date: date
    },
      function () {
        this.state.rental.listing.date = this.state.date;
        RentActions.setBookDate(this.state.rental.listing);
        console.log('set state for book date, this.state.rental: ', this.state.rental); 
      }
    );
  },

  handleNewReviews: function () {
    RentActions.fetchReviews(this.state.rental.listing.user_id);
  },

  //refresh the reviews view
  refreshReviews: function (data) {
    console.log('reviews received!');
    //calculate average rating
    var sum = 0;
    for(var i = 0; i < data.length; i++) {
      sum += data[i].rating;
    }
    var avg = sum/data.length;
    console.log('average rating', avg);

    this.setState({
      reviews: data,
      avgRating: avg
    }, function() { 
        console.log(this.state.reviews);
        console.log('rating', this.state.avgRating);
    });
  },

  handleBooking: function() {
    RentActions.newBooking(this.state.rental);
  },

  // handle a submitted review
  handleSubmit: function(e) {
    e.preventDefault();
    var $form = $('#review')[0];
    console.log($form.rating.value);
    var formData = {
      rating: Number($form.rating.value),
      comment: $form.comment.value,
      user_id: this.state.rental.listing.user_id
    };

    if($form.rating.value !== '0' && $form.comment.value !== '') {
      this.setState({
        errors: ''
      });
      RentActions.reviewSubmitted(formData);
    } else {
      this.setState({
        errors: 'All Fields Required!'
      });
    }

    $form.rating.value = 0;
    $form.comment.value = '';

  },

  render: function () {
    if (this.state.noDetails) { 
      return (
        <div className="booking">
          <h3>Please select a rental.</h3>
        </div>
        );
    } else {
      // format price display
      var formatedPrice = "";
      var rawPrice = String(this.state.rental.listing.price);
      var j;
      for(var i = 1; i <= rawPrice.length; i++) {
        j=rawPrice.length - i;
        if(!(i % 3) && i < rawPrice.length) 
          formatedPrice = "," + rawPrice[j] + formatedPrice;
        else 
          formatedPrice = rawPrice[j] + formatedPrice;
      }
      formatedPrice = "$" + formatedPrice;

      if (this.state.rental.listing.poolType.length){
        poolFeatures = this.state.rental.listing.poolType.split(',').join(', ');
      } else {
        poolFeatures = 'None specified';
      }

      //render list of reviews
      var reviews = this.state.reviews;
      if(reviews.length) {
        var reviewList = reviews.map(function (item, index) {
          return (
            <div key={index} className="review">
              <form>
                <StarRating name="rating" ratingAmount={5} rating={item.rating} disabled={true} />
              </form>
              <br />
              <p>{item.comment}</p>
            </div>
          );
        });
      } else { reviews = {}; }

      console.log(reviews);

      var avgRating;
      if(this.state.avgRating > 0) {
        avgRating = <form id="avgRating"><StarRating name="rating" ratingAmount={5} rating={this.state.avgRating} disabled={true} /></form>;
      } else { avgRating = {}; }


      var bookingButton;
      if(!!this.state.rental.listing.calendar && !!this.state.rental.listing.calendar[this.state.date]) {
        console.log('this listing has a calendar: ', this.state.rental.listing.calendar);
        console.log('this.state.date from booking button: ', this.state.date);
        bookingButton = <button className="button">BOOKED</button>;
      } else {
        bookingButton = <button className="btn-link" onClick={this.handleBooking}>Book now</button>;
      }


      console.log('pre-render', this.state.avgRating);
      return (
        <div className="booking">
          <h2 className="h4book">{this.state.rental.listing.name}</h2>
          {avgRating}
          <h3>{this.state.rental.listing.address}</h3>
          <img className="poolImg" src={this.state.rental.listing.img}/> 
          <h3>Available from {new Date(this.state.rental.listing.startDate).toDateString().slice(4)}
            to {new Date(this.state.rental.listing.endDate).toDateString().slice(4)} </h3>
          <h4 className="h4book">{formatedPrice}/hour</h4>
          <h4 className="h4book"> Pool Features </h4>
          <p className="h4book"> {poolFeatures} </p>
          <input type="text" id="bookDate" name="date" placeholder="Date" />
          {bookingButton}
          <br />
          <br />
          <h3>Reviews for this Pool Owner:</h3>
            {reviewList}
          <br />
          <h4 className="h4book">Leave a Review:</h4>
            <form id="review">
              <StarRating name="rating" ratingAmount={5} />
              <br />
              <br />
              <textarea rows="4" cols="45" type="text" name="comment" placeholder="Comments">
              </textarea>
              <br />
              <br />
              <input type="submit" value="Submit Review" className="button" onClick={this.handleSubmit}/>
              <span className="error">{this.state.errors}</span>
            </form>
        </div>
      );
    }
  }
});


var RentContent = React.createClass({

  mixins: [ReactRouter.Navigation],

  getInitialState: function () {
    return {
      data: [],
      date: ''
    };
  },

  componentWillMount: function () {
    RentStore.addListener(RentConstants.NEW_BOOKING, this.handleBooking);
  },

  componentWillUnmount: function () {
    RentStore.removeDaListener(RentConstants.NEW_BOOKING, this.handleBooking);
  },

  handleBooking: function (data) {
    this.transitionTo("Confirmation");
  },
  
  render: function () {
    
    return (
      <div className="rentPool">
        <LoginTransitioner />
        <h1>Rent a Pool</h1>
        <Filter cb={this}/>
        <div className="showRents">
          <div className="showList">
            <Listings />
            <Booking />
          </div>
          <div className="showDetails">
            <div className="mapWeatherContainer">
              <GoogleMap />
              <Weather />
            </div>
          </div>
        </div>
      </div>
    );
  }
});


var GoogleMap = React.createClass({

  map: null,
  geocoder: new google.maps.Geocoder(),
  oldMarker: null,
  address: [],

  componentDidMount: function () {
    this.initializeMap();
    RentStore.addListener(RentConstants.ENTRY_CLICKED, this.handleEntryClicked);
    RentStore.addListener(RentConstants.BOOK_DATE, this.updateDate);
  },

  componentWillUnmount: function () {
    RentStore.removeDaListener(RentConstants.ENTRY_CLICKED, this.handleEntryClicked);
  },

  handleEntryClicked: function (load) {
    console.log('googleMap load: ', load)
    this.codeAddress(load.listing);
  },

  updateDate: function(load) {
    console.log('updateDate load: ', load);
    this.codeAddress(load);
  },

  codeAddress: function (data) {
    
    if (this.oldMarker) this.oldMarker.setMap(null);
    this.geocoder.geocode( { 'address': data.address}, function(results, status) {
      console.log('wtf', results)
      // Extract the city and state from Google location object (to use with weather API)
      // address[1] is the city name
      // address[2] is the 2-digit state abbreviation
      this.address = /([a-zA-Z\s]+),\s([A-Z]{2})\s{0,1}/g.exec(results[0].formatted_address);
      this.address = [this.address[1].trim(),this.address[2]];
      // get day month year of listing
      console.log('googleMap data: ', data);
      this.address.date = /(\d+)\/(\d+)\/(\d+)/g.exec(data.date);
      console.log('this is this.address sent to sendCityState: ', this.address);
      // dispatch event for sending city/state data to weather component
      RentActions.sendCityState(this.address);

      if (status == google.maps.GeocoderStatus.OK) {
        this.map.setCenter(results[0].geometry.location);

        var marker = new google.maps.Marker({
            map: this.map,
            position: results[0].geometry.location
        });
        this.oldMarker = marker;
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    }.bind(this));
  },

  initializeMap: function () {
    var latlng = new google.maps.LatLng(37.783551, -122.408990);
    var mapOptions = {
     zoom: 14,
     center: latlng
    }
    this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  },

  render: function () {
    return (
      <div id="map-canvas"></div>
    );
  }

});

// Create Weather component
var Weather = React.createClass({
  getInitialState: function() {
    return {
      show: false,
      location: '',
      date: '',
      dayName: '',
      highTemp: null,
      conditions: '',
      icon: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // 1x1 transparent gif
      uv: null
    }
  },

  componentDidMount: function() {
    RentStore.addListener(RentConstants.CITYSTATE, this.updateWeather);
  },


  updateWeather: function(data) {
    console.log('is the date here?? ',data)
    _getWeather(data[0], data[1], data.date[1], data.date[2], data.date[3], this.setState.bind(this));
  },

  render: function() {
    if(this.state.show === true) {
      return (<div className="weather">
                <div className="weatherTitle">
                  Weather forecast for {this.state.location}
                </div>
                <div className="weatherInfo">
                  <div className="date">
                   {this.state.date}<br/><span className="dayName">{this.state.dayName}</span>
                  </div>
                  <div className="temp">
                    {this.state.highTemp}
                  </div>
                  <div className="weatherDescription"> 
                    <img src={this.state.icon} /><br/>{this.state.conditions}
                  </div>
                </div>
              </div> );
    } else {
      return (<div></div>);
    }
  }
});

