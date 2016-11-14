import {Router} from 'express';
import db from './../db';
import 'isomorphic-fetch';
import path from 'path';
import options from './../../options';

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
    return resolve();
  });
}
router.post('/move', function (req, res) {
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
      const promises = doc.geometry.points.map((point, i) => {
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
        return copy(body);
      });

      Promise.all(promises, (results) => {
        console.log(results);
        return res.json(results);
      })
        .catch(e => {
          console.log(e.message);
          return res.status(500).json({ errmessage: e.message });
        });
    });

  });
});

export default {
  route: 'buildings',
  router
};
