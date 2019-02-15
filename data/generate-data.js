/**
 * This script generates click events and populates the local postgres
 * database. There must be postgres installed on the machine.
 * 
 * The clicks events are tracked by time, page, and event name
 *  i.e. {2019-02-14T23:24:47.524,home_page,faq_link}
 * 
 */

const { Client } = require('pg');

const CONNECTION_PARAMETERS = {
  user: "doadmin",
  password: "dw28t2fj31o21yba",
  database: "defaultdb",
  port: 25060,
  host: "mels-db-postgresql-nyc1-do-user-4808586-0.db.ondigitalocean.com",
  ssl: true
};

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

const now = new Date();
let oneDayAgo = new Date(now).setDate(now.getDate() - 1);
oneDayAgo = new Date(oneDayAgo);

//`INSERT INTO 
//   test_table (time, page, event)  
//   VALUES (\'02-15-2019 10:23:00\', \'home_page'\, \'learn_more_link\'),
//          (\'02-15-2019 8:23:00\', \'sign_up_page'\, \'submit_form_button\'),
//          (\'02-15-2019 9:13:00\', \'home_page'\, \'learn_more_link\')`;
let q = 'INSERT INTO test_table (time, page, event) VALUES ';

PAGE_EVENTS.forEach(page => {
  const events = page.events;
  events.forEach(event => {
    for(let i = 0; i < NUM_EVENTS_TO_GENERATE; i++) {
      const date = randomDate(now, oneDayAgo, 0, 23);
      q = q.concat(`(\'${date}\', \'${page.name}\', \'${event}\'),`);
    }
  });
});
// remove last comma
q = q.slice(0,-1);
q = q.concat(';');

client.query(q, (err, res) => {
  if (err) console.log(err);
  console.log(res)
  client.end()
});

function randomDate(start, end, startHour, endHour) {
  var date = new Date(+start + Math.random() * (end - start));
  var hour = startHour + Math.random() * (endHour - startHour) | 0;
  date.setHours(hour);
  
  // format for postgres db i.e. 2019-02-15 20:35:15
  return date.toISOString().replace(/T/, ' ').replace(/\..+/, '');;
}

