import {Router} from 'express';
import db from './../db';
import 'isomorphic-fetch';
import path from 'path';
import options from './../../options';
import fs from 'fs';
const router = Router();

router.get('/', function (req, res) {
  db.Building.find({}, (err, docs) => {
    if (err) {
      return res.status(500).json({ errmessage: err.message });
    }
    return res.json(docs);
  });
});

function copy (body) {
  return new Promise((resolve) => {
    const { from, to } = body;
    const { registerNo, ID, wallId } = from;
    const { registerNo: toRegisterNo, ID: toID, wallId: toWallId } = to;
    let toImageFilePath = path.resolve(options.sourceDirPath, toRegisterNo + '_' + toID + '_' + toWallId + '.png');
    let fromImageFilePath = path.resolve(options.sourceDirPath, registerNo + '_' + ID + '_' + wallId + '.png');
    try {
      const st = fs.statSync(fromImageFilePath);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('источника фотографии нет, копирование этой фотографии остановлено.');
      }
      return resolve();
    }
    try {
      const st = fs.statSync(toImageFilePath);
      fs.unlinkSync(toImageFilePath);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log();
      }
    }
    const fromImageReadStream = fs.createReadStream(fromImageFilePath);
    const toImageWriteStream = fs.createWriteStream(toImageFilePath);
    fromImageReadStream.pipe(toImageWriteStream);
    console.log('фото скопировано. toRegisterNo:', toRegisterNo, ' wallId', wallId);
    return resolve();
  });
}
router.post('/move', function (req, res) {

  /*
  Пример использования:
   {
   "from": {
   "registerNo": "00010003EEB0",
   "ID": "0002000289C1"
   },
   "to": {
   "registerNo": "00010003EEB4"
   }
   }
  * */

  const { from, to } = req.body;
  const { registerNo, ID } = from;
  const { registerNo: toRegisterNo } = to;
  db.Building.findOne({
    'properties.ParentRegisterNo': registerNo,
    'properties.ID': ID
  }, (err, doc) => {
    if (err) {
      return res.status(500).json({ errmessage: err.message });
    }
    doc.properties.ParentRegisterNo = toRegisterNo;
    doc.save((err) => {
      if (err) {
        return res.status(500).json({ errmessage: err.message });
      }
      doc.geometry.points.forEach((point, i) => {
        const body = {
          from: {
            registerNo,
            ID,
            wallId: i
          },
          to: {
            registerNo: toRegisterNo,
            ID,
            wallId: i
          },
        };
        copy(body);
      });
      return res.json({result: 'ok'});
    });

  });
});

export default {
  route: 'buildings',
  router
};
