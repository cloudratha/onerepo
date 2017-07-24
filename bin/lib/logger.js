'use strict';

const args = process.argv;

module.exports = function logger (message) {

  if (args.includes('-v') || args.includes('-verbose')) {
    console.log(message);
  }
}