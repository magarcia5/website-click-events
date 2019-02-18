/**
 * Index.js
 */

const { Chart } = require('chart.js');

const GET_PAGES = 'http://localhost:3000/pages';
const GET_CLICK_DATA = `http://localhost:3000/click-data?page=`;

// get list of pages and then click data for those pages
window.onload = function() {
  fetch(GET_PAGES)
  .then(response => response.json())
  .then(pages => getClickData(pages))
  .catch(err => handleRequestError(err));
}

/**
 * Fetches click data for each page and then draw line chart for each
 * 
 * @param {Array} pages list of page names
 */
function getClickData(pages) {
  let urls = pages.map(page => GET_CLICK_DATA + page);

  Promise.all(urls.map((url, index) => 
    fetch(url)
    .then(response => response.json())
    .then(clickData => drawChart(pages[index], clickData))
    .catch(err => handleRequestError(err))
  ));
}

/**
 * Format data from request and draw the line chart
 * 
 * @param {String} page page the click data is for
 * @param {Array} data click data i.e.
 *    { 
*       event: event_name, 
 *      counts: [1, 2, 0, 4,...] 
 *    }
 */
function drawChart(page, data) {
  let id = `${page}-line-chart`;

  createChartEl(id);

  const labels = data.times.map(time => new Date(time).toLocaleTimeString());
  const datasets = data.counts.map(eventCount => {
    return { 
      label: eventCount.event,
      data: eventCount.counts,
      // random hex color for line
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

/**
 * Create and insert div and canvas DOM els in which to render the chart
 * 
 * @param {String} id attribute id name to give to the canvas el
 */
function createChartEl(id) {
  const container = document.createElement('div');
  container.setAttribute('class', 'container');

  const canvas = document.createElement('canvas');
  canvas.setAttribute('id', id);

  container.appendChild(canvas);

  const el = document.getElementById('charts'); 
  el.appendChild(container);
}

/**
 * Renders request error message
 * 
 * @param {String} err error message
 */
function handleRequestError(err) {
  const errorDiv = document.getElementById('error-message');

  errorDiv.innerHTML = 'Error retrieving data: ' + err;
}