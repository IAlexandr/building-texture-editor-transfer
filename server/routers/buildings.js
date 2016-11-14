import {Router} from 'express';
import db from './../db';

const router = Router();

router.get('/', function (req, res) {
  db.Building.find({}, (err, docs) => {
    if (err) {
      return res.status(500).json({ errmessage: err.message });
    }
    return res.json(docs);
  });
});

export default {
  route: 'buildings',
  router
};
