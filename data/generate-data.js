/**
 * This script generates click events and populates the postgres
 * database with events from the last 24 hours
 * 
 * The clicks events are tracked by time, page, and event name
 *  i.e. { 2019-02-14 23:24:47, home_page, faq_link }
 * 
 */

const { Client } = require('pg');
const { CONNECTION_PARAMETERS } = require('../config/conf_db');

 // Test data values. These just give you an idea of the types of events
 // and is by no means exhaustive.
const PAGE_EVENTS = [
  {
    name: 'home_page',
    events: ['learn_more_link', 'sign_up_button', 'contact_link']
  },
  {
    name: 'sign_up_page',
    events: ['form_submit_button', 'cancel_button', 'home_link']
  },
  {
    name: 'contact_page',
    events: ['form_submit_button', 'cancel_button', 'open_chat_button', 'copy_phone_number_button']
  },
  {
    name: 'faq_page',
    events: ['expand_q1_arrow_button', 'expand_q2_arrow_button', 'contact_button']
  }
];

const NUM_EVENTS_TO_GENERATE = 100;

const client = new Client(CONNECTION_PARAMETERS);

client.connect((err) => {
  if (err) {
    console.error('connection error. please retry.', err.stack)
    process.exit(1);
  } 
});

const NOW = new Date();

const oneDayAgoMilliseconds = new Date(NOW).setDate(NOW.getDate() - 1);
const ONE_DAY_AGO = new Date(oneDayAgoMilliseconds);

let q = `
  DROP TABLE test_table; 
  CREATE TABLE test_table (time timestamp not null, page text not null, event text not null); 
  INSERT INTO test_table (time, page, event) VALUES `;

// create query to generate NUM_EVENTS_TO_GENERATE event occurences 
// with random time for each event
PAGE_EVENTS.forEach(page => {
  page.events.forEach(event => {
    for(let i = 0; i < NUM_EVENTS_TO_GENERATE; i++) {
      const date = randomDate(NOW, ONE_DAY_AGO);
      q = q.concat(`(\'${date}\', \'${page.name}\', \'${event}\'),`);
    }
  });
});
// remove last comma
q = q.slice(0,-1);
q = q.concat(';');

client.query(q)
  .then(() => {
    console.log("Your data has been created.");
    client.end()
  })
  .catch(err => {
    console.log(err);
    client.end();
  });


/**
 * Generate random date between start and end day with random hour
 * 
 * @param {Date} start start date
 * @param {Date} end end date
 * @returns date formatted for postgres db
 */
function randomDate(start, end) {
  var date = new Date(+start + Math.random() * (end - start));
  var hour = Math.random() * 23 | 0;
  date.setHours(hour);
  
  // format for postgres db i.e. 2019-02-15 20:35:15
  return date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

