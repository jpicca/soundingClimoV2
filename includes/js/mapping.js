// This file contains code for the overlay map

d3.json('./includes/misc/counties-albers-10m.json').then(function(us) {

    var path = d3.geoPath()
    
    var projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305])

    d3.select('#map-container svg').html(`
        <g fill="none" stroke="#000" stroke-linejoin="round" stroke-linecap="round">
        <path stroke="#aaa" stroke-width="0.5" d="${path(topojson.mesh(us, us.objects.counties, (a, b) => a !== b && (a.id / 1000 | 0) === (b.id / 1000 | 0)))}"></path>
        <path stroke-width="0.5" d="${path(topojson.mesh(us, us.objects.states, (a, b) => a !== b))}"></path>
        <path d="${path(topojson.feature(us, us.objects.nation))}"></path>
        </g>`)


    d3.json("./includes/misc/siteList.json").then(function(collection) {

        function updateClass(selection) {
            selection.classed('selSite',true);
        }
        
        var mapG = d3.select('#map-container').select('g')
        
        let citypoints = mapG.selectAll(".citypoints")
            .data(collection.sites)
            .join("circle")
            .style("stroke", "black")  
            .style("opacity", .6) 
            .style("fill", "black")
            .classed('citypoints',true)
            .attr('id', d => d.ID)
            .classed('selSite', d => {
                if (d.ID == 'OUN') {
                    return true;
                } else {
                    return false;
                }
            })
            .attr("r", 10)
            .attr("cx",d => projection([d.coordinates[1],d.coordinates[0]])[0])
            .attr("cy",d => projection([d.coordinates[1],d.coordinates[0]])[1])
            
        citypoints.on('click', d => {

            // Remove animation from prior selected
            d3.select('.selSite').classed('selSite',false);

            // Add animation to this selected element
            // Don't ask me why d3.select(this) returns the whole window element...
            // but it does, so this is a workaround
            // Guessing there's a conflict with jquery somehow
            d3.select(`#${d.ID}`).classed('selSite',true);
            
            // Update selected station in dropdown menu
            $('#stn').val(d.ID);

            // Hide map
            $('#map-container').hide();

            // Run station updater
            stationChange();

        })

        // Make the circle big on mouseover
        citypoints.on('mouseover', d => {
            d3.select(`#${d.ID}`).attr('r',15)
        })

        // Make the circle small on mouseout
        citypoints.on('mouseout', d => {
            d3.select(`#${d.ID}`).attr('r',10)
        })

    });
});