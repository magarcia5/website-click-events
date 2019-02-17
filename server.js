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

app.get('/pages', (req, res) => getPages(res));

app.get('/click-data', (req, res) => {
  return retrieveClickData(req.query.page, res);
})

http.listen(3000, () => {
  console.log('Visit the UI at http://localhost:3000');
});

const client = new Client(CONNECTION_PARAMETERS);

client.connect((err) => {
  if (err) {
    console.error('connection error. please retry.', err.stack)
    process.exit(1);
  } else {
    console.log('connected');
  }
});

const getPagesQuery = 'SELECT DISTINCT page FROM test_table;';

let now = new Date();
now = new Date(now.setMinutes(00,00));
let oneDayAgo = new Date(now).setDate(now.getDate() - 1);
oneDayAgo = new Date(oneDayAgo);

function getPages(resp) {
  client.query(getPagesQuery, (err, res) => {
    if (err) {
      // do some error stuff
      console.log(err);
    } else {
      let pages = [];
      res.rows.forEach(row => pages.push(row.page));
      resp.send(pages);
    }
  });
}

function retrieveClickData(page, resp) {
  const results = [];
  const { times, query } = getClicksPerHour(page);
  client.query(query, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      resp.send(getEventCounts(res));
    }
  });
}

function getEventCounts(result) {
  let eventCounts = {};
  let distinctEvents = getDistinctEvents(result);
  distinctEvents.forEach(event => {
    eventCounts[event] = new Array(HOURS_TO_QUERY).fill(0,0);
  });

  result.forEach((res, index) => {
    res.rows.forEach(eventCount => {
      eventCounts[eventCount.event][index] = parseInt(eventCount.count);
    });
  });
  
  return eventCounts;
}

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

function getClicksPerHour(page) {
  let query = '';
  let currTime = oneDayAgo;
  let times = [];

  while (currTime < now) {
    times.push(currTime);
    let oneHourLater =  addHour(new Date(currTime));
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

function addHour(currTime) {
  return new Date(currTime.setHours(currTime.getHours() + 1));
}

function formatTime(time) {
  return time.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}