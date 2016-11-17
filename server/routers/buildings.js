import {Router} from 'express';
import db from './../db';
import 'isomorphic-fetch';
import path from 'path';
import options from './../../options';
import fs from 'fs';
import arcgisFeaturesToGeojson from './../lib/arcgis-features-to-geojson';
const router = Router();
import {prepFloors, prepSimplifyFeaturePoints} from './../lib/utils';
import turfArea from 'turf-area';

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
      return res.json({ result: 'ok' });
    });
  });
});

router.post('/fs/copy', (req, res) => {
  /*
   Пример использования:
   {
   "objectIds": [012390123,01293091203]
   в случае добавления строений в сущ. адрес указываем его RegisterNo,
   "registerNo": "000101010203",
   иначе (в случае добавления строений и нового адреса) указываем address
   "address": "пр. МИра, 77"
   }
   */
  const { objectIds, registerNo, address } = req.body;
  if (!registerNo && !address) {
    return res.status(500).json({ errmessage: 'Не указаны registerNo или address!' });
  }
  const props = {
    featureServerUrl: 'https://chebtelekom.ru/arcgis/rest/services/test/stroeniya/FeatureServer/0',
    coordSystemConvertOperation: 'inverse',
    username: 'arcgis',
    password: 'Informatica21',
    query: { objectIds }
  };
  arcgisFeaturesToGeojson(
    props,
    function (err, featureCollection) {
      if (err) {
        console.log(err.message);
        return res.status(500).json({ errmessage: err.message });
      }
      let ParentRegisterNo = registerNo;

      const docs = featureCollection.features.map(feature => {
        if (!ParentRegisterNo && feature.properties.RegisterNo) {
          ParentRegisterNo = feature.properties.RegisterNo;
        }
        feature.properties.ParentRegisterNo = ParentRegisterNo;
        feature = prepSimplifyFeaturePoints(feature, 0.000001);
        feature = prepFloors(feature);
        feature.geometry.originPoints = feature.geometry.points;
        feature.geometry.updatedAt = new Date().toISOString();
        feature.properties['Площадь'] = turfArea(feature);
        return feature;
      });

      db.Building.collection.insert(docs, (err, result) => {
        if (err) {
          return res.status(500).json({ errmessage: err.message });
        }
        if (address) {
          // создаем в таб. адресов новый адрес c registerNo первого попавшегося из features и считаем его за ParentRegisterNo
          // добавляем properties.ParentRegisterNo всем фичерам.
          const addrDoc = new db.Address();
          addrDoc.address = address;
          addrDoc.RegisterNo = ParentRegisterNo;
          addrDoc.save(err => {
            if (err) {
              console.log(err.message);
              return res.status(500).json({ errmessage: err.message });
            }
            return res.json({ 'result': result.insertedCount, addressCreated: true });
          });
        } else {
          return res.json({ 'result': result.insertedCount });
        }
      });

      // async.eachLimit(featureCollection.features, 1, (feature, done) => {
      //   if (!ParentRegisterNo && feature.properties.RegisterNo) {
      //     ParentRegisterNo = feature.properties.RegisterNo;
      //   }
      //   feature.properties.ParentRegisterNo = ParentRegisterNo;
      //   const building = new db.Building(feature);
      //   building.save((err) => {
      //     return done(err);
      //   });
      // }, (err) => {
      // });

    });
});

export default {
  route: 'buildings',
  router
};
