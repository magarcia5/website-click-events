# Click Events

## Solution Summary

### Scenario

I would like to see the number of events that occurred in the past 24 hours on each page of my website. For this solution I focused on click events only.

### Approach

In order to keep track click events, we need the time the event happened, the page on which it happened, and the name of the event. We can populate a postgres table with this information. We'll need to dynamically generate a number of events that occurred in the last 24 hours so the UI will populate.

Our backend needs to connect to the database and query the table for the event count by page per hour. We then need to set up some APIs so we can send the data to the client.

The client then needs to request the data and draw a line chart for each page with the click event counts for the events on that page.

### Solution

1. I set up a Digital Ocean [managed PostgresSQL database](https://www.digitalocean.com/docs/databases/overview/).

2. Next, I wrote a scipt to create a table and dynamically generate rows of data in the following format:

```
{ '02-15-2019 16:45:23', 'home_page', 'button_click' } 
```

3. Now that I had a table full of data, I needed to determine how to retrieve the page names.
  * I retrieved the event counts per page by counting the rows with events for a given page between a given time range:
  ```
      SELECT event, COUNT(*) AS count FROM
        (SELECT * FROM 
          (SELECT * FROM test_table WHERE time BETWEEN ${start} AND ${end})  
        AS time_range WHERE page=${page})
      AS events GROUP BY 1;
  ```
  The time range I used was hourly for the 24 hours previous to time the query was made. For example, if the query is made at 8pm, the time range would be 9pm yesterday to 8pm today.
  * To retrieve the pages with events, I did a `SELECT DISTINCT` query of the page column.

4. Next was to determine how to supply this information to the client. I thought of two separate approaches. 
  * The first was to just write one API and send all the data for all the pages in one response. 
  * The second was to write two APIs, one for retrieving the pages, and another for retrieving count information for a page. 
  I went with the second because it has better potential for extensibility and leaves the client free to decide what specific data it wants. Also, click events for different pages are conceptually separate information and makes more sense retrieved separately.

5. Next was to format the data in a way the client can use it. When the data was returned from the db, it was an array of `Result` objects, one for each time range:

  ``` 
  {
    ...
    rows: [
      { event: event_name, count: 10 },
      { event: another_event, count: 11}
    ],
    ...
  }
  ```

  There were a few issues that needed to addressed:
  * Not all results returned each event if there were no events in that time range
  * The results were not tied to the time range it was associated with
  * The client needed a list of counts for each event

  So I made the following transformations:
  * Get the names of distinct events and create an object with the event name and an array with 24 0's. Then I traversed the results and inserted the counts into the corresponding events in the corresponding indexes so that data looked like:
  ```
    [
      { event: event_name, counts: [1, 2, 0, 4, ...] },
      ...
    ]
  ```
  This took care of the empty values for some hours and now there was a list of counts as required by the client.
  * When building the query for the counts, I also built a list of the times I was using in the query string and returned that along with the query:
  ```
    [ '02-15-2019 20:00:00','02-15-2019 20:00:00', ...]
  ```
  I returned both the list of times, and the list of counts as part of the `/click-data` API.

  The `/pages` API returned a simple list of page names i.e. `[home_page, faq_page, ...]`.

6. Last was to make the requests on the client and draw the line charts. This involved querying `/pages` and using the data to query for each `/click-data?page=page_name` request. Once the data was returned, using Chart.js, I set the x-axis labels to the times, and the datasets to the count arrays.

### Concerns

There are a few issues I didn't address but could make interesting future projects:
  * In the interest of time, I made event data strictly random and as such, the generated charts don't tell a very interesting story. A better solution would have been to generate more events in potential high-traffic time windows, like 9am-5pm.
  * Sometimes the random colors generated for the lines don't contrast very well so the lines aren't as easy to tell apart. A better solution would be to identify more contrasting colors and to use those.
  * The data in the db only updates on `npm run build`, so if you don't run that command for a while, all the events drop off as the selected time window moves past the window of generated results.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

1. [Node](https://nodejs.org/en/download/)

### Installing

Download dependencies.

```
npm install
```

Build app and populate db.

```
npm run build
```

Start server.
```
npm run start
```

Run the development watch tools with
```
npm run watch
```

Visit the site at http://127.0.0.1:3000/.

* You will see a line chart for each page with events for that page.


## Built With

* [ES6](https://github.com/lukehoban/es6features)
* [Browserify](http://browserify.org/) - JS Compiler
* [Chart.js](https://www.chartjs.org/) - chart technology
* [Express](https://expressjs.com/)
* [pg](https://github.com/brianc/node-postgres) - postgres db connector