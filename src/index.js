/**
 * Index.js
 */

const { Chart } = require('chart.js');

 window.onload = function() {
  fetch('http://localhost:3000/click-data?page=faq_page')
  .then(response => response.json())
  .then(data => drawCharts(data));
 }

function drawCharts(data) {
  let canvas = document.createElement('canvas');
  canvas.setAttribute('id', 'line-chart');
  let el = document.getElementById('charts-container'); 
  el.appendChild(canvas);

  const xAxis = data.times;
  const datasets = data.counts.map(eventCount => {
    return { 
      label: eventCount.event,
      data: eventCount.counts,
      borderColor: '#'+(Math.random()*0xFFFFFF<<0).toString(16),
      fill: false
    };
  });
  console.log(datasets);

  new Chart(document.getElementById("line-chart"), {
    type: 'line',
    data: {
      labels: xAxis,
      datasets
    },
    options: {
      title: {
        display: true,
        text: 'Clicks per hour'
      }
    }
  });
}