const sha1 = require('sha1');
const uuidv4 = require('uuid').v4;
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

exports.getConnect = async function getConnect(req, res) {
  const auth = req.headers.authorization;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const buff = Buffer.from(auth.split(' ')[1], 'base64');
  const string = buff.toString('utf-8');
  const credentials = string.split(':');

  if (!credentials[0] || !credentials[1]) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await dbClient.userExist(credentials[0]);
  if (user.length === 0) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const hashedPw = sha1(credentials[1]);
  if (user[0].password !== hashedPw) {
    res.status(401).json({ error: 'Unauthorized' });
  }

  const token = uuidv4();
  const key = `auth_${token}`;
  await redisClient.set(key, user[0]._id.toString(), 86400);
  // console.log(`Set key ${key} in Redis with value ${user[0]._id.toString()}`);
  res.status(200).json({ token });
};

exports.getDisconnect = async function getDisconnect(req, res) {
  const token = req.headers['x-token'];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await redisClient.del(key);
  res.sendStatus(204);
};
