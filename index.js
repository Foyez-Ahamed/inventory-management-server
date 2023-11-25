const express = require('express')
const app = express()
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;


// middleware //
app.use(cors());
app.use(express.json());
// middleware //

app.get('/', (req, res) => {
  res.send('King Gallery is running!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})