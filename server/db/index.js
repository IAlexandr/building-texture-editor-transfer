import mngs from 'mongoose';
import options from '../../options';
import address from './models/address';
import building from './models/building';


mngs.connect(options.mongoDbUrl, {
  server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }
});

const conChecker = {
  checkTO: null,
  to: null,
  setProcExitTO: function() {
    var _this = this;
    _this.clearTO();
    _this.to = setTimeout(function() {
      console.error('process.exit(1)');
      process.exit(1);
    }, 60 * 1000);
  },
  clearTO: function() {
    clearTimeout(this.to);
  },
  check: function() {
    var _this = this;
    _this.checkTO = setTimeout(function() {
      console.log('checkTO mongoose.connection.readyState:', mongoose.connection.readyState);
      if (mongoose.connection.readyState === 0) {
        _this.setProcExitTO();
        _this.conOpen();
      } else {
        _this.clearTO();
      }
      _this.check();
    }, 10 * 1000);
  }
};

mngs.connection.on('connected', function() {
  console.log('Mongoose default connection open to ' + options.mongoDbUrl);
  conChecker.clearTO();
});

// // If the connection throws an error
mngs.connection.on('error', function(err) {
  console.error('Mongoose default connection error: ' + err);
  // conChecker.setProcExitTO();
});

// // When the connection is disconnected
mngs.connection.on('disconnected', function() {
  console.error('Mongoose default connection disconnected');
  conChecker.setProcExitTO();
});

export default {
  mongoose: mngs,
  Address: address,
  Building: building,
}
