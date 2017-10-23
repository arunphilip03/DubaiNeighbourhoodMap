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

        if ($(window).width() < 800 || $(window).height() < 595) {
         $( '#nav-bar' ).hide();
       }


        // Toggle hide and display of menu/navigation bar
        $( '#menu-btn' ).click(function() {
          $( '#nav-bar' ).toggle('slow', function() {
          });
        });

        // List of favourite locations
        var locations = [
        {title: 'The Dubai Mall', location: {lat:25.198518, lng:55.279619}},
        {title: 'Mall of the Emirates', location: {lat:25.118107, lng:55.200608}},
        {title: 'Dubai Miracle Garden', location: {lat:25.060037, lng:55.244447}},
        {title: 'Burj Khalifa', location: {lat:25.197197, lng:55.27437639999999}},
        {title: 'Burj Al Arab', location: {lat:25.141291, lng:55.185337}},
        {title: 'Palm Jumeirah', location: {lat:25.1124317, lng:55.13897799999999}},        
        {title: 'Dubai Garden Glow', location: {lat:25.2278253, lng:55.2963915}},
        {title: 'Dubai Festival City', location: {lat:25.2171003, lng:55.3613635}}
        ];

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

        ko.applyBindings(new AppViewModel(markers));

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
  var infoWindowTemplate = $('#infoWindow-template').html();
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

  var infoWindowContent = Mustache.render(infoWindowTemplate, data);

  infoWindow.setContent(infoWindowContent);
  infoWindow.open(map, marker);

}).fail(function(){
  console.log('Foursquare API request failed');
  $('#message').fadeIn('slow', function(){
    $('#message').html('Foursquare API request failed');
    $('#message').delay(5000).fadeOut(); 
  });
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
  if(infoWindow.marker !== null && $.inArray(infoWindow.marker, filteredMarkers) == -1)
  {
    $('#street-view').html('');
  }

  map.fitBounds(bounds);

}


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


var AppViewModel = function(markers) {

 var self = this;

 self.markers = markers;

 self.query = ko.observable('');

 self.filteredPlaces = ko.computed(function () {
  if (this.query()) {
    var search = self.query().toLowerCase();
    var filteredMarkers = ko.utils.arrayFilter(self.markers, function (marker) {
      return marker.title.toLowerCase().indexOf(search) >= 0;
    });
    showFilteredPlaces(filteredMarkers);
    return filteredMarkers;
  } 
  else {
    showAllPlaces();
    return markers;
  }}, this);


  self.listClick = function(marker) {

  populateInfoWindow(marker, infoWindow);

};

};

