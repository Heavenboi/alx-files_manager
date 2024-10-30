const express = require('express');
const appController = require('../controllers/AppController');
const { postNew, getMe } = require('../controllers/UsersController');
const { getConnect, getDisconnect } = require('../controllers/AuthController');
const { postUpload, getShow, getIndex } = require('../controllers/FilesController');
const { putPublish, putUnpublish, getFile } = require('../controllers/FilesController');

const router = express.Router();
router.get('/status', appController.getStatus); // definition of getStatus
router.get('/stats', appController.getStats); // definition of getStatus
router.post('/users', postNew); // definition of postNew
router.get('/connect', getConnect); // defination of getConnect
router.get('/disconnect', getDisconnect); // definition of getDisconnect
router.get('/users/me', getMe);
router.post('/files', postUpload); // definition of postUpload
router.get('/files/:id', getShow); // definition of getShow
router.get('/files', getIndex); // definition of getIndex
router.put('/files/:id/publish', putPublish); // definition of putPublish
router.put('/files/:id/unpublish', putUnpublish); // definition of putUnpublish
router.get('/files/:id/data', getFile); // definition of getFile route

module.exports = router;
