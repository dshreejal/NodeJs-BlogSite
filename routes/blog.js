const express = require("express")
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Blog = require("../models/Blog");
const multer = require("multer");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./images")
    }, filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage })

////ROUTE 1: Add a new note using: POST "/api/notes/addnote". Login required
router.post('/addblog', upload.single('img'), async (req, res) => {
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log(req.file);
        const { title, description } = req.body;
        const img = req.file.filename;
        const blog = new Blog({
            title, description, img
        })
        const savedBlog = await blog.save();
        res.json(savedBlog)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})


module.exports = router;