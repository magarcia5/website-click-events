const express = require('express');
const app = express();
const http = require('http').Server(app);
const { Client } = require('pg');
const { CONNECTION_PARAMETERS } = require('./config/conf_db');

// set public directory
app.use(express.static(__dirname));

// serve page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

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

/**
 * select event, count(*) as ct from 
 *  (select * from 
 *    (select * from test_table where time between '02-15-2019 8:00:00' and '02-15-2019 9:00:00') 
 *  as timerange where page='home_page') 
 * as events group by 1;
 */
const getPagesQuery = 'SELECT DISTINCT page FROM test_table;';

let now = new Date();
now = new Date(now.setMinutes(00,00));
let oneDayAgo = new Date(now).setDate(now.getDate() - 1);
oneDayAgo = new Date(oneDayAgo);

retrieveClickData();
function retrieveClickData() {
  client.query(getPagesQuery, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      let q = getClicksForPages(res.rows);
      client.query(q, (err, res) => {
        if (err) {
          // do some error stuff
        } else {
          res.forEach(r => console.log(r));
        }
        client.end();
      });
    }
  });
}

function getClicksForPages(rows) {
  let query = '';
  rows.forEach(row => {
    query = query.concat(getClicksPerHour(row.page));
  });
  return query;
}

function getClicksPerHour(page) {
  let query = '';
  let currTime = oneDayAgo;
  console.log('QUERY FOR PAGE: ' + page);

  while (currTime < now) {
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

  return query;
}

function addHour(currTime) {
  return new Date(currTime.setHours(currTime.getHours() + 1));
}

function formatTime(time) {
  return time.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}