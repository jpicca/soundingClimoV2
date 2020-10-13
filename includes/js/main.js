// Initialize the data manager
var dm = d3Edge.dataManager();
var chart = new tsChart($("#line-chart").width())
var chart2 = new bChart($("#bar-chart").width())
var chart3 = new rChart($("#obs-count").width())
var chart4 = new tabChart($("#max-table").width())
var chart5 = new tabChart($("#min-table").width())

// Create a global variable for our hexchart
// Don't instantiate it until the doc is ready though
var hexchart;

// Instantiate dc Chart
//const timeSeries = new dc.LineChart('#line-chart')
var timeSeries = new dc.CompositeChart('#line-chart')
var hist = new dc.BarChart('#bar-chart')
var range = new dc.BarChart('#obs-count')
var maxTab = new dc.DataTable('#max-table')
var minTab = new dc.DataTable('#min-table')

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
      
      // If newTime is coerced to int, it'll be 0 or 12; otherwise 'all' is changed to NaN
      // Time is all
      if (isNaN(newTime)) {

        // Need to make sure we've created the right quantiles before any filter changes
        await dm.createDefaultQuantiles(false);

        // Clear the time filters
        dm.getUserDim().filter();

        // Redraw all charts (except for time series)
        dc.redrawAll();

        // Update time series chart with original dimension / group
        dm.updateTSGroup();

      } 
      // Time is 00 or 12
      else {
        
        // Need to make sure we've created the right quantiles before any filter changes
        await dm.createDefaultQuantiles(false);

        // Filter for the proper hour
        dm.getUserDim().filter(d => { return d.getHours() == newTime });
        
        // Redraw all charts (except time series... sort of)
        dc.redrawAll();

        // Time series has to use a special function that utilizes temp crossfilters/dimensions
        dm.updateTSGroup();
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

$(document).ready(function() {

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
