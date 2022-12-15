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

 //Authenticate
 let authenticate = (req, res, next) => {
  // console.log(req.headers)
  if (req.headers.authorization) {
    try {
      let decode = jwt.verify(req.headers.authorization, process.env.SECRET);
      if (decode) {
        next();
      }
    } catch (error) {
      console.log(error);
      res.status(401).json("Unauthorised");
    }
  } else {
    res.status(401).json("Unauthorised");
  }
};

// Get products
app.get("/products", authenticate,  async function (req, res) {
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
app.get("/product/:id", authenticate,  async function (req, res) {
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


//Register user
app.post("/register",  async function (req, res) {
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
