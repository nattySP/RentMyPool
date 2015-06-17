var RentDispatcher = new Flux.Dispatcher();

var RentActions = {

  entryClicked: function (data) {
    RentDispatcher.dispatch({
      type: RentConstants.ENTRY_CLICKED,
      load: data
    });
  },

  fetchEntries: function (data) {
    RentDispatcher.dispatch({
      type: RentConstants.FETCH_ENTRIES,
      load: data
    });
  },

  fetchReviews: function(data) {
    RentDispatcher.dispatch({
      type: RentConstants.FETCH_REVIEWS,
      load: data
    });
  },

  newBooking: function (data) {
    console.log('newBooking data: ', data);
    RentDispatcher.dispatch({
      type: RentConstants.NEW_BOOKING,
      load: data
    });
  },

  cancelBooking: function(data) {
    RentDispatcher.dispatch({
      type: RentConstants.CANCEL_BOOKING,
      load: data
    });
  },

  filterChange: function (data) {
    RentDispatcher.dispatch({
      type: RentConstants.FILTER_CHANGE,
      load: data
    });
  },

  removeDetails: function() {
    RentDispatcher.dispatch({
      type: RentConstants.REMOVE_DETAILS,
      load: null
    })
  },


  reviewSubmitted: function (data) { 
    RentDispatcher.dispatch({
      type: RentConstants.REVIEW_SUBMITTED,
      load: data
    });
  },

  sendCityState: function (data) {
    RentDispatcher.dispatch({
      type: RentConstants.CITYSTATE,
      load: data
    });
  },

  setBookDate: function (data) {
    RentDispatcher.dispatch({
      type: RentConstants.BOOK_DATE,
      load: data
    })
  }

}
