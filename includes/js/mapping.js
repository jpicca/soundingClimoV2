// This file contains code for the overlay map

function makeMap() {

    // let zoom, center;

    // function checkMatch(x) {
    //     if (x.matches) { // If media query matches
    //         zoom = 1;
    //         center = [39.8283, -98.5795];
    //       } else {
    //         zoom = 2;
    //         center = [26.9944,-25.9722];
    //       }
    // }

    function formatSites(list) {
        return new Promise((resolve,reject) => {

            var geojson = [];
                    
            list.forEach(function(point){
                var lat = point.coordinates[1]
                var lon = point.coordinates[0]

                var feature = {type: 'Feature',
                    properties: point,
                    geometry: {
                        type: 'Point',
                        coordinates: [lat,lon]
                    }
                };
                
                geojson.push(feature);
            });    
            resolve(geojson);
        })
    }

    // Check window size
    let match = window.matchMedia("(max-width: 700px)")

    // checkMatch(match)

    // Initialize leaflet map
    let map = L.map('lmap', {
        // center: center,
        // zoom: zoom
    });

    L.tileLayer( 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo( map );

    d3.json("./includes/misc/siteList.json").then(async function(collection) {
        let geojson = await formatSites(collection.sites)

        let siteGroup = L.geoJson(geojson,
            {
                pointToLayer: function (feature,latlng) {
                    return L.circleMarker(latlng, {
                        radius: 8,
                        fillColor: "#ff7800",
                        color: "#000",
                        weight: 1
                    })
                },
                onEachFeature: onEachFeature
            }
        ).addTo(map);

        map.fitBounds(siteGroup.getBounds());
    });

    let info = L.control({position: 'topright'});
    info.onAdd = function(map) {
        this._div = L.DomUtil.create('div','info')
        this.update();
        return this._div;
    }
    info.update = function(props) {
        this._div.innerHTML = `<h6> Sounding Site: </h6> ` + 
            (props ? `${props.ID} (${props.site})` : 'Hover over a site');
    }
    info.addTo(map);

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: selectFeature
        });
    }

    function highlightFeature(e) {
        var layer = e.target;
        
        info.update(e.target.feature.properties)
        layer.setStyle({
            weight: 5
        });
    }

    function resetHighlight(e) {

        info.update()
        var layer = e.target;
        layer.setStyle({
            weight: 1
        })
    }

    function selectFeature(e) {

        let ID = e.target.feature.properties.ID;
        $('#stn').val(ID);
        info.update(e.target.feature.properties);
        stationChange();

    }

}