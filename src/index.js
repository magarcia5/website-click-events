fetch('http://localhost:3000/click-data?page=faq_page')
  .then(data => console.log(data.json()));