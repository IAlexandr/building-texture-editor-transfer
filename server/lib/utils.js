import simplify from 'simplify-js';

export function prepSimplifyFeaturePoints (feature, m) {
  var resultPoints = [];
  switch (feature.geometry.type) {
    case 'Polygon':
      var points = feature.geometry.coordinates[0];
      points.forEach(function (point) {
        resultPoints.push({ x: point[0], y: point[1] });
      });
      resultPoints = simplify(resultPoints, m);
      break;
    case 'MultiPolygon':
      var parts = feature.geometry.coordinates;
      parts.forEach(function (part) {
        part.forEach(function (points) {
          var partResultPoints = [];
          points.forEach(function (point) {
            partResultPoints.push({ x: point[0], y: point[1] });
          });
          resultPoints.push(simplify(partResultPoints, m));
        });
      });
      break;
  }

  feature.geometry.points = resultPoints;
  return feature;
}

export function prepFloors (feature) {
  let floors = 5;
  if (feature.properties['этажность']) {
    if (parseInt(feature.properties['этажность'])) {
      floors = parseInt(feature.properties['этажность']);
    }
  }
  feature.properties['этажность'] = floors;
  return feature;
}
