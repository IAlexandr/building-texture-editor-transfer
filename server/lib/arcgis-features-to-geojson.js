import {FeatureServer} from 'arcgis-api-client';
import terraformerArcgisParser from 'terraformer-arcgis-parser';
import Sphericalmercator from 'sphericalmercator';
const sm = new Sphericalmercator();
import async from 'async';

export function splitArray (input, spacing) {
  var output = [];
  for (var i = 0; i < input.length; i += spacing)
    output[output.length] = input.slice(i, i + spacing);
  return output;
}

function prepCoordsWithConvert (coordSystemConvertOperation, coords) {
  if (!coordSystemConvertOperation) {
    return coords;
  }
  return sm[coordSystemConvertOperation](coords);
}

function prepFeatures ({fields, features, coordSystemConvertOperation}) {
  const resultFeatures = [];
  return new Promise((resolve, reject) => {
    features.forEach((feature) => {
      const newFeature = {
        type: 'Feature',
        properties: {},
        geometry: {}
      };
      fields.forEach((field) => {
        newFeature.properties[field['alias']] = feature.attributes[field['name']];
      });
      const gg = terraformerArcgisParser.parse(feature.geometry);

      const coordinates = [];
      switch (gg.type) {
        case 'Point':
          gg.coordinates = prepCoordsWithConvert(coordSystemConvertOperation, gg.coordinates);
          newFeature.geometry = gg;
          break;
        case 'Polygon':
          gg.coordinates.forEach((coords, i) => {
            coordinates[i] = [];
            coords.forEach((xy) => {
              coordinates[i].push(prepCoordsWithConvert(coordSystemConvertOperation, xy));
            });
          });
          gg.coordinates = coordinates;
          newFeature.geometry = gg;
          break;
        case 'MultiPolygon':
          gg.coordinates.forEach((coords, i) => {
            coordinates[i] = [];
            coords.forEach((subcoords) => {
              const subsoordinates = [];
              subcoords.forEach(function (xy) {
                subsoordinates.push(prepCoordsWithConvert(coordSystemConvertOperation, xy));
              });
              coordinates[i].push(subsoordinates);
            });
          });
          gg.coordinates = coordinates;
          newFeature.geometry = gg;
          break;
        default:
          throw new Error('FeatureServer geometry type not supported.');
          break;
      }
      resultFeatures.push(newFeature);
    });
    return resolve(resultFeatures);
  });
};

export default function (props, callback) {
  const { featureServerUrl, coordSystemConvertOperation, username, password } = props;
  const featureServer = new FeatureServer({ featureServerUrl, username, password });
  featureServer.connect()
    .then((fsInfo) => featureServer.queryCount({ returnGeometry: false }))
    .then((count) => {
      console.log('Кол-во получаемых объектов:', count);
      featureServer.query({ returnIDsOnly: true })
        .then(({objectIds}) => {
          let resultFeatures = [];
          let objectIDsParts = splitArray(objectIds, 100);
          console.log('Получение объектов будет производиться частями по 100 объектов.');
          async.eachLimit(objectIDsParts, 1, (objectIds, done) => {
            featureServer.query({ objectIds, returnGeometry: true, outFields: ["*"] })
              .then((result) => prepFeatures(Object.assign(result, { coordSystemConvertOperation })))
              .then((features) => {
                resultFeatures = resultFeatures.concat(features);
                console.log(resultFeatures.length);
                return done();
              })
              .catch((err) => {
                return done(err);
              });
          }, (err) => {
            return callback (err, {
              type: 'FeatureCollection',
              features: resultFeatures
            });
          });
        })
    })

    .catch(callback);
};
