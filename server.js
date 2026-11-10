const express = require('express');
const { httpServer } = require('./server/src/server');

if (typeof express !== 'function') throw new Error('Express is required');

module.exports = httpServer;
