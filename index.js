const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;


// middleware //
app.use(cors());
app.use(express.json());
// middleware //



// mongodb //
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wslenxe.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    // all collections //
    const userCollections = client.db('kingGalleryDB').collection('users');
    const categoriesCollection = client.db('kingGalleryDB').collection('categories');
    // all collections //

    // curd operation //

    // user related api //
    app.post('/api/v1/createUser', async(req, res) => {
        const user = req.body;
        const result = await userCollections.insertOne(user);
        res.send(result);
    })
    // user related api //

    // categories related api //
    app.get('/api/v1/getCategories', async(req, res) => {
      const categories = categoriesCollection.find();
      const result = await categories.toArray();
      res.send(result);
    })
    // categories related api //

    // curd operation //


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// mongodb //


app.get('/', (req, res) => {
  res.send('King Gallery is running!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})