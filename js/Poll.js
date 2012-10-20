(function(w){

    w.PollStation = {

        gmap: null,
        defaults: {
            $map: null
        },

        init: function(opts){

            var self = this;

            self.opts = $.extend(true, {}, self.defaults, opts);

            if (navigator && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position){
                    self.getClosestPoll(position.coords.latitude, position.coords.longitude);
                }, self.geoError);
            } else {
		        self.geocodeNotSupported(function(position){
                    self.getClosestPoll(position.latitude, position.longitude);
                });
            }

        },

    	geocodeNotSupported: function(callback) {
    		
    		var position = {};
    		// default lat lon for Regina, SK.
            // for testing only!!
            
            position.latitude = 50.4579;
    		position.longitude = -104.606;
            
            /*var url = "http://www.geoplugin.net/json.gp?jsoncallback=?"; 
            // Utilize the JSONP API 
            $.getJSON(url, function(data) { 
                if(data['geoplugin_status'] == 200) {
                    position.latitude = data['geoplugin_latitude'];
                    position.logitude = data['geoplugin_longitude'];
                }
            });*/
    		callback(position);
    	},

/*
        geocodeByIP: function(cb) {
            var url = "http://www.geoplugin.net/json.gp?jsoncallback=?"; 
            // Utilize the JSONP API 
            $.getJSON(url, function(data) { 
                if(data['geoplugin_status'] == 200) {
                    position.latitude = data['geoplugin_latitude'];
                    position.logitude = data['geoplugin_longitude'];
                }
            });
        },
*/

        geoError: function(err){

            if(err.code == 1) {
                // alert('The user denied the request for location information.')
                self.geocodeNotSupported(function(position){
                    self.getClosestPoll(position.latitude, position.longitude);
                });
            } else if(err.code == 2) {
                alert('Your location information is unavailable.')
            } else if(err.code == 3) {
                alert('The request to get your location timed out.')
            } else {
                alert('An unknown error occurred while requesting your location.')
            }

        },

        getClosestPoll: function(lat, lng){

            var self = this;

            var directionsDisplay = new google.maps.DirectionsRenderer();
            var start = new google.maps.LatLng(lat, lng);
            var mapOptions = {
                zoom: 7,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                center: start
            };

            self.gmap = new google.maps.Map(self.opts.$map[0], mapOptions);
            directionsDisplay.setMap(self.gmap);

            var directionsService = new google.maps.DirectionsService();
            var end = 'Regina, SK';
            var request = {
                origin: start,
                destination: end,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };

            directionsService.route(request, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                }
            });

        }

    }

})(window, undefined);
