const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const mime = require('mime-types');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

// eslint-disable-next-line consistent-return
exports.postUpload = async function postUpload(req, res) {
  const token = req.get('X-token');
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const {
    name, type, parentId, isPublic, data,
  } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Missing name' });
    return;
  }

  const accepted = ['file', 'folder', 'image'];
  if (!type || !accepted.includes(type)) {
    res.status(400).json({ error: 'Missing type' });
    return;
  }

  if (!data && type !== 'folder') {
    res.status(400).json({ error: 'Missing data' });
    return;
  }

  if (parentId) {
    const checkfile = await dbClient.findFile(parentId);
    if (!checkfile) {
      res.status(400).json({ error: 'Parent not found' });
      return;
    }
    if (checkfile.type !== 'folder') {
      res.status(400).json({ error: 'Parent is not a folder' });
      return;
    }
  }

  if (type === 'folder') {
    const addedFile = await dbClient.addFile(
      userId, name, isPublic, parentId, type,
    );
    res.status(201).json(addedFile);
  } else {
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const filename = uuid.v4();
    const filePath = path.join(folderPath, filename);
    const decodedData = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, decodedData);

    const addedFile = await dbClient.addFile(
      userId, name, isPublic, parentId, type, filePath,
    );
    res.status(201).json(
      {
        id: addedFile.id,
        userId: addedFile.userId,
        name: addedFile.name,
        parentId: addedFile.parentId,
        type: addedFile.type,
        isPublic: addedFile.isPublic,
      },
    );
  }
};

exports.getShow = async function getShow(req, res) {
  const token = req.get('X-token');
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const fileId = req.params.id;
  const file = await dbClient.getFile(fileId);

  if (!file || file.userId.toString() !== userId) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  res.json(file);
};

exports.getIndex = async function getIndex(req, res) {
  const token = req.get('X-token');
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parentId = req.query.parentId || 0;
  const page = req.query.page || 0;

  const files = await dbClient.getFilesByUserAndParent(userId, parentId, page);
  res.json(files);
};

exports.putPublish = async function putPublish(req, res) {
  const token = req.get('X-token');
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const fileId = req.params.id;
  const file = await dbClient.getFile(fileId);

  if (!fileId || file.userId.toString() !== userId) {
    res.status(404).json({ error: 'Not found' });
  }

  await dbClient.updateFile(fileId, { isPublic: true });

  const updatedFile = await dbClient.getFile(fileId);

  res.status(200).json(updatedFile);
};

exports.putUnpublish = async function pushUnpublis(req, res) {
  const token = req.get('X-token');
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
  }

  const fileId = req.params.id;
  const file = await dbClient.getFile(fileId);

  if (!fileId || file.userId.toString() !== userId) {
    res.status(404).json({ error: 'Not found' });
  }

  await dbClient.updateFile(fileId, { isPublic: false });
  const updatedFile = await dbClient.getFile(fileId);

  res.status(200).json(updatedFile);
};

exports.getFile = async function getFile(req, res) {
  const token = req.get('X-token');
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);

  const fileId = req.params.id;
  const file = await dbClient.getFile(fileId);
  if (!file) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (file.isPublic === false && (!userId || file.userId !== userId)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (file.type === 'folder') {
    res.status(400).json({ error: 'A folder doesn\'t have content' });
    return;
  }
  if (!fs.existsSync(file.localpath)) {
    res.status(404).json({ error: 'Not found' });
  }
  const filedata = fs.readFileSync(file.localpath);
  const filename = file.name;
  const mimetype = mime.lookup(filename);
  res.setHeader('Content-Type', mimetype);
  res.status(200).send(filedata);
};
