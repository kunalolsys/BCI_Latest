// Socket management singleton
let ioInstance = null;
const connectedUsers = {};

function setIo(io) {
  ioInstance = io;
}

function getIo() {
  return ioInstance;
}

function getConnectedUsers() {
  return connectedUsers;
}

module.exports = { setIo, getIo, getConnectedUsers, connectedUsers }; 