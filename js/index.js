// Globals

var map;
var userLocation;
var previousMarker;
var localTimeString = "";
var localWeatherString = "";

// Calculate datetime based on offset and return in string format
function calcDateTime(offset) {
	var utc = Math.round(new Date().getTime() / 1000);
	var local_time = utc + offset;

	// local_time is in Unix epoch format, convert to human readable format
	dateObj = new Date(local_time * 1000);
	hours = dateObj.getUTCHours();
	minutes = dateObj.getUTCMinutes();
	seconds = dateObj.getUTCSeconds();
	year = dateObj.getUTCFullYear();
	month = dateObj.getUTCMonth() + 1;
	day = dateObj.getUTCDate();
	dateString = year + "-" + month + "-" + day;

	timeString =
		hours.toString().padStart(2, "0") +
		":" +
		minutes.toString().padStart(2, "0") +
		":" +
		seconds.toString().padStart(2, "0");

	return dateString + "  " + timeString;
}

function populateInfoWindowAndCallback(position, callback) {
	var myPromise = new Promise(function (resolve, reject) {
		var cur_time = Math.round(new Date().getTime() / 1000);
		$.ajax({
			url: "https://maps.googleapis.com/maps/api/timezone/json?",
			type: "GET",
			data: {
				location: position.lat() + "," + position.lng(),
				timestamp: cur_time,
				key: "AIzaSyAlOqeWZDcS4f5PVebZph1sFCCWUgPekS8"
			},
			success: function (res) {
				console.log(res);
				var timeString = calcDateTime(res.dstOffset + res.rawOffset);
        localTimeString = timeString;
				resolve();
			}
		});
	});
	myPromise.then(
		function (res) {
			$.ajax({
				url: "https://api.openweathermap.org/data/2.5/weather?",
				type: "GET",
				data: {
					lat: position.lat(),
					lon: position.lng(),
					units: "metric",
					APPID: "3d6e01ab81fe633e35a2a2adb5afc007"
				},
				success: function (data) {
					console.log(JSON.stringify(data));
					var weatherString =
						"\n Temperature : " +
						data["main"].temp +
						"&#8451; Humidity : " +
						data["main"].humidity +
						"% Description : " +
						data["weather"][0].description;
					localWeatherString = weatherString;

					callback();
				}
			});
		},
		function (result) {
			console.error("Error : unable to calculate weather!", result);
		}
	);
}

function setInfoWindow() {
	var infoString =
		"<b>Local Time :</b> " +
		localTimeString +
		"<br><br> <b>Weather :</b> " +
		localWeatherString;

	var infowindow = new google.maps.InfoWindow({
		content: infoString
	});

	infowindow.open(map, previousMarker);
}

function placeMarkerAndPanTo(latLng, map) {
	if (previousMarker) previousMarker.setMap(null);

	previousMarker = new google.maps.Marker({
		position: latLng,
		map: map
	});

	map.setZoom(5);
	map.panTo(latLng);

	populateInfoWindowAndCallback(latLng, setInfoWindow);
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
		zoom: 4,
		center: {
			lat: userLocation.lat(),
			lng: userLocation.lng()
		}
  });
  
	previousMarker = new google.maps.Marker({
		position: userLocation,
		map: map
	});

	map.addListener("click", function (e) {
		placeMarkerAndPanTo(e.latLng, map);
	});

	console.log("initMap : localTimeString ", localTimeString);
	console.log("initMap : localWeatherString ", localWeatherString);

	var infoString =
		"<b>Local Time :</b> " +
		localTimeString +
		"<br><br> <b>Weather :</b> " +
		localWeatherString;
	var infowindow = new google.maps.InfoWindow({
		content: infoString
	});

	infowindow.open(map, previousMarker);
}

function init() {
	var myPromise = new Promise(function (resolve, reject) {
		// Find latitude and longitude based on IP of the user
		$.get(
			"https://ipinfo.io",
			function (response) {
				console.log(response.ip, response.country);
				var latlong = response.loc.split(",");
				userLocation = new google.maps.LatLng(parseFloat(latlong[0]), parseFloat(latlong[1]));
				console.log(
					"location is :" + userLocation.lat() + " " + userLocation.lng()
				);
				resolve(userLocation);
			},
			"jsonp"
		);
	});

	myPromise.then(
		function (userLocation) {
			populateInfoWindowAndCallback(userLocation, initMap);
		},
		function (result) {
			console.error("Error in getting user's ip", result);
		}
	);
}