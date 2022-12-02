const connectToMongo = require("./db");
const express = require("express");
const cors = require("cors");

connectToMongo();

require('dotenv/config');

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use("/images", express.static("./images"))
//Available routes
app.use('/api/auth', require("./routes/auth")) //Route for user SignUp, LogIn
app.use('/api/blog', require("./routes/blog")) //Route for Blog- Create, Fetch, Edit, Delete

app.listen(port, () => {
    console.log(`blog-site backend deployed on port ${port}`);
})

