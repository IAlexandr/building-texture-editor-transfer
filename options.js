const version = require('./package.json').version;
const connections = require('./connections');
const optionsSpec = {
  PORT: {
    required: true,
    default: '3002',
    env: 'BTET_PORT'
  },
  mongoDbUrl: {
    required: true,
    default: 'mongodb://10.10.10.247:27017/building-texture-editor',
    env: 'BTET_MONGODBURL'
  },
};

let options = {
  version,
  connections
};

export default {...options, ...Object.keys(optionsSpec).map((key) => {
  if (!optionsSpec[key].preprocess) {
    optionsSpec[key].preprocess = function preprocess (str) {
      return str;
    };
  }
  const opt = { name: key };
  if (process.env[optionsSpec[key].env]) {
    opt.value = optionsSpec[key].preprocess(process.env[optionsSpec[key].env]);
  } else if (optionsSpec[key].default) {
    opt.value = optionsSpec[key].preprocess(optionsSpec[key].default);
  } else if (optionsSpec[key].required) {
    throw new Error('!!! REQUIRED OPTION NOT SET: ' + key);
  }
  return opt;
}).reduce((prev, cur) => {
  prev[cur.name] = cur.value;
  return prev;
}, {})};
