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
                alert('Your browser does not support geolocation');
            }

        },

        geoError: function(error){

            if(err.code == 1) {
                alert('The user denied the request for location information.')
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