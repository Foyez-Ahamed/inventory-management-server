const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
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
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    await client.connect();

    // all collections //
    const userCollections = client.db("kingGalleryDB").collection("users");

    const categoriesCollection = client
      .db("kingGalleryDB")
      .collection("categories");

    const reviewsCollection = client.db("kingGalleryDB").collection("reviews");

    const shopCollections = client.db("kingGalleryDB").collection("shops");

    const productCollections = client
      .db("kingGalleryDB")
      .collection("products");

    const cartCollections = client.db("kingGalleryDB").collection("carts");

    const salesCollections = client.db("kingGalleryDB").collection("sales");
    // all collections //

    // curd operation //

    // jwt verifyToken  //

    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded?.email;
      const find = await userCollections.findOne({ email: email });

      const isAdmin = find.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };

    const verifyManager = async (req, res, next) => {
      const email = req.decoded?.email;
      const find = await userCollections.findOne({ email: email });
      const isManager = find.role === "manager";
      if (!isManager) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };

    // jwt verifyToken  //

    // jwt related api //
    app.post("/api/v1/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "4h",
      });
      res.send({ token });
    });
    // jwt related api //

    // user related api //
    app.post("/api/v1/createUser", async (req, res) => {
      const users = req.body;
      const query = { email: users.email };
      const existingUser = await userCollections.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await userCollections.insertOne(users);
      res.send(result);
    });
    // user related api //

    // categories related api //
    app.get("/api/v1/getCategories", async (req, res) => {
      const categories = categoriesCollection.find();
      const result = await categories.toArray();
      res.send(result);
    });
    // categories related api //

    //  reviews related api //
    app.get("/api/v1/getReviews", async (req, res) => {
      const reviews = reviewsCollection.find();
      const result = await reviews.toArray();
      res.send(result);
    });
    //  reviews related api //

    // shop create related api //
    app.post("/api/v1/createShop", verifyToken, async (req, res) => {
      const shopInfo = req.body;

      shopInfo.limit = 3;

      const query = { ownerEmail: shopInfo.ownerEmail };

      const existingShop = await shopCollections.findOne(query);

      if (existingShop) {
        return res.send({
          message: "You have already create a shop",
          insertedId: null,
        });
      }

      const result = await shopCollections.insertOne(shopInfo);
      res.send(result);
    });

    // updated user info //
    app.patch("/api/v1/updateUserInfo/:email", async (req, res) => {
      const updateUserInfo = req.body;
      const email = req.params.email;
      const filter = { email: email };

      const updateUser = {
        $set: {
          role: updateUserInfo.role,
          shopName: updateUserInfo.shopName,
          shopLogo: updateUserInfo.shopLogo,
          shopId: updateUserInfo.shopId,
        },
      };

      const result = await userCollections.updateOne(filter, updateUser);

      res.send(result);
    });
    // updated user info //

    // get user admin data //
    app.get("/api/v1/user/admin/:email", async (req, res) => {
      const email = req.params.email;

      // if(email !== req.decoded.email){
      //   return res.status(403).send({message: 'forbidden access'})
      // }

      const query = { email: email };
      const user = await userCollections.findOne(query);

      let admin = false;

      if (user) {
        admin = user?.role === "admin";
      }
      res.send(admin);
    });
    // get user admin data //

    // get user manager data //
    app.get("/api/v1/user/manager/:email", async (req, res) => {
      const email = req.params.email;

      // if(email !== req.decoded.email){
      //   return res.status(403).send({message: 'forbidden access'})
      // }

      const query = { email: email };
      const user = await userCollections.findOne(query);

      let manager = false;

      if (user) {
        manager = user?.role === "manager";
      }
      res.send(manager);
    });
    // get user manager data //

    // shop create related api //

    // shop get related api //
    app.get("/api/v1/getUsers/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollections.findOne(query);
      res.send(result);
    });
    // shop get related api //

    // product post related api //

    app.post("/api/v1/createProduct", verifyToken, async (req, res) => {
      const products = req.body;

      const checkLimit = await shopCollections.findOne({
        _id: new ObjectId(products.shopId),
      });

      if (checkLimit.limit > 0) {
        const result = await productCollections.insertOne(products);
        res.send(result);
      } else {
        return res.send({
          message: "you have already cross your product added limit!",
          insertedId: null,
        });
      }
    });

    // decrease shop limit //

    app.patch("/api/v1/changeLimit/:shopId", async (req, res) => {
      const shopId = req.params.shopId;
      const checkLimit = await shopCollections.findOne({
        _id: new ObjectId(shopId),
      });

      const newLimit = checkLimit.limit - 1;

      const updateDoc = {
        $set: {
          limit: newLimit,
        },
      };

      const result = await shopCollections.updateOne(
        { _id: new ObjectId(shopId) },
        updateDoc
      );

      res.send(result);
    });

    // increase limit //
    app.patch("/api/v1/increaseLimit/:shopId", async (req, res) => {
      const shopId = req.params.shopId;
      const checkLimit = await shopCollections.findOne({
        _id: new ObjectId(shopId),
      });

      const newLimit = checkLimit.limit + 1;

      const updateDoc = {
        $set: {
          limit: newLimit,
        },
      };

      const result = await shopCollections.updateOne(
        { _id: new ObjectId(shopId) },
        updateDoc
      );

      res.send(result);
    });

    // increase product limit //
    app.patch("/api/v1/increaseProduct/:shopId", async (req, res) => {
      const shopId = req.params.shopId;
      const checkLimit = await shopCollections.findOne({
        _id: new ObjectId(shopId),
      });

      const increaseProduct = checkLimit.productsCount + 1;

      const updateDoc = {
        $set: {
          productsCount: increaseProduct,
        },
      };

      const result = await shopCollections.updateOne(
        { _id: new ObjectId(shopId) },
        updateDoc
      );

      res.send(result);
    });

    // decrease //
    app.patch("/api/v1/decreaseProduct/:shopId", async (req, res) => {
      const shopId = req.params.shopId;
      const checkLimit = await shopCollections.findOne({
        _id: new ObjectId(shopId),
      });

      const decreaseProduct = checkLimit.productsCount - 1;

      const updateDoc = {
        $set: {
          productsCount: decreaseProduct,
        },
      };

      const result = await shopCollections.updateOne(
        { _id: new ObjectId(shopId) },
        updateDoc
      );

      res.send(result);
    });

    // get products //
    app.get("/api/v1/getProducts/:email", verifyToken, verifyManager, async (req, res) => {
      const email = req.params.email;
      const query = { manager: email };
      const result = await productCollections.find(query).toArray();
      res.send(result);
    });

    app.get("/api/v1/getSingleProduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollections.findOne(query);
      res.send(result);
    });

    app.patch("/api/v1/updateProduct/:id", verifyToken, verifyManager, async (req, res) => {
      const product = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          productName: product.productName,
          productImage: product.productImage,
          productQuantity: product.productQuantity,
          location: product.location,
          productionCost: product.productionCost,
          profitMargin: product.profitMargin,
          discount: product.discount,
          productDetails: product.productDetails,
        },
      };

      const result = await productCollections.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/api/v1/deleteProduct/:id", verifyToken, verifyManager, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollections.deleteOne(query);
      res.send(result);
    });

    // cart elated api //
    app.post("/api/v1/createCarts", verifyToken, verifyManager, async (req, res) => {
      const cartInfo = req.body;
      const result = await cartCollections.insertOne(cartInfo);
      res.send(result);
    });

    app.get("/api/v1/getCarts/:email", verifyToken, verifyManager, async (req, res) => {
      const email = req.params.email;
      const query = { manager: email };
      const result = await cartCollections.find(query).toArray();
      res.send(result);
    });

    // sales related api //

    app.post("/api/v1/createSales", verifyToken, verifyManager, async (req, res) => {
      const sales = req.body;

      const query = {
        _id: {
          $in: sales?.cartIds?.map((id) => new ObjectId(id)),
        },
      };

      const insertSalesResult = await salesCollections.insertOne(sales);

      const deleteCartResult = await cartCollections.deleteMany(query);

      res.send({ insertSalesResult, deleteCartResult });
    });

    // update sales count //
    app.patch("/api/v1/increaseSalesCount/:id", async (req, res) => {
      const id = req.params.id;
      const product = await productCollections.findOne({
        _id: new ObjectId(id),
      });

      const increaseSalesCount = product?.saleCount + 1;
      const decreaseQuantity = product?.productQuantity - 1;

      const updateDoc = {
        $set: {
          saleCount: increaseSalesCount,
          productQuantity: decreaseQuantity,
        },
      };

      const result = await productCollections.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );

      res.send(result);
    });

    // get sales data //
    app.get("/api/v1/getSales/:email", verifyToken, verifyManager, async (req, res) => {
      const email = req.params.email;
      const query = { manager: email };
      const result = await salesCollections
        .find(query)
        .sort({ date : -1 })
        .toArray();
      res.send(result);
    });

    // shop related api //
    app.get("/api/v1/getShop", verifyToken, verifyAdmin, async (req, res) => {
      const shops = shopCollections.find();
      const result = await shops.toArray();
      res.send(result);
    });
    // curd operation //

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// mongodb //

app.get("/", (req, res) => {
  res.send("King Gallery is running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
