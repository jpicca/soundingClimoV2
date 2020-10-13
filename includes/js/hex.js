// Script to create 2d hex chart

var hexParm = {}

class hexChart {

    constructor() {
        
        // Set the chart dimensions
        this.width = $('#chart-container').width()*.99;
        this.height = $(document).height()*0.6;
        this.margin = ({top: 20, right: 30, bottom: 20, left: 40})

    }

    updateParms() {
        hexParm.station = $('#stn').val().toLowerCase();
        hexParm.parms = [$('#chrtXparam').val().toLowerCase(),$('#chrtYparam').val().toLowerCase()];

        hexParm.files = [`./datafiles/${hexParm.station}/${hexParm.station}-${hexParm.parms[0]}-filtered.csv`,
    `./datafiles/${hexParm.station}/${hexParm.station}-${hexParm.parms[1]}-filtered.csv`]
    }

    prepData() {

        return new Promise((resolve,reject) => {
            Promise.all([d3.csv(hexParm.files[0]),d3.csv(hexParm.files[1])])
                .then(files => {
                    let data1 = files[0], data2 = files[1];

                    // If filter set for min/max values, filter em
                    if ($('#x-min').val()) { data1 = data1.filter(d => +d.val > $('#x-min').val())}
                    if ($('#x-max').val()) { data1 = data1.filter(d => +d.val < $('#x-max').val())}

                    if ($('#y-min').val()) { data2 = data2.filter(d => +d.val > $('#y-min').val())}
                    if ($('#y-max').val()) { data2 = data2.filter(d => +d.val < $('#y-max').val())}

                    // Filter for missing data and dates before 1965
                    // Dates before 1965 occasionally have duplicate entries...
                    // Needs to be fixed upstream
                    data1 = data1.filter(d => +d.val > -9998)
                    data1 = data1.filter(d => d.date.slice(0,2) > 65)

                    data2 = data2.filter(d => +d.val > -9998)
                    data2 = data2.filter(d => d.date.slice(0,2) > 65)

                    let dataMap = {};

                    data1.forEach(entry => { 

                        dataMap[entry.date] = +entry.val
                        
                    });

                    data2.forEach(entry => { 
                        
                        entry.val = +entry.val;
                        entry.val1 = dataMap[entry.date]; 
                    } );

                    // Final filter to ensure that we remove undefineds
                    this.data = data2.filter(d => d.val1);

                    // Filtering user-entered dates
                    let minMon = $('#month-min').val(), maxMon = $('#month-max').val();
                    let minDay = $('#day-min').val(), maxDay = $('#day-max').val();

                    // Use 2008 as a base year
                    let minDate = new Date(`2008-${minMon}-${minDay}T12:00:00Z`)
                    let maxDate = new Date(`2008-${maxMon}-${maxDay}T12:00:00Z`)

                    this.data = this.data.filter(d => {
                        let entryDate = new Date(`2008-${d.date.slice(2,4)}-${d.date.slice(4,6)}T12:00:00Z`);

                        return (minDate <= entryDate) && (maxDate >= entryDate);
                    })

                    resolve();

                });

            });
    };

    updateFunctions() {

        this.x = d3.scaleLinear()
        this.y = d3.scaleLinear()

        this.x
            .domain(d3.extent(this.data, d => d.val1)).nice()
            .rangeRound([this.margin.left, this.width - this.margin.right])

        this.y
            .domain(d3.extent(this.data, d => d.val)).nice()
            .rangeRound([this.height - this.margin.bottom, this.margin.top])

        this.xAxis = g => g.append("g")
            .attr("transform", `translate(0,${this.height - this.margin.bottom})`)
            .call(d3.axisBottom(this.x).tickSizeOuter(0))
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick:last-of-type text").clone()
                .attr("y", -5)
                .attr("dy", null)
                .attr("font-weight", "bold")
                .attr("text-anchor", "end")
                .text($('#chrtXparam option:selected').text()))

        this.yAxis = g => g.append("g")
            .attr("transform", `translate(${this.margin.left},0)`)
            .call(d3.axisLeft(this.y).tickSizeOuter(0))
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick:last-of-type text").clone()
                .attr("x", 3)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text($('#chrtYparam option:selected').text()))

        this.hexbins = d3.hexbin()
                    .x(d => this.x(d.val1))
                    .y(d => this.y(d.val))
                    .radius(8)
                    .extent([[this.margin.left, this.margin.top], 
                        [this.width - this.margin.right, this.height - this.margin.bottom]])

        this.bins = this.hexbins(this.data)

        return this;

    }

    makePlot() {

        $('#hexLabel').html(`<b>All ${hexParm.station.toUpperCase()}</b> (Filtered)`)

        let color = d3.scaleSequential(d3.interpolateBuPu)
                        .domain([0, d3.max(this.bins, d => d.length) / 1.25])

        let svg = d3.select('#chart-container')
                    .append('svg')
                    .attr("width", this.width)
                    .attr("height", this.height);

        svg.append("g")
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.1)
            .selectAll("path")
            .data(this.bins)
            .join("path")
            .attr('id', d => {
                let x = d.x.toFixed(0);
                let y = d.y.toFixed(0);
                let XYid = `id_${x}_${y}`;

                return XYid;
            })
            .attr("d", this.hexbins.hexagon())
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .attr("fill", d => color(d.length))
            .classed('hexBin',true)
            .on('click', (d) => {

                let centerX = this.x.invert(d.x).toFixed(2);
                let centerY = this.y.invert(d.y).toFixed(2);

                d3.select('#hexDat')
                    .html(`<span><b>${d.length}</b> obs of <b>${this.data.length}</b> total
                        (<b>${(100*d.length/this.data.length).toFixed(2)}%</b>), 
                        centered on x: ${centerX}, y: ${centerY}</span>`);

                //console.log(d);
                
                // formatting
                d3.selectAll('.selBin').classed('selBin',false)

                let x = d.x.toFixed(0);
                let y = d.y.toFixed(0);
                d3.select(`#id_${x}_${y}`).classed('selBin',true)


            });

        svg.append("g")
            .call(this.xAxis);

        svg.append("g")
            .call(this.yAxis);

    }

}
