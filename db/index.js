const { Client } = require('pg');

const client = new Client('postgres://localhost:5432/juicebox-dev');

async function createUser({ username, password, name, location }) {
  try {

    const { rows: [user] } = await client.query(`
    INSERT INTO users(username, password, name, location) 
    VALUES($1, $2, $3, $4) 
    ON CONFLICT (username) DO NOTHING 
    RETURNING *;
  `, [username, password, name, location]);

    return user;
  } catch (error) {
    throw error;
  }
}

async function getAllUsers() {
  const { rows } = await client.query(

    `SELECT id, username, name, location, active
    FROM users;
    `
  );

  return rows;
}


async function updateUser(id, fields = {}) {
  // build the set string
  const setString = Object.keys(fields).map(
    (key, index) => `"${key}"=$${index + 1}`
  ).join(', ');

  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }

  try {

    const { rows: [user] } = await client.query(`
      UPDATE users
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
    `, Object.values(fields));

    return user;

  } catch (error) {
    throw error;
  }
}

async function createPost({ authorId, title, content }) {
  try {

    const { rows: [post] } = await client.query(`
    INSERT INTO posts("authorId", title, content) 
    VALUES($1, $2, $3) 
    RETURNING *;
  `, [authorId, title, content]);

    return post;
  } catch (error) {
    throw error;
  }
}

async function updatePost(id, {title, content, active = true}) {
  // build the set string
  const setString = `title='${title}', content='${content}', active=${active ? active : null}`;  
  // Object.keys(fields).map(
  //   (key, index) => `"${key}"=$${index + 1}`
  // ).join(', ');
  console.log({ setString });
  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }

  try {

    const { rows: [post] } = await client.query(`
    UPDATE posts
    SET ${setString}
    WHERE id=${id}
    RETURNING *;
  `);

    return post;
  } catch (error) {
    throw error;
  }
}

async function getAllPosts() {
  const { rows } = await client.query(

    `SELECT id, "authorId", title, content
    FROM posts;
    `
  );

  return rows;
}

async function getPostsByUser(userId) {
  try {
    const { rows } = await client.query(`
      SELECT * FROM posts
      WHERE "authorId"=${userId};
    `);

    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUserById(userId) {
  // first get the user (NOTE: Remember the query returns 
  // (1) an object that contains 
  // (2) a `rows` array that (in this case) will contain 
  // (3) one object, which is our user.
  // if it doesn't exist (if there are no `rows` or `rows.length`), return null

  try {
    const { rows } = await client.query(`
      SELECT * FROM posts
      WHERE "authorId"=${userId};
    `);

    if (rows && rows.length === 0) {
      return null;
    }
    // if it does:
    // delete the 'password' key from the returned object (DONE)
    // get their posts (use getPostsByUser) (DONE)
    // then add the posts to the user object with key 'posts' (DONE)
    // return the user object (DONE)

    delete rows.password;
    const userPosts = await getPostsByUser(userId);
    rows.posts = await userPosts;

    return rows;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById
}