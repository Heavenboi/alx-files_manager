const { ObjectId } = require('mongodb');
const sha1 = require('sha1');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

exports.postNew = async function postNew(req, res) {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Missing email' });
    return;
  }
  if (!password) {
    res.status(400).json({ error: 'Missing password' });
    return;
  }
  const userexists = await dbClient.userExist(email);
  if (userexists.length > 0) {
    res.status(400).json({ error: 'Already exist' });
    return;
  }
  const hashedPassword = sha1(password); // Hash the password using SHA1
  const user = await dbClient.createUser(email, hashedPassword); // Store the hashed password
  const id = `${user.insertedId}`;
  res.status(201).json({ id, email });
};

exports.getMe = async function getMe(req, res) {
  const token = req.get('X-Token');
  const key = `auth_${token}`;
  const value = await redisClient.get(key);
  // console.log(`value: ${value}`);

  const _id = new ObjectId(value);
  const user = await dbClient.getUserById(_id);

  // console.log(`userId: ${user}`);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.status(200).json({ id: user._id, email: user.email });
};
