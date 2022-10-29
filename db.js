const mongoose = require('mongoose');
require('dotenv/config')
const mongoURL = process.env.Mongo_URL;

const connectToMongo = () => {
    mongoose.connect(mongoURL, () => {
        console.log("Connected to Mongo Successfully");
    });
}

module.exports = connectToMongo;