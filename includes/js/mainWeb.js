// Create a global variable for our hexchart
// Don't instantiate it until the doc is ready though
var hexchart, dm, chart, chart2, chart3, chart4, chart5,
    timeSeries, hist, range, maxTab, minTab;

var margin = {top: 10, right: 20, bottom: 40, left: 40};
var height = $(window).height()

// Time series chart

class tsChart {

  // Create instance with variables
  constructor(width) {
    this.width = width //- margin.left - margin.right;
    this.title = "";
    this.ylabel = "";
  }

  // Set title of chart
  setTitle(title) {
    this.title = title;
    return this;
  }

  setYLabel(ylabel) {
    this.ylabel = ylabel;
    return this;
  }

  makeChart(dcChart,dim,group) {

    // dcjs's elastic y sets the min at 0 if there are no negative values
    // This causes too large of a y domain if all the values are much higher
    // than 0. So instead, I've set some logic to create appropriate y ranges

    let minVal = dm.getbarDim().bottom(1)[0].val
    let maxVal = dm.getbarDim().top(1)[0].val
    let rangeVal = maxVal - minVal;
    let blankDistCoef = 0.2;
    let buffer = .01*rangeVal;
    let min;
    let max;

    if (minVal >= 0) {
      max = maxVal + buffer;
      min = (rangeVal*blankDistCoef > minVal) ? 0 : minVal - buffer;
    } else if (maxVal < 0) {
      // opposite of logic in the block above
      max = (rangeVal*blankDistCoef > -maxVal) ? 0 : maxVal + buffer;
      min = minVal - buffer;
    } else {
      max = maxVal + buffer;
      min = minVal - buffer;
    }

    // If values are entered in the dropdown for y-axis control, update min/max
    if ($('#ymin').val()) { min = +$('#ymin').val() }
    if ($('#ymax').val()) { max = +$('#ymax').val() }

    dcChart.width(this.width)
      .height(height*0.65)
      .x(d3.scaleTime()
          .domain([new Date(2008, 0, 1, 0), new Date(2009, 0, 1, 12)]))
      .renderHorizontalGridLines(true)
      .dimension(dim)
      .group(group)
      .yAxisLabel($('#sndparam option:selected').text())
      .elasticY(false)
      .y(d3.scaleLinear()
          .domain([min,max]))
      .rangeChart(range)
      .brushOn(false)
      .title(d => {return d3.timeFormat('%b %d')(d.key)})
      .compose([
        new dc.LineChart(dcChart)
            .dimension(dim)
            .group(group)
            .valueAccessor(p => p.value.p25)
            .stack(group, 'p75', p => p.value.p75 - p.value.p25)
            .renderArea(true)
            .colors(['#800001']),
        new dc.LineChart(dcChart)
            .colors(['#665DF2'])
            .valueAccessor(p => p.value.p00),
        new dc.LineChart(dcChart)
            .colors(['#000F8B'])
            .valueAccessor(p => p.value.p01),
        new dc.LineChart(dcChart)
            .valueAccessor(p => p.value.p10)
            .colors(['#2AAAAA']),
        new dc.LineChart(dcChart)
            .valueAccessor(p => p.value.p50)
            .colors(['#000000']),
        new dc.LineChart(dcChart)
            .valueAccessor(p => p.value.mean)
            .colors(['#333333']),
        new dc.LineChart(dcChart)
            .valueAccessor(p => p.value.p90)
            .colors(['#ce933b']),
        new dc.LineChart(dcChart)
            .valueAccessor(p => p.value.p99)
            .colors(['#8B0000']),
        new dc.LineChart(dcChart)
            .valueAccessor(p => p.value.p100)
            .colors(['#F9182C']),
        new dc.ScatterPlot(dcChart)
            .dimension(dm.getScatDim())
            .group(dm.getScatGroup())
            .symbolSize(15)
            .ordinalColors(['black'])
      ])
      // Use the highlighting function to bind data updating on render/re-draws
      .on('renderlet', () => {
        highlighting();

      })
      // Keep gridline and IQR shading formatted properly before any drawing
      .on('pretransition', () => {
        // Format grid lines (and anything else)
        var hGridlines = d3.select('g.grid-line.horizontal').selectAll('line')
        
        hGridlines.attr('stroke-width',0.5)
            .attr('stroke','black')
            .style('opacity',0.5)

        // dcjs doesn't have a good utility for area charts between lines
        // so manually hiding the lower area to focus on the IQR
        var area2hide = d3.select('path.area')
        area2hide.style('fill-opacity',0)

        var tickLabels = d3.select('#line-chart').select('.axis.x').selectAll('text');

        tickLabels.attr('transform','rotate(30)')
          .style("text-anchor", "start");

      })
      .xAxis()
      .tickFormat(d3.timeFormat('%b %d'))

      // Use this d3 label formatting to shrink y-axis tick labels to work with the axis label
      // the "~" removes insignificant 0s
      // The formatting is weird for PW, though, so the range check is a workaround.
      // Also yAxis formatting is not chained because the prior xAxis chained method returns
      // the axis and not the chart... resulting in not being able to chain dcjs chart methods
      
      if (rangeVal > 1000) {
        dcChart.yAxis()
            .tickFormat(d3.format("~s"))
      } else {
        dcChart.yAxis()
            .tickFormat(d3.format(""))
      }

      dcChart.render();

  }
}

// Parameter Distribution Bar Chart

class bChart {

  constructor(width) {
    this.width = width // - margin.left - margin.right;
    this.title = "";
    this.ylabel = "";
  }

  // Set title of chart
  setTitle(title) {
    this.title = title;
    return this;
  }

  setYLabel(ylabel) {
    this.ylabel = ylabel;
    return this;
  }

  makeChart(dcChart,dim,group) {

    dcChart.width(this.width)
        .height(0.3*height)
        .margins(margin)
        .mouseZoomable(false)
        .dimension(dim)
        .group(group)
        .elasticY(true)
        .xUnits(dc.units.fp.precision(parmParm[$('#sndparam option:selected').text()].bin))
        .yAxisLabel('# Obs')
        .xAxisLabel($('#sndparam option:selected').text())
        .x(d3.scaleLinear())
        .elasticX(true)
        .yAxis()
        .tickFormat(d3.format("~s"));

        dcChart.yAxis().ticks(8);
        dcChart.render();

  }

}

// Range Chart

class rChart {

  constructor(width) {
    this.width = width;
    this.title = "";
    this.ylabel = "";
  }

  // Set title of chart
  setTitle(title) {
    this.title = title;
    return this;
  }

  setYLabel(ylabel) {
    this.ylabel = ylabel;
    return this;
  }

  makeChart(dcChart,dim,group) {

    dcChart.width(this.width)
      .height(0.15*height)
      .mouseZoomable(false)
      .dimension(dim)
      .group(group)
      .yAxisLabel('# Obs')
      .elasticY(true)
      .x(d3.scaleTime()
          .domain([new Date(2008, 0, 1, 0), new Date(2009, 0, 1, 12)]))
      .xAxis()
      .tickFormat(d => { 

        let formatter = d3.timeFormat("%b")
        
        return formatter(d)

      });

      dcChart.yAxis().ticks(3);

      dcChart.render();
  }

}

// Max/Min Tables

class tabChart {

  constructor(width) {
    this.width = width;
    this.title = "";
    this.ylabel = "";
  }

  // Set title of chart
  setTitle(title) {
    this.title = title;
    return this;
  }

  makeChart(dcChart,dim,unit,top=true) {

    // Set appropriate variable for top 5 / bottom 5 list
    let ordering = top ? d3.descending : d3.ascending

    // If we're listing min values, filter the missing vals (-9999s)
    if (top == false) {
      dim.filter(d => { return d > -9999})
    }

    dcChart.width(this.width)
        .dimension(dim)
        .size(5)
        .order(ordering)
        .columns([
          //'date',
          {
            label: 'Date',
            format: d => {
              // let formatter = d3.timeFormat("%b %d, %Y (%HZ)")
              let formatter = d3.timeFormat("%m/%d/%Y (%HZ)")
              return formatter(d.date)
            }
          },
          {
            label: 'Value',
            format: d => {
              return `${d.val.toFixed(parmParm[$('#sndparam option:selected').text()].dec)} ${unit}` 
            }
          }
        ])
        .render();
      
  }

}

// Functions for page transitions/loading/sampling
function loadingFormat() {
  $("#svg-plot").css("opacity",0.1)
  $("#loading-page").css("display","block")
}

function finishedFormat() {
  $("#svg-plot").css("opacity",1)
  $("#loading-page").css("display","none")
}

function highlighting() {

  // Set up tooltip
  
  let circles = d3.selectAll('.dot')
  let formatter = d3.timeFormat("%b %d (%HZ)")
  let date;

  circles.on('mouseover', d => 
    {

      updateSample(d,formatter);
      
    }).on('click', d => {

      // If there are unmutable classes present, that means we have a date selected
      let locked = d3.select('.unmutable').node()

      // In the instance of a new click, it's then OK to run updateSample
      if (locked) {
        d3.selectAll('.unmutable')
          .classed('mutable',true)

        updateSample(d,formatter)
      }

      // Remove previous date highlighting of dots
      d3.selectAll('.datetime')
        .classed('datetime',false)

      // If we click dot, we want to lock date/data on table
      d3.selectAll('.mutable')
        .classed('mutable', false)
        .classed('unmutable', true)

      // Get date from data 
      date = d.data.key;

      d3.selectAll('.dot')
        .filter(d => { return d.data.key == date})
        .classed('datetime', true)

      // Use the instruction span to allow user to unlock data
      let instruct = d3.select('#instruction')
        
      instruct.html('<a href="#">&nbsp; Unlock Data</a>')

      // Clear the data lock but prevent the click from scrolling to the top of the page

      $('#instruction a').click(function(e) { clearLock(); e.preventDefault(); })

    });

}

function clearLock() {

  let instruct = d3.select('#instruction')

  instruct.html('&nbsp; (Click sampled date to lock data)')

  d3.selectAll('.datetime')
    .classed('datetime',false)

  d3.selectAll('.unmutable')
    .classed('mutable',true)
    .classed('unmutable',false)

}

function updateSample(d,formatter) {

  d3.select('th.mutable')
        .html(`<b>${formatter(d.data.key)}</b>`)

      let row = d3.select('tr.mutable')

      row.select('#min')
        .text(d.data.value.p00.toFixed(parmParm[$('#sndparam option:selected').text()].dec))

      row.select('#amin')
        .text(d.data.value.p01.toFixed(parmParm[$('#sndparam option:selected').text()].dec))

      row.select('#a10')
        .text(d.data.value.p10.toFixed(parmParm[$('#sndparam option:selected').text()].dec))

      row.select('#a25')
        .text(d.data.value.p25.toFixed(parmParm[$('#sndparam option:selected').text()].dec))

      row.select('#amed')
        .text(d.data.value.p50.toFixed(parmParm[$('#sndparam option:selected').text()].dec))

      row.select('#mean')
        .text(d.data.value.mean.toFixed(parmParm[$('#sndparam option:selected').text()].dec))

      row.select('#a75')
        .text(d.data.value.p75.toFixed(parmParm[$('#sndparam option:selected').text()].dec))

      row.select('#a90')
        .text(d.data.value.p90.toFixed(parmParm[$('#sndparam option:selected').text()].dec))

      row.select('#amax')
        .text(d.data.value.p99.toFixed(parmParm[$('#sndparam option:selected').text()].dec))

      row.select('#max')
        .text(d.data.value.p100.toFixed(parmParm[$('#sndparam option:selected').text()].dec))

}

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

// Updated Whether DataManager is operating on Raw or Filtered Files
function updateFiltered() {
  dm.filteredFiles($("#raw-vs-filter input[type='radio']:checked").val().toLowerCase())
};

// Update DataManager as to whether 0 values need to be filtered
function updateFilter() { dm.filter0($("#filter0").prop("checked")); };

// Update the DataManager station ID
function updateStation() { 
  dm.station($("#stn").val().toLowerCase());
};

// When Sounding Time is updated, set new time and updated the smoother
function updateSoundTime() {
  dm.soundTime($("#soundingtimes input[type='radio']:checked").val().toLowerCase());
  updateSmoothPeriod();
};

// Updated the DataManager Smoothing Period
function updateSmoothPeriod() {
  if ($("#movave").val() == 0) { dm.smoothPeriod($("#movave").val()); }
  else { dm.smoothPeriod(makeOdd(+$("#movave").val())); };
};

// Update the DataManager Sounding Parameter
function updateSoundParm() { dm.soundParm($('#sndparam option:selected').val().toLowerCase()); };
function updateSoundParmUnit() { dm.soundParmUnit($('#sndparam option:selected').attr('unit')); };

// Need to return a resolved promise for async jq call functions
function updateQuantiles() {
  return new Promise((resolve,reject) => {

    dm.createDefaultQuantiles();

    resolve();
  })
}

// Update the data in the DataManager in async fashion
async function updateData(init=true) {

  // Await the resolution of the promise in readData before continuing
  await dm.readData(dm.fileName());

  // Read current obs (**the data for current obs are old**)
  await dm.readObs();
  dm.formatObs();

  // Await the resolution of quantile creation before continuing
  await dm.createDefaultQuantiles();

  // Clear any residual filters from last station
  //range.filter(null)
  //timeSeries.filter(null)

  // Check if we need to carry over a time filter from a prior visualization
  if (dm.soundTime() != 'all') {
    let time = +$("#soundingtimes input[type='radio']:checked").val().slice(0,2);
    dm.getUserDim().filter(d => { return d.getHours() == time });
  }

  // Check if this is the initial load of the page or not
  // If it is the initial load, we can make time series chart the normal way
  // If it isn't, we need to make it the temp way (due to the somewhat jury-rigged way
  // that Joey set up the time series grouping)

  if (init) {

    chart.makeChart(timeSeries,dm.getDateIdxDim(),dm.getGroupByDay());

  } else {

    // Clear any residual filters from last station
    range.filter(null)
    timeSeries.filter(null)

    dm.updateTSGroup();

  }

  // Filter values if any are specified in the input windows
  if ($('#filterMin').val() && $('#filterMax').val()) {
    dm.getZeroFilter().filter(d => { return (d > $('#filterMin').val() && d < $('#filterMax').val())})
  } else if ($('#filterMax').val()) {
    dm.getZeroFilter().filter(d => { return d < $('#filterMax').val()})
  } else if ($('#filterMin').val()) {
    dm.getZeroFilter().filter(d => { return d > $('#filterMin').val()})
  }

  // Re-create all other charts
  chart2.makeChart(hist,dm.getbarDim(),dm.getbarGroup());
  chart3.makeChart(range,dm.getDateIdxDim(),dm.getGroupByDateCount());
  chart4.makeChart(maxTab,dm.getbarDim(),dm.getUnit());
  chart5.makeChart(minTab,dm.getbarDim(),dm.getUnit(),false);

  // Update the main header title
  chart.setTitle(dm.soundTime().toUpperCase() + " Soundings for " + dm.station()
        .toUpperCase())
        .setYLabel($('#sndparam option:selected').text());

  // Set the html element with the above created title
  $('#svg-title').text(chart.title);

  // Return the svg holder to full opacity and hide loading text
  finishedFormat();
};

// An async function to simply update charts (not load new data) when time or plot options are changed
async function refreshChart(type) {

  // Decrease opacity of plots while new data is processing
  loadingFormat();

  switch (type) {
    case 'time' :
      let newTime = +$("#soundingtimes input[type='radio']:checked").val().slice(0,2)

      // Get any current filter from range chart
      let filter = range.filter();

      // console.log(filter)
      
      // Clear the filter from the range and time series charts to start fresh
      range.filter(null);
      timeSeries.filter(null);

      // If newTime is coerced to int, it'll be 0 or 12; otherwise 'all' is changed to NaN
      // Time is all
      if (isNaN(newTime)) {

        // Need to make sure we've created the right quantiles before any filter changes
        await dm.createDefaultQuantiles(false);

        // Clear the time filters
        dm.getUserDim().filter();

        // Update time series chart with original, unfiltered dimension / group
        dm.updateTSGroup();

        // Re-apply filter to range chart
        range.filter(filter)

        // Redraw charts again
        dc.redrawAll();

      } 
      // Time is 00 or 12
      else {
        
        // Need to make sure we've created the right quantiles before any filter changes
        await dm.createDefaultQuantiles(false);

        // Filter for the proper hour
        dm.getUserDim().filter(d => { return d.getHours() == newTime });
        
        // Redraw all charts (except time series... sort of)
        // dc.redrawAll();

        // Time series has to use a special function that utilizes temp crossfilters/dimensions
        dm.updateTSGroup();

        // Re-apply filter to range chart
        range.filter(filter)

        // Redraw charts again
        dc.redrawAll();
      }

      // Update title
      // Update the main header title
      chart.setTitle(dm.soundTime().toUpperCase() + " Soundings for " + dm.station()
        .toUpperCase())
        .setYLabel($('#sndparam option:selected').text());

      // Set the html element with the above created title
      $('#svg-title').text(chart.title);

      break;
    case 'yaxis':

      // Logic in make chart will check the yaxis values entered
      dm.updateTSGroup();

      break;
  }

  finishedFormat();

}

async function updateHex(chart) {

  // Add a 'building' window
  $('#hex-build').show()

  // Remove any old svg
  let container = d3.select('#chart-container')
  let byeSVG = container.select('svg')
  byeSVG.remove()

  // Reset span instruction text
  container.select('#hexDat span').text('Sampled Data (Click/Tap Bin for Counts)')

  chart.updateParms();
  await chart.prepData();
  chart.updateFunctions().makePlot();

  // Hide 'building' window
  $('#hex-build').hide()
}

$(window).ready(function() {

  dm = d3Edge.dataManager();
  chart = new tsChart($("#line-chart").width())
  chart2 = new bChart($("#bar-chart").width())
  chart3 = new rChart($("#obs-count").width())
  chart4 = new tabChart($("#max-table").width())
  chart5 = new tabChart($("#min-table").width())

  timeSeries = new dc.CompositeChart('#line-chart')
  hist = new dc.BarChart('#bar-chart')
  range = new dc.BarChart('#obs-count')
  maxTab = new dc.DataTable('#max-table')
  minTab = new dc.DataTable('#min-table')

  loadingFormat();
  updateFiltered();
  updateStation();
  updateSoundTime();
  updateSoundParm();
  updateSoundParmUnit();
  updateData();
  
  // Instantiate a hexchart object and run first chart update behind the scenes
  hexchart = new hexChart();
  updateHex(hexchart);

})
