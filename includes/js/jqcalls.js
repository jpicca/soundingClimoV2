// Change station via menu
$("#stn").on("change", stationChange);

function stationChange() {

  // Clear any locked/highlighted data
  clearLock();

  // Decrease opacity of plots while new data is processing
  loadingFormat();

  // A couple calls to update map formatting
  d3.select('.selSite').classed('selSite',false);
  d3.select(`#${$("#stn").val()}`).classed('selSite',true);

  updateStation();
  updateData(false);

  updateHex(hexchart);

}

// On Time Change
$("#soundingtimes input[type='radio']").on("change", function() {

  // Clear any locked/highlighted data
  clearLock();

  updateSoundTime();

  refreshChart('time');
});

// On Filtered Change
$("#raw-vs-filter input[type='radio']").on("change", function() {

  // Clear any locked/highlighted data
  clearLock();

  loadingFormat();
  updateFiltered();
  updateData(false);
});

// Change Parameter
$("#sndparam").on("change", function() {

  let parm = $('#sndparam option:selected').val().toLowerCase();
  let canFilter = $.inArray(parm,dm.get0List())

  // Only enable the 0 filter checkbox if it's filterable parm
  // and make sure box is unchecked if it's not filterable
  if (canFilter == -1) {
    $('#filter0').prop('checked',false);
    $('#filter0').attr('disabled',true);
  } else {
    $('#filter0').attr('disabled',false);
  }

  // Clear the y-axis input boxes
  $('#ymax').val('')
  $('#ymin').val('')

  // Clear the filter input boxes
  $('#filterMin').val('')
  $('#filterMax').val('')

  if (parm != "pass") {

    // Clear any locked/highlighted data
    clearLock();

    loadingFormat();

    updateSoundParm();
    updateSoundParmUnit();
    updateData(false);
  };
});

// Change in yaxis values
$("#ymax, #ymin").on("change", function() {

  // Clear any locked/highlighted data
  clearLock();

  loadingFormat();

  refreshChart('yaxis');

});

// On moving average change
$("#movave").on("change", function() {

  // Clear any locked/highlighted data
  clearLock();

  updateSmoothPeriod();
  $("#movave").val(dm.smoothPeriod())  // Update displayed value to new period
  updateData(false);
});

// Variable filter
$("#filterMin").on("change", function() {

  // Clear any locked/highlighted data
  clearLock();

  updateData(false);
});

$("#filterMax").on("change", function() {
  
  // Clear any locked/highlighted data
  clearLock();

  updateData(false);
});

// Only display moving averages
$("#dateplot").on("change", function() {

  // Clear any locked/highlighted data
  clearLock();

  if ($("#dateplot").prop("checked")) {
    $(".sub._1").hide();
    $(".sub._5").hide();
    $(".sub._8").hide();
  } else {
    $(".sub._1").show();
    $(".sub._5").show();
    $(".sub._8").show();
  };
});

// Show Help
$("#showinfo").on("click", function() {
  window.open('climoplotinfo.html', 'HELP', "width=800, height=600, top=100, left=300");
});

// The checkbox for plotting observations is controlled in the main.js file.
// This is because this routine must be called after the plotObs function is defined.

// Map controls
$('#map-container button').on("click", () => {
  $('#map-container').hide();
})

$('#showMap').on("click", () => {
  $('#map-container').show();
})

// hex chart controls
$('#hide-hex').on("click", () => {
  $('#chart-container').hide();
})

$('#month-min').on("change", () => {
  
  // Get value of month
  let month = d3.select("#month-min").property('value')
  let sel = d3.select('#day-min')

  // Update the day menu
  if (["04","06","09","11"].includes(month)) { 
    
    sel.select('option[value="31"]').property('disabled',true);
  } else if (month == "02") {
    
    sel.select('option[value="31"]').property('disabled',true);
    sel.select('option[value="30"]').property('disabled',true);
  } else {

    sel.selectAll('option').property('disabled',false);
  }

})

$('#month-max').on("change", () => {
  
  // Get value of month
  let month = d3.select("#month-max").property('value')
  let sel = d3.select('#day-max')

  // Update the day menu
  if (["04","06","09","11"].includes(month)) { 
    
    sel.select('option[value="31"]').property('disabled',true);
  } else if (month == "02") {
    
    sel.select('option[value="31"]').property('disabled',true);
    sel.select('option[value="30"]').property('disabled',true);
  } else {

    sel.selectAll('option').property('disabled',false);
  }

})

$('#chartBtn').on("click", () => {

  $('#chart-container').show();
    
});

$('#obsBtn').on("click", () => {

  // Which observation to make visible
  let idx = 0;

  switch(dm.getSoundTime()) {
    case '00z':
      idx = 1;
      break;
    case '12z':
      idx = 2;
      break;
    case 'all':
      let curDate = getCurDate();
      if (curDate.getUTCHours() < 1) { idx = 2; }
      else if (curDate.getUTCHours() < 13) { idx = 1; }
      else { idx = 2 };
      break;
  }

  let circle = d3.select(`path.symbol:nth-child(${idx})`)
  
  try {
    if (circle.style('visibility') == 'hidden') {
      circle.style('visibility','visible');
    } else {
      circle.style('visibility','hidden');
    }
  } catch(err) {
    alert('No observation available at this time!')
  }
})

// Stop default action of dropdown closing when clicking on dropdown element
$('#hex-drop .dropdown-menu').on({
  "click":function(e) {
      e.stopPropagation();
   }
});

// Click update data to change hexbin
$("#hex-update").on("click", function () {
  updateHex(hexchart);
})

// Show Help
$("#showinfo").on("click", function() {
  window.open('climoplotinfo.html', 'HELP', "width=800, height=600, top=100, left=300");
});
