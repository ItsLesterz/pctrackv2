const serverless = require('serverless-http');
const { createApp } = require('../../app');

let cachedHandler;

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!cachedHandler) {
    const app = await createApp();
    cachedHandler = serverless(app);
  }

  return cachedHandler(event, context);
};
