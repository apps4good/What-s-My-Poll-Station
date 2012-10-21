/*globals $, navigator, google*/

(function(w) {

    w.PollStation = {

        gmap: null,
        defaults: {
            $map: null,
            $edit_location: null,
            $address: null,
            $poll_map_container: null,
            $loader: null,
            $nearest_station_ward: null,
            $nearest_station_address: null,
            $nearest_station: null,
            $address_input: null,
            $address_submit: null
        },

        init: function(opts) {
            var self = this;

            self.opts = $.extend(true, {}, self.defaults, opts);

            if (navigator && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    // Wrap our call to fix context of `this`.
                    self.didGetCurrentPosition(position);
                }, function(error){
                    self.geoError(error);
                });
            } else {
                self.geocodeNotSupported(function(position){
                    self.getClosestPoll(position.latitude, position.longitude);
                });
                //alert('Your browser does not support geolocation');
            }

            self.assignEvents();
        },

        assignEvents: function() {

            var self = this;

            self.opts.$edit_location.bind('click', function(e){
                e.preventDefault();
                var animate_prop_val = self.opts.$poll_map_container.css('marginTop') == '0px' ? '130px' : '0px';
                self.opts.$poll_map_container.animate({
                    marginTop: animate_prop_val
                });
            });

            $(window).bind('resize orientationchange', function(){
                if(self.opts.$loader.is(':hidden')){
                    $(this).unbind('resize orientationchange');
                }
                self.opts.$loader.css({
                    top: ($(window).height() / 2) - (self.opts.$loader.outerHeight() / 2),
                    left: ($(window).width() / 2) - (self.opts.$loader.outerWidth() / 2)
                });
            }).trigger('resize');

            self.opts.$address_submit.bind('click', function(){
                var address = self.opts.$address_input.val();
                self.didGetLatLngFromAddress(address, function(lat, lng){
                    var position = {
                        coords: {
                            latitude: lat,
                            longitude: lng
                        }
                    };
                    self.didGetCurrentPosition(position);
                });
            });

        },

        didGetLatLngFromAddress: function(address, callback){

            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: address }, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK && results && results.length) {
                    callback(results[0].geometry.location.Xa, results[0].geometry.location.Ya);
                } else {
                    self.error("Geocode was not successful for the following reason: " + status);
                }
            });

        },

        error: function(msg){
            // error
        },

        postMapRender: function(){

            var self = this;

            self.opts.$address.show();

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


        /**
            Gets the poll data lookup table.   This table is used to find the
            name of the poll data for our current location.
        */
        getPollLookupTable: function (cb) {
            $.getJSON('data/poll_table.json', function (data) {
                cb(data);
            });
        },

        /**
            Callback for navigator.geolocation success.
        */
        didGetCurrentPosition: function (position) {
            var self = this;

            this.getPollLookupTable(function(lookupTable) {
                // Wrap our call to fix context of `this`.
                self.didGetPollLookupTable(position, lookupTable);
            });
        },

        /**
            Callback for poll lookup success.
        */
        didGetPollLookupTable: function (position, lookupTable) {
            var self = this;

            this.getPollData(position, lookupTable, function(pollData) {
                // Wrap our call to fix context of `this`.
                self.didGetPollData(position, pollData);
            });
        },

        /**
            Uses the poll data lookup table to find the poll data for our
            position.
        */
        getPollData: function (position, lookupTable, cb) {
            var fileName;

            fileName = this.filenameForPosition(position, lookupTable);
            if (fileName) {
                $.ajax({
                    url: 'data/' + fileName,
                    dataType: 'json',
                    success: cb,
                    error: function(){
                        console.error(arguments);
                    }
                });
            } else {
                self.error('No matching poll data file found');
            }
        },

        /**
            Callback for poll data success.
        */
        didGetPollData: function (position, pollData) {
            var lat = position.coords.latitude,
                lng = position.coords.longitude;
            var start = new google.maps.LatLng(lat, lng);
            var mapOptions = {
                zoom: 7,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                center: start
            };
            var self = this;

            this.gmap = new google.maps.Map(this.opts.$map[0], mapOptions);

            // Get the nearest poll.
            var nearestPoll = this.nearestPollForPosition(position, pollData);
            var directionsDisplay = new google.maps.DirectionsRenderer();
            directionsDisplay.setMap(this.gmap);

            var end = new google.maps.LatLng(nearestPoll.geometry.coordinates[0], nearestPoll.geometry.coordinates[1]);
            var request = {
                origin: start,
                destination: end,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };

            var directionsService = new google.maps.DirectionsService();
            directionsService.route(request, function(response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                    self.postMapRender();
                    self.opts.$loader.hide();
                    self.opts.$nearest_station_ward.text(nearestPoll.ward);
                    self.opts.$nearest_station_address.text(nearestPoll.properties.name);
                    self.opts.$nearest_station.show();
                }
            });
        },

        /**
            Iterates the poll data and returns the poll info for the nearest.
        */
        nearestPollForPosition: function(position, pollData) {
            var distance = Infinity,
                ret = null,
                sourceLat = position.coords.latitude,
                sourceLong = position.coords.longitude;

            for (var i = pollData.length - 1; i >= 0; i--) {
                var poll = pollData[i];
                var newDistance = this.distance(sourceLat, sourceLong, poll.geometry.coordinates[0], poll.geometry.coordinates[1]);

                // Each time we find a closer poll, store it.
                if (newDistance < distance) {
                    distance = newDistance;
                    ret = poll;
                }
            }

            return ret;
        },

        /**
            Parses the lookup table to find a filename of poll data for our
            current position.
        */
        filenameForPosition: function (position, lookupTable) {
            var dist, i,
                ret = null,
                point = { x: position.coords.longitude, y: position.coords.latitude };

            for (i = lookupTable.length - 1; i >= 0; i--) {
                var pollDataFileInfo = lookupTable[i],
                    rect = {};

                rect.x = pollDataFileInfo.topLeft.lng;
                rect.y = pollDataFileInfo.botRight.lat;
                rect.width = pollDataFileInfo.botRight.lng - rect.x;
                rect.height = pollDataFileInfo.topLeft.lat - rect.y;

                if (this.pointInRect(point, rect)) {
                    ret = pollDataFileInfo.filename;
                }
            }

            return ret;
        },

        /**
            Returns if a point is in a rect.
        */
        pointInRect: function(point, rect) {
            return (point.x >= this.minX(rect)) &&
                (point.y >= this.minY(rect)) &&
                (point.x <= this.maxX(rect)) &&
                (point.y <= this.maxY(rect));
        },

        /** Return the left edge of the rect */
        minX: function(rect) {
            return rect.x || 0;
        },

        /** Return the right edge of the rect. */
        maxX: function(rect) {
            return (rect.x || 0) + (rect.width || 0);
        },

        /** Return the top edge of the rect */
        minY: function(rect) {
            return rect.y || 0;
        },

        /** Return the bottom edge of the rect */
        maxY: function(rect) {
            return (rect.y || 0) + (rect.height || 0);
        },

        /**
          Calculate the approximate distance between two geographic locations
          using the dist cosine law.

          @returns {Number}
        */
        distance: function(sourceLat, sourceLong, destLat, destLong) {
          var radius = 6378137; // earth's mean radius in m
          var result = Math.acos(Math.sin(this.toRad(sourceLat)) * Math.sin(this.toRad(destLat)) + Math.cos(this.toRad(sourceLat)) * Math.cos(this.toRad(destLat)) * Math.cos(this.toRad(destLong - sourceLong))) * radius;

          return result;
        },

        /** Converts numeric degrees to radians */
        toRad: function(number) {
            return number * Math.PI / 180;
        },

        geoError: function(err){
            if(err.code === 1) {
                // alert('The user denied the request for location information.')
                this.geocodeNotSupported(function(position){
                    this.getClosestPoll(position.latitude, position.longitude);
                });
            } else if(err.code === 2) {
                this.error('Your location information is unavailable.');
            } else if(err.code === 3) {
                this.error('The request to get your location timed out.');
            } else {
                this.error('An unknown error occurred while requesting your location.');
            }
        }

    };

})(window);
