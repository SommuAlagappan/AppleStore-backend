const express = require("express");
const mongodb = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
const URL = process.env.DB;
const DB = "applestore";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);


// Post product
app.post("/product",  async function (req, res) {
  try {
    // Step1: Create a connection between Nodejs and MongoDB
    const connection = await mongoClient.connect(URL);

    // Step2: Select the DB
    const db = connection.db(DB);

    // Step3: Select the collection
    // Step4: Do the operation (Create,Read,Update and Delete)
    await db.collection("products").insertOne(req.body);

    // Step5: Close the connection
    await connection.close();
    res.status(200).json({ message: "Product inserted successfully" });
  } catch (error) {
    console.log(error);
    //If any error throw error
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Get products
app.get("/products",  async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);

    const db = connection.db(DB);

    let resProduct = await db.collection("products").find().toArray();

    await connection.close();

    res.json(resProduct);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Get productbyID
app.get("/product/:id",  async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);

    const db = connection.db(DB);

    let resUser = await db
      .collection("products")
      .findOne({ _id: mongodb.ObjectId(req.params.id) });

    await connection.close();

    res.json(resUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

//Put product
app.put("/product/:id",  async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);

    const db = connection.db(DB);

    let resUser = await db
      .collection("products")
      .findOneAndUpdate(
        { _id: mongodb.ObjectId(req.params.id) },
        { $set: req.body }
      );

    await connection.close();

    res.json({ message: "Product details updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

//Delete product
app.delete("/product/:id",  async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);

    const db = connection.db(DB);

    let resUser = await db
      .collection("products")
      .findOneAndDelete({ _id: mongodb.ObjectId(req.params.id) });

    await connection.close();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

//Register user
app.post("/register", async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db(DB);

    let salt = await bcrypt.genSalt(10);
    // console.log(salt)
    let hash = await bcrypt.hash(req.body.password, salt);
    // console.log(hash)
    req.body.password = hash;

    await db.collection("users").insertOne(req.body);
    await connection.close();
    res.json("User registered successfully");
  } catch (error) {
    console.log(error);
    res.json(error);
  }
});

//Login User
app.post("/login", async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db(DB);

    let user = await db
      .collection("users")
      .findOne({ emailAddress: req.body.emailAddress });

    if (user) {
      let compare = await bcrypt.compare(req.body.password, user.password);
      if (compare) {
        let token = jwt.sign({ _id: user._id }, process.env.SECRET, {
          expiresIn: "1h",
        });
        res.json({ token });
      } else {
        res.status(401).json({ message: "Username or Password is incorrect" });
      }
    } else {
      res.status(401).json({ message: "Username or Password is incorrect" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("Something went wrong");
  }
});

app.listen(process.env.PORT || 3001);
