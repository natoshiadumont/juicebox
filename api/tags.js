const express = require('express');
const tagsRouter = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const { getAllTags, getPostsByTagName, getUserById } = require('../db');
const { requireUser } = require('./utils')

tagsRouter.use((req, res, next) => {
  console.log("A request is being made to /tags");

  next();
});

tagsRouter.get('/', async (req, res) => {
  const tags = await getAllTags();

  res.send({
    tags
  });
});

tagsRouter.get('/:tagName/posts', requireUser, async (req, res, next) => {
  // read the tagname from the params
  const { tagName } = req.params;
  // console.log(tagName);
  try {
    const prefix = 'Bearer ';
    const auth = req.header('Authorization');
    const token = auth.slice(prefix.length);
    // console.log(token);
    const user = jwt.verify(token, JWT_SECRET);
    // console.log(user);
    req.user = user;
    //console.log(req.user);
    // use our method to get posts by tag name from the db

    const matchingTags = await getPostsByTagName(tagName);
    // send out an object to the client { posts: // the posts }
    const result =  matchingTags.filter(match => {
      return match.active && (match.author.id === user.id)
      // === true || match.author.id === user.id;
    });
    console.log(result);
    res.send(result);
  } catch ({ name, message }) {
    // forward the name and message to the error handler
    next({
      name: "ErrorFindingTag",
      message: "Unable to match any posts with this tag",

    })
  }
});


module.exports = tagsRouter;