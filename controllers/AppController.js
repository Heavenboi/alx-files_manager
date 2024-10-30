const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const getStatus = (req, res) => {
  // checks if the db and redis are connected and returns a boolean
  res.status(200).json({
    redis: redisClient.isAlive(),
    db: dbClient.isAlive(),
  });
};

const getStats = async (req, res) => {
  const allUsers = await dbClient.nbUsers();
  const allFiles = await dbClient.nbFiles();
  // returns the number of files and users in db with sttaus code 200
  res.status(200).json({
    users: allUsers,
    files: allFiles,
  });
};

module.exports = { getStatus, getStats };
