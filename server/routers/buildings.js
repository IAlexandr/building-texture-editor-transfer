import {Router} from 'express';
import db from './../db';
import 'isomorphic-fetch';

const router = Router();

router.get('/', function (req, res) {
  db.Building.find({}, (err, docs) => {
    if (err) {
      return res.status(500).json({ errmessage: err.message });
    }
    return res.json(docs);
  });
});
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
      const body = {
        from: {
          ParentRegisterNo: registerNo,
          ID,
          wallId: 0
        },
        to: {
          ParentRegisterNo: toRegisterNo,
          ID,
          wallId: 0
        },
      };
      fetch(`https://mtaxi.chebtelekom.ru:3001/api/buildings/copy`,
        {
          credentials: 'same-origin',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body,
        })
        .then(result => {
          return res.json(result);
        })
        .catch(e => {
          return res.status(500).json({ errmessage: e.message });
        });
      // const promises = doc.geometry.points.map((point, i) => {
      //   const body = {
      //     from: {
      //       ParentRegisterNo: registerNo,
      //       ID,
      //       wallId: i
      //     },
      //     to: {
      //       ParentRegisterNo: toRegisterNo,
      //       ID,
      //       wallId: i
      //     },
      //   };
      //   return fetch(`https://mtaxi.chebtelekom.ru:3001/api/buildings/copy`,
      //     {
      //       credentials: 'same-origin',
      //       method: 'POST',
      //       headers: {
      //         'Content-Type': 'application/json'
      //       },
      //       body,
      //     });
      // });
      //
      // Promise.all(promises, (results) => {
      //   console.log(results);
      //   return res.json(results);
      // })
      //   .catch(e => {
      //     console.log(e.message);
      //     return res.status(500).json({ errmessage: e.message });
      //   });
    });

  });
});

export default {
  route: 'buildings',
  router
};
