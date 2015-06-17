// ReactRouter.Link
// <Link key={index} activeClassName="nav-link-focused" 
//   className="nav-link" to={m.name}>{m.name}</Link>
// React will complain if there isn't a unique key for each Link
// tag, so we mitigate this by assigning it a unique number.
// Link's activeClassName assigns the className to the Link when it
// is clicked. Link's "to" is like the anchor tag's href except you 
// put the component name as the value. The component will be found 
// if one of the routes has the same name as the string that "to" is 
// assigned as.

var Route = ReactRouter.Route;
var DefaultRoute = ReactRouter.DefaultRoute;
var RouteHandler = ReactRouter.RouteHandler;
var Link = ReactRouter.Link;

var UserButton = React.createClass({

  render: function () {
    if(this.props.user)
      return (
        <span> 
        {"Logged in as " + this.props.user.username}
        </span>
      );
    else 
      return(
        <span>
          {"Not Logged In."}
        </span>
      );
  }

});

var UserListing = React.createClass({

  render: function  () {
    
    return (
      <div>
        <span>
          {"Date: " + this.props.listing.date}
        </span>
        <br />
        <span>
          {"Name: " + this.props.listing.name}
        </span>
        <br />
        <span>
          {"Address: " + this.props.listing.address}
        </span>
        <br />
        <span>
          {"Price: " + this.props.listing.price}
        </span>
        <br />
        <br />
      </div>
    );
  }

});

var UserBooking = React.createClass({

  //cancel a booking
  handleCancel: function() {
    console.log(this.props);
    RentActions.cancelBooking(this.props.booking);
  },

  render: function  () {
    
    return (
      <div>
        <span>
          {"Date: " + this.props.booking.date}
        </span>
        <br />
        <span>
          {"Name: " + this.props.booking.name}
        </span>
        <br />
        <span>
          {"Address: " + this.props.booking.address}
        </span>
        <br />
        <span>
          {"Price: " + this.props.booking.price}
        </span>
        <br />
        <span>
          <button onClick={this.handleCancel} className="button">Cancel Booking</button>
        </span>
        <br />
        <br />
      </div>
    );
  }

});

var UserDetails = React.createClass({

  render: function () {
    var userListings = this.props.listings.map(function (item, index){
      return (
        <UserListing key={index} listing={item} />
      );
    });
    var userBookings = this.props.bookings.map(function (item, index){
      return (
        <UserBooking key={index} booking={item} />
      );
    });

    return (
      <div className="userDetailsContainer">
        <div className={this.props.show ? "userDetails show" : "userDetails"}>
          <h1>{this.props.user.username}</h1>
          <hr />
          <h2>{this.props.listings.length} Listings</h2>
          <br />
          {userListings}
          <br />
          <h2>{this.props.bookings.length} Bookings</h2>
          <br />
          {userBookings}
        </div>
      </div>
    );
  }

});

var CurrentUser = React.createClass({

  getInitialState: function () {
    return {
      showDetails: false,
      user: null
    }
  },

  componentWillMount: function () {
    AppStore.addUserLoginListener(this.handleNewUser);
    AppStore.addFetchUserListener(this.handleNewUser);
    AppActions.fetchUser();
  },

  componentWillUnmount: function () {
    AppStore.removeUserLoginListener(this.handleNewUser);
    AppStore.removeFetchUserListener(this.handleNewUser);
  },

  handleNewUser: function (data) {
    this.setState({
      user: data
    });
  },

  handleClick: function () {
    var userListings;
    var userBookings;
    var self = this;

    $.ajax({
      url: "/rentItems",
      contentType: "application/json",
      method: "GET",
      statusCode: {
        200: function (data) {
          userListings = _.filter(data.results, function (item, index) {
            if(item.user_id === self.state.user._id) return true
            else return false;
          });

          if(self.state.user)
            self.setState({
              showDetails: !self.state.showDetails,
              userListings: userListings
            });
        }
      }
    });
    
    $.ajax({
      url: "/userBookings",
      contentType: "application/json",
      method: "GET",
      statusCode: {
        200: function (data) {
          if(self.state.user)
            self.setState({
              userBookings: data.results
            });
        }
      }
    });
  },

  render: function () {
      return (
        <div  onClick={this.handleClick} className="currentUser">
          <UserButton user={this.state.user} />
          <UserDetails show={this.state.showDetails} user={this.state.user || {}} listings={this.state.userListings || []} bookings={this.state.userBookings || []} />
        </div>
      );
  }

});

var Navigation = React.createClass({

  render: function () {
    return (
      <div className="nav-menu">
        { this.props.items.map(function(m, index){
            return <Link key={index} activeClassName="nav-link-focused" className="nav-link" to={m.name}>{m.name}</Link>;
          }) }
        <CurrentUser />
      </div>
    );
  }
});

var Main = React.createClass({

  render: function () {
    return (
      <div className="viewPort">

        <Navigation items={ [
          {name:'Home'},
          {name:'Rent'},
          {name:'List'},
          {name: 'Login'}
        ] } />
        <div className="main">
          <RouteHandler />
        </div>
      </div>
    );
  }
});

var routing = function () {
  var routes = (
        <Route path="/" handler={Main}>
          <Route name="Home" handler={Content} />
          <Route name="Rent" handler={RentContent} />
          <Route name="List" handler={ListContent} />
          <Route name="Login" handler={LoginContent} />
          <Route name="Sign Up" handler={SignUpContent} />
          <Route name="Confirmation" handler={ConfirmationContent} />
          <DefaultRoute handler={Content} />
        </Route>
      );

  ReactRouter.run(routes, ReactRouter.HistoryLocation, function (Handler) {
    React.render(<Handler />, $('body')[0]);
  });
};



