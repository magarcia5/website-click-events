const express = require('express');
const app = express();
const http = require('http').Server(app);
const { Client } = require('pg');
const { CONNECTION_PARAMETERS } = require('./config/conf_db');

const HOURS_TO_QUERY = 24;

// set public directory
app.use(express.static(__dirname));

// serve page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, () => {
  console.log('Visit the UI at http://localhost:3000');
});

/**
 * API
 */
app.get('/pages', (req, res) => getPages(res));

app.get('/click-data', (req, res) => {
  if (!req.query.page) {
    res.status(400);
    res.send('Missing page argument');
  } else {
    return getEvents(req.query.page, res);
  }
});

/**
 * Db retrieval and processing
 */
const CLIENT = new Client(CONNECTION_PARAMETERS);

const DB_ERROR = 'The server is currently unable to handle this request. Please try again later.';

const GET_PAGES_QUERY = 'SELECT DISTINCT page FROM test_table;';

let NOW = new Date();
NOW = new Date(NOW.setMinutes(00,00));

let ONE_DAY_AGO = new Date(NOW).setDate(NOW.getDate() - 1);
ONE_DAY_AGO = new Date(ONE_DAY_AGO);

CLIENT.connect()
  .catch((err) => {
    console.error('connection error. please retry.', err.stack);
    process.exit(1);
  });

/**
 * Retrieves page names from db and sends the response
 * 
 * @param {Object} resp express response to be sent
 */
function getPages(resp) {
  CLIENT.query(GET_PAGES_QUERY)
    .then(res => {
      let pages = [];
      res.rows.forEach(row => pages.push(row.page));
      resp.send(pages);
    })
    .catch(err => handleDbError(resp, err));
}

/**
 * Retrieves event counts from db and sends the formatted count data
 * and time windows that were retreived. The response data will 
 * look like:
 *  {
 *    times: [ '02-15-2019 10:00:00', ...],
 *    counts: [
 *      { event: event_name, counts: [ 3, 5, 10, 0, ... ]}
 *    ]
 *  }
 * 
 * @param {String} page page name to get data for
 * @param {Object} resp express response to be sent
 */
function getEvents(page, resp) {
  const { times, query } = getClicksPerHour(page);

  CLIENT.query(query)
    .then(res => resp.send({
      times, 
      counts: getEventCounts(res)
    }))
    .catch(err => handleDbError(resp, err));
}

/**
 * Returns pretty error to client and logs server error to console
 * 
 * @param {Object} resp express response to be sent
 * @param {Object} err server error
 */
function handleDbError(resp, err) {
  console.log(err);
  resp.status(500);
  resp.send(DB_ERROR);
}

/**
 * Extract event counts for each hour for each event from db
 * 
 * @param {Array} result result objects from db
 * @returns array of event count objects i.e.
 *  [ { event: event_name, counts: [1, 2, 3, ...] }, ... ]
 */
function getEventCounts(result) {
  let eventCounts = {};

  // create count array with all 0 values. This way if there is no data
  // for a specific hour there will be a count of 0.
  getDistinctEvents(result).forEach(event => {
    eventCounts[event] = new Array(HOURS_TO_QUERY).fill(0,0);
  });

  // retrieves count for each page for each event 
  result.forEach((res, index) => {
    res.rows.forEach(eventCount => {
      eventCounts[eventCount.event][index] = parseInt(eventCount.count);
    });
  });
  
  // format to return to client
  let eventCountArray = [];
  for (let event in eventCounts) {
    if (eventCounts.hasOwnProperty(event)) {
      eventCountArray.push({
        event,
        counts: eventCounts[event]
      })
    }
  }

  return eventCountArray;
}

/**
 * Get list of all events for which there is data in the db
 * 
 * @param {Array} result result objects from db
 * @returns array of events
 */
function getDistinctEvents(result) {
  let events = [];

  result.forEach(res => {
    res.rows.forEach(eventCount => {
      if (events.indexOf(eventCount.event) < 0) {
        events.push(eventCount.event);
      }
    });
  });

  return events;
}

/**
 * Constructs a query for event counts for the last 24 hours
 * as well as a list of the times that are being queried
 * 
 * @param {String} page page name to query for
 * @returns object with list of times and db query
 */
function getClicksPerHour(page) {
  let query = '';
  let currTime = ONE_DAY_AGO;
  let times = [];

  while (currTime < NOW) {
    let oneHourLater =  addHour(new Date(currTime));

    times.push(currTime);

    query = query.concat(`
      SELECT event, COUNT(*) AS count FROM
        (SELECT * FROM 
          (SELECT * FROM test_table WHERE time BETWEEN \'${formatTime(currTime)}\' AND \'${formatTime(oneHourLater)}\')  
        AS time_range WHERE page='${page}')
      AS events GROUP BY 1;
    `);
  
    currTime = oneHourLater;
  }

  return { times, query };
}

/**
 * Helper function to add one hour to the given time
 * 
 * @param {Date} currTime time to add the hour to
 * @returns new Date object
 */
function addHour(currTime) {
  return new Date(currTime.setHours(currTime.getHours() + 1));
}

/**
 * Helper function to format the Date object to the format to expected
 * of the postgres table
 * 
 * @param {Date} time
 * @returns formatted date
 */
function formatTime(time) {
  return time.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}