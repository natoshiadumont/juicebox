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
  // (1) an object that contains -DONE
  // (2) a `rows` array that (in this case) will contain  -DONE
  // (3) one object, which is our user. -DONE
  // if it doesn't exist (if there are no `rows` or `rows.length`), return null -DONE

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

async function createTags(tagList) {
  if (tagList.length === 0) { 
    return; 
  }

  // need something like: $1), ($2), ($3 
  const insertValues = tagList.map(
    (_, index) => `$${index + 1}`).join('), (');
  // then we can use: (${ insertValues }) in our string template

  // need something like $1, $2, $3
  const selectValues = tagList.map(
    (_, index) => `$${index + 1}`).join(', ');
  // then we can use (${ selectValues }) in our string template

  try {
    // insert the tags, doing nothing on conflict
    // returning nothing, we'll query after
    
    await client.query(`
      INSERT INTO tags(name)
      VALUES (${insertValues})
      ON CONFLICT (name) DO NOTHING;
    `, tagList);
    // select all tags where the name is in our taglist
    // return the rows from the query
    const { rows } = await client.query(`
    SELECT * FROM tags
    WHERE name
    IN (${selectValues});
    `, tagList);
    
   //console.log(rows); 

   return rows;
    
  } catch (error) {
    throw error;
  }
}

async function createPostTag(postId, tagId) {
  try {
    await client.query(`
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]);
  } catch (error) {
    throw error;
  }
}

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

async function getPostById(postId) {
  try {
    const { rows: [ post ]  } = await client.query(`
      SELECT *
      FROM posts
      WHERE id=$1;
    `, [postId]);

    const { rows: tags } = await client.query(`
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `, [postId])

    const { rows: [author] } = await client.query(`
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `, [post.authorId])

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
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
  getUserById,
  createTags,
  createPostTag,
  addTagsToPost,
  getPostById,
}