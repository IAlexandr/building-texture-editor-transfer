import express, { Router } from 'express';
import options from '../../options';
import buildings from './buildings';

const routers = [
  buildings,
];

const mainRouter = Router();

mainRouter.get('/', function (req, res) {
  res.json({
    version: options.version
  });
});

const root = '/api/';

export default (app) => {
  app.use(root, mainRouter);
  routers.forEach((r) => {
    const { route, router } = r;
    app.use(root + route, router);
  });
};
