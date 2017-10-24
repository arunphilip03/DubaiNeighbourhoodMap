var map;

// Marker array for all the neighbourhood markers
var markers = [];

var infoWindow = null;

// Initialize google map and load markers of all neighbourhood locations
function initMap() {

  var mapSettings = {
    center: {lat: 25.204849, lng: 55.270783},
    zoom: 13
  };

  // Constructor creates a new map
  map = new google.maps.Map(document.getElementById('map'), mapSettings);

  // Detect window size and render map and navigation bar accordingly
  if($(window).width() <= 1080) {
    mapSettings.zoom = 12;
  }

  var defaultIcon = makeMarkerIcon('fe7569');

  infoWindow = new google.maps.InfoWindow();

  var highlightedIcon = makeMarkerIcon('fd2f1d');

  locations.forEach(function(location, i){

   var marker = new google.maps.Marker({
    position: location.location,
    title: location.title,
    icon: defaultIcon,
    animation: google.maps.Animation.DROP,
    id: i
  });

  // Push the marker to markers array
  markers.push(marker);


  marker.addListener('click', function() {
    populateInfoWindow(this, infoWindow);
  });

  marker.addListener('mouseover', function(){
    this.setIcon(highlightedIcon);

  });

  marker.addListener('mouseout', function(){
    this.setIcon(defaultIcon);
  });

});

  // Show all locations on map on load
  showAllPlaces();

  var appViewModel = new AppViewModel(markers);

  ko.applyBindings(appViewModel);

}

// Function to generate four square API end point when user clicks on a marker.
function buildFourSquareUrl(location, title) {

  var fourSquareUrl = 'https://api.foursquare.com/v2/venues/search';

  var latLng = location.lat()+','+location.lng();

  var params = $.param({
    'client_id': 'DVJMGPUEZD521FBR3PBVC30ZSMXOQ2E5MQT1EYZPLQWNF2EQ',
    'client_secret': '2HPCNV0AKBYWPWLO4J2TNG50YJV1TRHSW4KSBWJXU1GAJAOV',
    'v': '20170801',
    'll': latLng,
    'limit': '1',
    'query': title
  });

  var requestUrl = fourSquareUrl + '?' + params;

  return requestUrl;  

}

// Function to populate data of infoWindow
function populateInfoWindow(marker, infoWindow) {

  // Check if the infowindow is not already opened on this marker.
  if(infoWindow.marker != marker) {
    infoWindow.marker = marker;
    infoWindow.setContent('');

  // Animate marker -DROP, on click
  marker.setAnimation(google.maps.Animation.DROP);

  // Marker property is cleared when marker window is closed
  infoWindow.addListener('closeclick', function() {
    infoWindow.marker = null;
    $('#street-view').html('');
  });

  // Get Foursquare API endpoint
  var fourSquareEndPoint = buildFourSquareUrl(marker.getPosition(), marker.getTitle());

  var streetViewService = new google.maps.StreetViewService();
  var radius = 50;
  // In case the status is OK, which means the pano was found, compute the
  // position of the streetview image, then calculate the heading, then get a
  // panorama from that and set the options
  var getStreetView = function(data, status) {
    if (status == google.maps.StreetViewStatus.OK) {
     var nearStreetViewLocation = data.location.latLng;
     var heading = google.maps.geometry.spherical.computeHeading(
       nearStreetViewLocation, marker.position);

     var panoramaOptions = {
      position: nearStreetViewLocation,
      pov: {
        heading: heading,
        pitch: 30
      }
    };

    var panorama = new google.maps.StreetViewPanorama(
     document.getElementById('street-view'), panoramaOptions);
  } 
  else {
    $('#street-view').html('<h5>No Street View Image found</h5>');
  }
};
// Use streetview service to get the closest streetview image within
// 50 meters of the markers position
streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

// Foursquare API - Fetch info on selected location
$.ajax({
  url: fourSquareEndPoint,
  dataType: 'json'
}).done(function(result){

  venueInfo = result.response.venues[0];
  var data = {
    title: venueInfo.name,
    phone: venueInfo.contact.formattedPhone,
    url: venueInfo.url,
    fb_id : venueInfo.contact.facebook,
    twitter_id: venueInfo.contact.twitter,
    instagram_id : venueInfo.contact.instagram,
    address: venueInfo.location.address,
    state: venueInfo.location.state,
    country: venueInfo.location.country,
    postalCode: venueInfo.location.postalCode,
    category: venueInfo.categories[0].name,
    icon: venueInfo.categories[0].icon.prefix + '32' + venueInfo.categories[0].icon.suffix
  };


  var infoWindowContent = '<div class="infoWindow"><h3 class="infoWindow-header">'+
  data.title +
  '</h3><div class="infoWindow-category"><img class="infoWindow-icon" src="'+
  data.icon +
  '"><span class="infoWindow-categoryName">'+
  data.category +
  '</span></div><div class="contact-info"><div id="phone">'+
  data.phone +
  '</div><div id="url"><a href="'+
  data.url +
  '" target="_blank">'+
  data.url +
  '</a></div><div id="address"><div>'+
  data.address +
  '</div><div>'+ data.state +'</div><div>'+ data.country +'</div><div>'+
  data.postalCode +'</div></div>';

  var socialIcons = '<div id="social-icons">';

  if(data.fb_id)
  {
    socialIcons = socialIcons + '<span id="fb"><a href="https://www.facebook.com/'+
    data.fb_id +'" target="_blank"><img class="icon-round" src="images/fb.png"></a></span>';
  }
  if(data.twitter_id)
  {
    socialIcons = socialIcons + '<span id="fb"><a href="https://twitter.com/'+
    data.twitter_id +'" target="_blank"><img class="icon-round" src="images/twitter.png"></a></span>';
  }

  if(data.instagram_id)
  {
    socialIcons = socialIcons + '<span id="fb"><a href="https://instagram.com/'+
    data.instagram_id +'" target="_blank"><img class="icon-round" src="images/instagram.png"></a></span>';
  }

  infoWindowContent = infoWindowContent +socialIcons + '</div></div></div>';

  infoWindow.setContent(infoWindowContent);
  infoWindow.open(map, marker);

}).fail(function(){
  console.log('Foursquare API request failed');
  displayMessage('Foursquare API request failed');
  
});

}

}

// Function to render all the markers
function showAllPlaces() {
 var bounds = new google.maps.LatLngBounds();

 markers.forEach(function(marker){

  marker.setMap(map);
  bounds.extend(marker.position);
});

 map.fitBounds(bounds);

}

// Display error message
function displayMessage(message) {
 $('#message').fadeIn('slow', function(){
  $('#message').html(message);
  $('#message').delay(5000).fadeOut(); 
});
}

// Function to hide all markers on map
function hideAllPlaces() {
 markers.forEach(function(marker){
  marker.setMap(null);
});

}

// Function to show only the filtered markers as per the search query
function showFilteredPlaces(filteredMarkers) {

  hideAllPlaces();

  var bounds = new google.maps.LatLngBounds();

  filteredMarkers.forEach(function(marker) {
    marker.setMap(map);
    bounds.extend(marker.position);
  });

  // Clear street view if filtered markers does not contain selected/open marker
  if(infoWindow.marker !== null &&  filteredMarkers.indexOf(infoWindow.marker)  /*$.inArray(infoWindow.marker, filteredMarkers)*/ == -1)
  {
    $('#street-view').html('');
    infoWindow.marker = null;
  }

  map.fitBounds(bounds);

}

// Customize marker icon
function makeMarkerIcon(markerColor) {
 var markerImage = new google.maps.MarkerImage(
  'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
  '|40|_|%E2%80%A2',
  new google.maps.Size(21, 34),
  new google.maps.Point(0, 0),
  new google.maps.Point(10, 34),
  new google.maps.Size(21,34));
 return markerImage;
}


// Google maps error handling
function googleError() {
  displayMessage('Error loading Google maps');
}

// ViewModel
var AppViewModel = function(markers) {

  var self = this;

  self.markers = markers;
  self.query = ko.observable('');

  var $window = $(window);

  self.windowWidth = ko.observable($window.width());
  self.windowHeight = ko.observable($window.height());

  self.hideNav = ko.observable(false);


  $window.resize(function () { 
    self.windowWidth($window.width());
    self.windowHeight($window.height());
  });


  self.filteredPlaces = ko.computed(function () {
    var search = self.query().toLowerCase();
    var filteredMarkers = ko.utils.arrayFilter(self.markers, function (marker) {
      return marker.title.toLowerCase().indexOf(search) >= 0;
    });
    showFilteredPlaces(filteredMarkers);
    return filteredMarkers;
  }, this);


  self.listClick = function(marker) {
    populateInfoWindow(marker, infoWindow);
  };

  self.toggleNavBar = function() {

    if(self.hideNav() === true){
      self.hideNav(false);
    } else {
      self.hideNav(true);
    }

  };

  self.detectWindowSize = ko.computed(function() {

    if (self.windowWidth() < 800 || self.windowHeight() < 595) {

      self.hideNav(true);
    }
    else {
      self.hideNav(false);
    }

  }, this);

};

