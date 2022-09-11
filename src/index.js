import { createServer } from "node:http";
import { once } from "node:events";

const handler = async (request, response) => {
  try {
    const data = JSON.parse(await once(request, "data"));
    console.log("\nrecevied", data);
    response.writeHead(200);
    response.end(JSON.stringify(data));

    setTimeout(() => {
      throw new Error("will be handled on uncaught");
    }, 1000);

    Promise.reject("error");
  } catch (error) {
    console.error("Error catch:", error.stack);
    response.writeHead(500);
    response.end();
  }
};

const server = createServer(handler)
  .listen(3000)
  .on("listening", () => console.log("server running at 3000"));
// capture errors not been handled
// if the system don't have this system is going to broke
process.on("uncaughtException", (error, origin) => {
  console.log(`\n${origin} signal received. \n${error}`);
});
// capture errors not been handled by promises
// if we don't have this the system don't warn us
process.on("unhandledRejection", (error) => {
  console.log(`signal received \n${error}`);
});

// gracefull shutdown
const gracefullShutdown = (event) => {
  return (code) => {
    console.log(`${event} received with ${code}`);
    // assure that no client is going to request any in this period
    // but if that's someone using, wait until finish
    server.close(() => {
      console.log("http server closed");
      console.log("db connection closed");
      process.exit(code);
    });
  };
};

// trigger when CTRL + C on terminal -> multi platform
process.on("SIGINT", gracefullShutdown("SIGINT"));

// trigger when kill the process
process.on("SIGTERM", gracefullShutdown("SIGTERM"));

process.on("exit", (code) => {
  console.log("exit signal received ", code);
});
