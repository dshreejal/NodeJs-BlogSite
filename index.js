const connectToMongo = require("./db");
const express = require("express");
const cors = require("cors");

connectToMongo();

require('dotenv/config');

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

//Available routes
app.use('/api/auth', require("./routes/auth")) //Route for user SignUp, LogIn


app.listen(port, () => {
    console.log(`blog-site backend deployed on port http://localhost:${port}`);
})

