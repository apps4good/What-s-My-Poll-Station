/*globals $, navigator, google*/
(function(w) {

    w.PollStation = {

        lookupTable: null,
        gmap: null,
        lat: null,
        lng: null,
        wards: [],

        defaults: {
            $toolbar: null,
            $map: null,
            $edit_location: null,
            $address: null,
            $poll_map_container: null,
            $loader: null,
            $nearest_station_name: null,
            $nearest_station_ward: null,
            $nearest_station_street: null,
            $nearest_station: null,
            $address_input: null,
            $address_submit: null,
            $address_form: null,
            $address_loader: null,
            $address_error: null,
            $supported_cities: null
        },

        init: function(opts) {
            var mapOptions,
                self = this;

            self.opts = $.extend(true, {}, self.defaults, opts);

            // Initialize the map.
            mapOptions = {
                zoom: 7,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            self.gmap = new google.maps.Map(self.opts.$map[0], mapOptions);

            // Pull in the poll data files lookup table.
            this.getPollLookupTable(function(lookupTable) {
                self.didGetPollLookupTable(lookupTable);
            });


            self.assignEvents();
        },

        assignEvents: function() {

            var self = this;

            self.opts.$edit_location.bind('click', function(e){
                e.preventDefault();
                var animate_method = self.opts.$poll_map_container.css('marginTop') === '0px' ? 'slideAddressPanelDown' : 'slideAddressPanelUp';
                self[animate_method]();
                });

            $(window).bind('resize orientationchange', function(){

                // Only do calculations if our loader is still on the screen
                if(self.opts.$loader.is(':visible')){
                    self.opts.$loader.css({
                        top: ($(window).height() / 2) - (self.opts.$loader.outerHeight() / 2),
                        left: ($(window).width() / 2) - (self.opts.$loader.outerWidth() / 2)
                    });
                }

                var toolbar_height = self.opts.$toolbar.outerHeight();
                var nearest_station_height = self.opts.$nearest_station.outerHeight();
                var height = $(window).outerHeight() - (toolbar_height + nearest_station_height);
                self.opts.$map.height(height);

            }).trigger('resize');

            self.opts.$address_form.bind('submit', function(e){
                e.preventDefault();
                var address = $.trim(self.opts.$address_input.val());
                if(!address){
                    return;
                }
                self.opts.$address_loader.css('visibility', 'visible');
                self.resetCityNotSupported();
                self.didGetLatLngFromAddress(address, function(lat, lng){
                    var position = {
                        coords: {
                            latitude: lat,
                            longitude: lng
                        }
                    };
                    self.opts.$address_loader.css('visibility', 'hidden');
                    self.didGetCurrentPosition(position);
                });
            });

        },

        slideAddressPanelUp: function(){
            this.opts.$poll_map_container.animate({
                marginTop: 0
            });
        },

        slideAddressPanelDown: function(showing_with_error){
            this.opts.$poll_map_container.animate({
                marginTop: this.opts.$address.outerHeight(true)
            });
        },

        resetAddressPanel: function(){
            this.slideAddressPanelUp();
            this.hideAddressError();
        },

        didGetLatLngFromAddress: function(address, callback) {

            var self = this;

            var geocoder = new google.maps.Geocoder();
            var latlng = new google.maps.LatLng(this.lat, this.lng);

            if(~address.indexOf(',')){
                self.didGetByFullAddress(address, callback);
            } else {
                geocoder.geocode({'latLng': latlng }, function(results, status) {
                    if(status == google.maps.GeocoderStatus.OK && results && results.length){
                        for(var i = 0, rlen = results[0].address_components.length; i < rlen; i++){
                            var res = results[0].address_components[i];
                            if(~$.inArray('locality', res.types)){
                                address += ', ' + res.short_name;
                            }
                        }
                        self.didGetByFullAddress(address, callback);
                    } else {
                        self.error("Geocode was not successful for the following reason: " + status);
                    }
                });
            }

        },

        didGetByFullAddress: function(address, callback){

            var self = this;
            var geocoder = new google.maps.Geocoder();

            geocoder.geocode({ address: address }, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK && results && results.length) {
                    callback(results[0].geometry.location.Xa, results[0].geometry.location.Ya);
                } else {
                    self.error("Geocode was not successful for the following reason: " + status);
                }
            });

        },

        error: function(msg){

            this.opts.$address_loader.hide();
            console.error(msg);

        },

        postMapRender: function(){

            var self = this;

            self.opts.$address.show();
            $(window).trigger('resize');

        },

        geocodeNotSupported: function(callback) {

            var position = null;

            $.getJSON("http://www.geoplugin.net/json.gp?jsoncallback=?", function(data) {
                if(data.geoplugin_status == 200) {
                    position = {
                        coords: {
                            latitude: data.geoplugin_latitude,
                            longitude: data.geoplugin_longitude
                        }
                    };
                }
                callback(position);
            });
        },

        /**
            Gets the poll data lookup table.   This table is used to find the
            name of the poll data for our current location.
        */
        getPollLookupTable: function (cb) {
            $.getJSON('data/poll_table.json', function (data) {
                cb(data);
            }).error(function() {
                self.error("Unable to retrieve table of supported cities.");
            });
        },

        /**
            Callback for poll lookup success.
        */
        didGetPollLookupTable: function (lookupTable) {
            var self = this;

            self.lookupTable = lookupTable;
            this.getCurrentPosition(function(position) {
                // Wrap our call to fix context of `this`.
                self.didGetCurrentPosition(position);
            });
        },

        /**
            Get current position.
        */
        getCurrentPosition: function () {
            var self = this;

            if (navigator && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    // Wrap our call to fix context of `this`.
                    if($.isFunction(window.testPosition)){
                        position = window.testPosition();
                    }
                    self.didGetCurrentPosition(position);
                }, function(error){
                    self.geoError(error);
                });
            } else {
                self.geocodeNotSupported(function(position){
                    if(position){
                        self.didGetCurrentPosition(position);
                    } else {
                        alert('Sorry, we could not get your location.');
                    }
                });
            }
        },

        /**
            Callback for navigator.geolocation success.
        */
        didGetCurrentPosition: function (position) {
            var self = this;
            var lat = this.lat = position.coords.latitude,
                lng = this.lng = position.coords.longitude;
            var center = new google.maps.LatLng(lat, lng),
                marker,
                markerPos;

            // Update the map immediately.
            this.gmap.setCenter(center);
            //this.addPollMarker(this.gmap, position.coords.latitude, position.coords.longitude, "You", "<strong>You</strong>");

            // Attempt to get poll data for the position.
            this.getPollData(position, function(pollData) {
                // Wrap our call to fix context of `this`.
                self.didGetPollData(position, pollData);
            });
        },

        /**
            Uses the poll data lookup table to find the poll data for our
            position.
        */
        getPollData: function (position, cb) {
            var fileName;
            var self = this;

            fileName = this.filenameForPosition(position, self.lookupTable);

            if (fileName && fileName.filename) {

                function getPolls(cb){
                    $.ajax({
                        url: 'data/' + fileName.filename,
                        dataType: 'json',
                        success: cb,
                        error: function(){
                            self.error(arguments);
                        }
                    });
                }

                // Saskatoon
                if(fileName.ward_filename){
                    $.ajax({
                        url: 'data/' + fileName.ward_filename,
                        dataType: 'json',
                        success: function(data){
                            self.wards = data;
                            getPolls(cb);
                        },
                        error: function(){
                            self.error(arguments);
                        }
                    });
                } else {
                    getPolls(cb);
                }

            } else {
                self.cityNotSupported();
            }
        },

        resetCityNotSupported: function(){

            this.resetAddressPanel();
            this.opts.$supported_cities.hide();
            this.opts.$map.show();

        },

        cityNotSupported: function(){

            this.showAddressError('Unable to find poll station data for your address.');
            this.opts.$address.show();
            this.opts.$loader.hide();
            this.opts.$map.hide();
            this.opts.$nearest_station.hide();
            this.slideAddressPanelDown(true);

            var supported_cities_html = '<li>' + this.getSupportedCities().join('</li><li>') + '</li>';
            this.opts.$supported_cities.show().find('ul').html(supported_cities_html);

        },

        hideAddressError: function(){
            this.opts.$address_error.hide();
        },

        showAddressError: function(msg){
            this.opts.$address_error.html(msg).show();
        },

        /**
            Callback for poll data success.
        */
        didGetPollData: function (position, pollData) {
            var lat = position.coords.latitude,
                lng = position.coords.longitude;
            var start = new google.maps.LatLng(lat, lng);
            var self = this,
                markers = this.markers,
                infoWindows = this.infoWindows;

            // Clear previous markers and info windows.
            var i;
            if (markers) {
                for (i = markers.length - 1; i >= 0; i--) {
                    markers[i].setMap(null);
                    infoWindows[i].close();
                }
            }
            if (this.directionsDisplay) { this.directionsDisplay.setMap(null); }

            // Get the nearest poll.
            var ward = this.nearestWardForPosition(position);
            var nearestPoll = this.nearestPollForPosition(position, pollData, ward);
            var directionsDisplay = this.directionsDisplay = new google.maps.DirectionsRenderer({
                map: this.gmap,
                markerOptions: {
                    animation: google.maps.Animation.DROP
                }
            });

            var end = new google.maps.LatLng(nearestPoll.geometry.coordinates[0], nearestPoll.geometry.coordinates[1]);
            var request = {
                origin: start,
                destination: end,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };

            var directionsService = new google.maps.DirectionsService();
            directionsService.route(request, function(response, status) {
                var infoWindow,
                    marker,
                    markerPos,
                    numLegs;

                if (status === google.maps.DirectionsStatus.OK) {
                    // Figure out the start and end points of the route.
                    start = response.routes[0].legs[0].start_location;
                    //self.addPollMarker(self.gmap, start.lat(), start.lng(), "You", "<strong>You</strong>");

                    numLegs = response.routes[0].legs.length;
                    end = response.routes[0].legs[numLegs - 1].end_location;
                    self.addPollMarker(self.gmap, end.lat(), end.lng(), nearestPoll.properties.name, '<strong>' + nearestPoll.properties.name + '</strong><br>' + nearestPoll.address);

                    directionsDisplay.setDirections(response);
                    self.opts.$loader.hide();
                    var ward_text = (parseInt(nearestPoll.ward, 10) > 0) ? 'in ward ' + nearestPoll.ward : '';
                    self.opts.$nearest_station_ward.text(ward_text);
                    self.opts.$nearest_station_name.text(nearestPoll.properties.name);
                    self.opts.$nearest_station_street.text(nearestPoll.address);
                    self.opts.$nearest_station.show();
                    self.resetAddressPanel();
                    self.postMapRender();
                }
            });

            // Plot all the polls on the map.
            for (i = pollData.length - 1; i >= 0; i--) {
                var infoWindow,
                    marker,
                    markerPos,
                    poll = pollData[i];

                if (nearestPoll !== poll && nearestPoll.ward && nearestPoll.ward === poll.ward) {
                    this.addPollMarker(this.gmap, poll.geometry.coordinates[0], poll.geometry.coordinates[1], poll.properties.name, '<strong>' + poll.properties.name + '</strong><br>' + poll.address);
                }
            }
        },

        addPollMarker: function(map, lat, lng, title, infoTitle) {
            var marker,
                markerPos,
                markers = this.markers,
                infoWindow,
                infoWindows = this.infoWindows;

            if (!markers) { markers = this.markers = []; }
            if (!infoWindows) { infoWindows = this.infoWindows = []; }

            markerPos = new google.maps.LatLng(lat, lng);
            marker = new google.maps.Marker({
                animation: google.maps.Animation.DROP,
                map: map,
                position: markerPos,
                title: title
            });
            markers.push(marker);

            infoWindow = new google.maps.InfoWindow({
                content: infoTitle
            });
            infoWindows.push(infoWindow);

            google.maps.event.addListener(marker, 'click', function() {
                infoWindow.open(map, marker);
            });
        },

        nearestWardForPosition: function(position){

            google.maps.Polygon.prototype.contains = function(latLng)
            {
                var j = 0;
                var oddNodes = false;
                var x = latLng.lng();
                var y = latLng.lat();
                for (var i = 0; i < this.getPath().getLength(); i++) {
                    j++;
                    if (j == this.getPath().getLength()) { j = 0; }
                    if (((this.getPath().getAt(i).lat() < y) &&
                        (this.getPath().getAt(j).lat() >= y))
                        || ((this.getPath().getAt(j).lat() < y) &&
                        (this.getPath().getAt(i).lat() >= y))) {
                        if (this.getPath().getAt(i).lng() + (y -
                            this.getPath().getAt(i).lat())
                            / (this.getPath().getAt(j).lat() -
                            this.getPath().getAt(i).lat())
                            * (this.getPath().getAt(j).lng() -
                            this.getPath().getAt(i).lng()) < x) {
                            oddNodes = !oddNodes
                        }
                    }
                }
                return oddNodes;
            }

            var distance = Infinity,
                ret = null,
                sourceLat = position.coords.latitude,
                sourceLong = position.coords.longitude;

            var latlng = new google.maps.LatLng(sourceLat, sourceLong);

            for(var i = 0; i < this.wards.length; i++){
                var sets = this.wards[i].coords.split(',0');
                var poly = [];
                for(var s = 0; s < sets.length; s++){
                    if(sets[s]){
                        var ll = sets[s].split(',');
                        var lat = ll[1];
                        var lng = ll[0];
                        poly.push(new google.maps.LatLng(lat, lng));
                    }
                }

                var Poly = new google.maps.Polygon({
                    paths: poly,
                    strokeColor: "transparent",
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    fillColor: "transparent",
                    fillOpacity: 0
                });

                Poly.setMap(this.gmap);

                if(Poly.contains(latlng)){
                    ret = Poly;
                }
            };

            return ret;

        },

        /**
            Iterates the poll data and returns the poll info for the nearest.
        */
        nearestPollForPosition: function(position, pollData, wardPoly) {
            var distance = Infinity,
                ret = null,
                sourceLat = position.coords.latitude,
                sourceLong = position.coords.longitude;

            var possiblePolls = [];
            for (var i = pollData.length - 1; i >= 0; i--) {
                var poll = pollData[i];
                if(wardPoly){
                    if(wardPoly.contains(new google.maps.LatLng(poll.geometry.coordinates[0], poll.geometry.coordinates[1]))){
                        possiblePolls.push(poll);
                    }
                } else {
                    possiblePolls.push(poll);
                }
            }

            for(var i = 0; i < possiblePolls.length; i++){
                var poll = possiblePolls[i];
                var newDistance = this.distance(sourceLat, sourceLong, poll.geometry.coordinates[0], poll.geometry.coordinates[1]);

                // Each time we find a closer poll, store it.
                if (newDistance < distance) {
                    distance = newDistance;
                    ret = poll;
                }
            }

            return ret;
        },

        getSupportedCities: function(){

            var ret = [];
            var lookupTable = this.lookupTable;

            for (var i = 0, l = lookupTable.length; i < l; i++) {
                ret.push(lookupTable[i].city + ', ' + lookupTable[i].region);
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
                    ret = pollDataFileInfo;
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
