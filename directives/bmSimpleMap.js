angular.module("bmComponents").directive("bmSimpleMap", ["$timeout", "$parse", "$location",
    function ($timeout, $parse, $location) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {

                google.maps.visualRefresh = true;

                var options = {
                        center: new google.maps.LatLng(52.402419, 4.921446),
                        zoom: 16,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    },
                    map = new google.maps.Map(element.get(0), options),
                    coords,
                    marker,
                    timeoutPromise;


                function setCoords(LatLon) {
                    var latitudeSetter = $parse(attrs.latitude).assign;
                    var longitudeSetter = $parse(attrs.longitude).assign;
                    if(LatLon) {
                        latitudeSetter(scope, LatLon.lat());
                        longitudeSetter(scope, LatLon.lng());
                    } else {
                        google.maps.event.addListener(marker, 'dragend', function(event) {
                            var geocoder = new google.maps.Geocoder();
                            $timeout( function (){
                                latitudeSetter(scope, event.latLng.lat());
                                longitudeSetter(scope, event.latLng.lng());
                            });
                        });
                    }
                }

                scope.$watch(attrs.visible, function (value) {
                    if (value) {
                        google.maps.event.trigger(map, "resize");
                        console.log(coords);
                        if (coords) {
                            map.setCenter(coords);
                        } else {
                            var  geocoder = new google.maps.Geocoder();
                            var geolocationData = $parse(attrs.geolocationData)(scope);
                            console.log(geolocationData);
                            var addressObj = {
                                address : (geolocationData.city ? geolocationData.city : "") + " " +(geolocationData.countryISO2 ? geolocationData.countryISO2 : "")
                            };

                            geocoder.geocode(addressObj, function (results, status) {
                                    if (status == google.maps.GeocoderStatus.OK) {
                                        if(results.length) {
                                            var lat = results[0].geometry.location.lat();
                                            var lng = results[0].geometry.location.lng();
                                            map.setCenter(new google.maps.LatLng(lat, lng));
                                            map.setZoom(10);
                                        }
                                    } else {
                                        map.setZoom(2);
                                    }
                                }
                            );
                        }
                    }
                });

                scope.$on("switchMode", function () {
                    $timeout(function () {
                        google.maps.event.trigger(map, "resize");
                    });
                });

                scope.$watch(attrs.mapCenter, function (coords) {
                    if (coords) {
                        map.setCenter(new google.maps.LatLng(coords.lat, coords.lon));
                    }
                });


                scope.$watch(attrs.addMarker, function (noMarker) {
                    if (noMarker) {
                        var centerOfMap = map.getCenter();
                        marker = new google.maps.Marker({
                            position: centerOfMap,
                            map: map,
                        });
                        if(attrs.icon) {
                            marker.setIcon(attrs.icon);
                        }
                        marker.setDraggable(true);
                        setCoords(centerOfMap);
                    }
                });

                scope.$watch(attrs.draggable, function (newVal) {
                    if (marker) {
                        if (newVal == true) {
                            marker.setDraggable(true);
                        } else {
                            marker.setDraggable(false);
                        }

                    }
                });
                scope.$watch(attrs.mapMarker, function (markerData) {
                    if (markerData && markerData.latitude && markerData.longitude) {
                        coords = new google.maps.LatLng(markerData.latitude, markerData.longitude);
                        if (!marker) {
                            marker = new google.maps.Marker({
                                position: coords,
                                map: map
                            });
                            if(attrs.icon) {
                                marker.setIcon(attrs.icon);
                            }

                        } else {
                            marker.setPosition(coords);
                        }

                        setCoords();

                        $timeout(function () {
                            google.maps.event.trigger(map, "resize");
                            map.setCenter(coords);
                        });
                    }
                }, true);



                scope.$watch(attrs.triggerResize, function (newVal) {
                    if (newVal) {
                        $timeout(function () {
                            google.maps.event.trigger(map, "resize");
                            if (marker) {
                                map.setCenter(marker.getPosition());
                            }
                        });
                        $timeout(function () {
                            google.maps.event.trigger(map, "resize");
                            if (marker) {
                                map.setCenter(marker.getPosition());
                            }
                        }, 200);
                        $timeout(function () {
                            google.maps.event.trigger(map, "resize");
                            if (marker) {
                                map.setCenter(marker.getPosition());
                            }
                        }, 400);
                    }
                }, true);

                scope.$watch(attrs.geolocationData, function (newValue, oldValue) {

                    var addressObj,
                        geocoder = new google.maps.Geocoder(),
                        locationLatitudeSetter = $parse(attrs.latitude).assign,
                        locationLongitudeSetter = $parse(attrs.longitude).assign;

                    if (newValue && oldValue && (newValue.street !== oldValue.street || newValue.houseNumber !== oldValue.houseNumber
                        || newValue.zipCode !== oldValue.zipCode || newValue.city !== oldValue.city)) {
                        $timeout.cancel(timeoutPromise);
                        if (newValue && newValue.street && newValue.zipCode && newValue.city) {
                            timeoutPromise = $timeout(function () {
                                addressObj = {
                                    address: newValue.street + " " +
                                    (newValue.houseNumber ? newValue.houseNumber + (newValue.houseNumberSuffix ? newValue.houseNumberSuffix : "") + " " : "") +
                                    newValue.zipCode + " " + newValue.city
                                };
                                geocoder.geocode(addressObj, function (results, status) {
                                    if (status == google.maps.GeocoderStatus.OK) {
                                        scope.$apply(function () {
                                            locationLatitudeSetter(scope, results[0].geometry.location.lat());
                                            locationLongitudeSetter(scope, results[0].geometry.location.lng());
                                            coords = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
                                            if (!marker) {
                                                marker = new google.maps.Marker({
                                                    position: coords,
                                                    map: map
                                                });
                                                if(attrs.icon) {
                                                    marker.setIcon(attrs.icon);
                                                }
                                            } else {
                                                marker.setPosition(coords);
                                            }
                                            map.setCenter(coords);
                                        });
                                    }
                                });
                            }, 1000);
                        }
                    }
                }, true);

                scope.$watch(attrs.mapData, function (mapData) {
                    if (mapData) {
                        var infowindow = new google.maps.InfoWindow();
                        var bounds = new google.maps.LatLngBounds();
                        mapData.forEach(function (location) {
                            var myLatLng = new google.maps.LatLng(location.latitude, location.longitude);
                            marker = new google.maps.Marker({
                                position: myLatLng,
                                map: map
                            });
                            if (attrs.icon) {
                                marker.setIcon(attrs.icon);
                            }
                            if (location.icon) {
                                marker.setIcon(location.icon);
                            }
                            bounds.extend(myLatLng);
                            if (location.tooltip) {
                                google.maps.event.addListener(marker, 'click', (function (marker) {
                                    return function () {
                                        infowindow.setContent(location.tooltip);
                                        infowindow.open(map, marker);
                                    }
                                })(marker));
                            }
                            if(attrs.goTo) {
                                google.maps.event.addListener(marker, 'click', function (marker) {
                                    var url = attrs.goTo;
                                    for (var i in location.replaceData) {
                                        url = url.replace(i, location.replaceData[i]);
                                    }
                                    scope.$apply(function() {
                                        $location.url(url);
                                    });
                                });
                            }
                        });
                        google.maps.event.addListenerOnce(map, 'idle', function () {
                            map.fitBounds(bounds);
                            map.setCenter(bounds.getCenter());
                        });
                    }

                }, true);

            }
        }
    }
]);