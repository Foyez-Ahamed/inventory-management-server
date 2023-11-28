const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
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

    const reviewsCollection = client.db('kingGalleryDB').collection('reviews');

    const shopCollections = client.db('kingGalleryDB').collection('shops');

    const productCollections = client.db('kingGalleryDB').collection('products');
    // all collections //

    // curd operation //

    // jwt related api //
    app.post('/api/v1/jwt', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '4h'});
      res.send({token});
    })
    // jwt related api //

    // user related api //
    app.post('/api/v1/createUser', async(req, res) => {
        const users = req.body;
        const query = {email : users.email};
        const existingUser = await userCollections.findOne(query);
        if(existingUser){
        return res.send({message : 'user already exist', insertedId : null});
        }
        const result = await userCollections.insertOne(users);
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

    //  reviews related api //
    app.get('/api/v1/getReviews', async(req, res) => {
      const reviews = reviewsCollection.find();
      const result = await reviews.toArray();
      res.send(result);
    })
    //  reviews related api //

    // shop create related api //
    app.post('/api/v1/createShop', async(req, res) => {
      const shopInfo = req.body;

      shopInfo.limit = 3;

      const query = { ownerEmail : shopInfo.ownerEmail};

      const existingShop = await shopCollections.findOne(query);

      if(existingShop) {
        return res.send({message : 'You have already create a shop', insertedId : null});
      }

      const result = await shopCollections.insertOne(shopInfo);
      res.send(result);

    })

    // updated user info //
    app.patch('/api/v1/updateUserInfo/:email', async(req, res) => {
      const updateUserInfo = req.body;
      const email = req.params.email
      const filter = {email : email}

      const updateUser = {
        $set : {
          role : updateUserInfo.role,
          shopName : updateUserInfo.shopName,
          shopLogo : updateUserInfo.shopLogo,
          shopId : updateUserInfo.shopId
        }
      }

      const result = await userCollections.updateOne(filter, updateUser);

      res.send(result);

    })
    // updated user info //

    // get user admin data //
    app.get('/api/v1/user/admin/:email', async(req, res) => {
      const email = req.params.email;

      // if(email !== req.decoded.email){
      //   return res.status(403).send({message: 'forbidden access'})
      // }

      const query = {email : email}
      const user = await userCollections.findOne(query)

      let admin = false;

      if(user) {
        admin = user?.role === 'admin'
      }
      res.send({admin});
    })
    // get user admin data //

    // get user manager data //
    app.get('/api/v1/user/manager/:email', async(req, res) => {
      const email = req.params.email;

      // if(email !== req.decoded.email){
      //   return res.status(403).send({message: 'forbidden access'})
      // }

      const query = {email : email}
      const user = await userCollections.findOne(query)

      let manager = false;

      if(user) {
        manager = user?.role === 'manager'
      }
      res.send({manager});
    })
    // get user manager data //

    // shop create related api //

    // shop get related api //
    app.get('/api/v1/getUsers/:email', async(req, res) => {
      const email = req.params.email 
      const query = {email : email}
      const result = await userCollections.findOne(query)
      res.send(result)
    })
    // shop get related api //

    // product post related api //

    app.post('/api/v1/createProduct', async(req, res) => {
      const products = req.body

      const checkLimit = await shopCollections.findOne({_id: new ObjectId(products.shopId)})

      if(checkLimit.productsCount < checkLimit.limit) {
        const result =  await productCollections.insertOne(products)
        res.send(result)
      } else {
         return res.send({message : 'you have already cross your product added limit!', insertedId : null})
      }
    })

    // decrease shop limit //

    app.patch('/api/v1/changeLimit/:shopId', async(req, res) => {
      const shopId = req.params.shopId
      const checkLimit = await shopCollections.findOne({_id: new ObjectId(shopId)})

      const newLimit = checkLimit.limit - 1

      const updateDoc = {
        $set : {
          limit : newLimit
        }
      }

      const result = await shopCollections.updateOne({_id: new ObjectId(shopId)}, updateDoc)

      res.send(result)

    })

    // increase product limit //
    app.patch('/api/v1/increaseProduct/:shopId', async(req, res) => {
      const shopId = req.params.shopId
      const checkLimit = await shopCollections.findOne({_id: new ObjectId(shopId)})

      const increaseProduct = checkLimit.productsCount + 1

      const updateDoc = {
        $set : {
          productsCount : increaseProduct
        }
      }

      const result = await shopCollections.updateOne({_id: new ObjectId(shopId)}, updateDoc)

      res.send(result)
    })



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