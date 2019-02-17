/**
 * Index.js
 */

const { Chart } = require('chart.js');

const GET_PAGES = 'http://localhost:3000/pages';
const GET_CLICK_DATA = `http://localhost:3000/click-data?page=`;

 window.onload = function() {
  fetch(GET_PAGES)
  .then(response => response.json())
  .then(pages => {
    let urls = pages.map(page => GET_CLICK_DATA + page);
    Promise.all(urls.map((url, index) => 
      fetch(url)
      .then(response => response.json())
      .then(data => {
        drawChart(pages[index], data);
      })
    ));
  });
 }

function drawChart(page, data) {
  let id = `${page}-line-chart`;
  createChartEl(id);

  const labels = data.times.map(time => new Date(time).toLocaleTimeString());
  const datasets = data.counts.map(eventCount => {
    return { 
      label: eventCount.event,
      data: eventCount.counts,
      borderColor: '#'+Math.floor(Math.random()*16777215).toString(16),
      fill: false
    };
  });

  new Chart(document.getElementById(id), {
    type: 'line',
    data: { labels, datasets },
    options: {
      title: {
        display: true,
        text: page
      }
    }
  });
}

function createChartEl(id) {
  let container = document.createElement('div');
  container.setAttribute('class', 'container');

  let canvas = document.createElement('canvas');
  canvas.setAttribute('id', id);

  container.appendChild(canvas);

  let el = document.getElementById('charts'); 
  el.appendChild(container);
}