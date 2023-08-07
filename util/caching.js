const redis = require('redis');


require('dotenv').config()

let redisClient;

(async () => {
    console.log(process.env.REDIS_HOSTNAME);
  redisClient = redis.createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOSTNAME,
        port: process.env.REDIS_PORT
    }
    //   username: "default",
    //   database: "carservices-dev",
    // host: process.env.REDIS_HOSTNAME,
    // port: process.env.REDIS_PORT,
    // password: process.env.REDIS_PASSWORD
  });

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

module.exports = redisClient