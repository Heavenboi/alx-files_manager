const { MongoClient, ObjectId } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';

    this.con = `mongodb://${host}:${port}`;
    this.client = new MongoClient(this.con);
    this.client.connect();
  }

  isAlive() {
    // returns a boolean to check whether connection is successful
    return this.client.isConnected();
  }

  async nbUsers() {
    // returns the number of all users in the database
    const database = this.client.db(this.database);
    const collection = database.collection('users');
    const allUsers = await collection.find({}).toArray();
    return allUsers.length;
  }

  async createUser(email, hashedPw) {
    // inserst a new user into the database
    const database = this.client.db(this.database);
    const collection = database.collection('users');
    const newUser = await collection.insertOne({ email, password: hashedPw });
    return newUser;
  }

  async userExist(email) {
    // checks if a user with an email exists in the database
    const database = this.client.db(this.database);
    const collection = database.collection('users');
    const user = await collection.find({ email }).toArray();
    return user;
  }

  async getUserById(id) {
    // returns a user based on their id in the database
    const database = this.client.db(this.database);
    const collection = database.collection('users');
    const user = await collection.findOne({ _id: ObjectId(id) });
    return user;
  }

  async addFile(userId, name, isPublic = false, parentId = 0, type, localpath = null) {
  // inserts a file, folder or image into the database
    const database = this.client.db(this.database);
    const collection = database.collection('files');
    // if a path is provided
    if (localpath) {
      await collection.insertOne({
        userId,
        name,
        type,
        isPublic,
        parentId,
        localpath,
      });
    } else {
      // if no path is provided
      await collection.insertOne({
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }

    const newFile = await collection.findOne({ name });
    return {
      id: newFile._id, userId, name, type, isPublic, parentId,
    };
  }

  async findFile(parentId) {
    // checks and finds a file based on its parentId
    const database = this.client.db(this.database);
    const collection = database.collection('files');
    const existingFile = await collection.findOne({ _id: ObjectId(parentId) });
    return existingFile;
  }

  async getFile(fileId) {
    // finds a file based on the files id
    const database = this.client.db(this.database);
    const collection = database.collection('files');
    const existingFiles = await collection.findOne({ _id: ObjectId(fileId) });
    return existingFiles;
  }

  // doing pagination
  async getFilesByUserAndParent(userId, parentId = 0, page = 0) {
    const database = this.client.db(this.database);
    const collection = database.collection('files');
    const files = await collection.aggregate([
      { $match: { userId, parentId } },
      { $skip: page * 20 },
      { $limit: 20 },
    ]).toArray();
    return files;
  }

  async updateFile(fileId, update) {
    // updates a file based on the fileid and update statement
    const database = this.client.db(this.database);
    const collection = database.collection('files');
    await collection.updateOne({ _id: ObjectId(fileId) }, { $set: update });
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
