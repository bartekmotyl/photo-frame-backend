import express, { Express } from "express"
import { corsMiddleware, notFoundMiddleware } from "./middlewares"
import { router } from "./routes"
import { configure, format, transports } from "winston"
import { config } from "dotenv"

config()

configure({
  format: format.combine(
    format.timestamp({
      format: "YYYY.MM.DD-HH:mm:ss.SSS",
    }),
    //format.colorize(),
    format.printf((info) => {
      return `[${info.timestamp}] [${info.level}]: ${info.message}`
    })
  ),
  transports: [
    new transports.File({ filename: process.env.API_LOG_FILENAME }),
    new transports.Console(),
  ],
  level: "debug",
})

const app: Express = express()

app.use(
  express.json({ limit: "10mb" }),
  express.urlencoded({ limit: "10mb", extended: true }),
  corsMiddleware,
  router,
  notFoundMiddleware
)
console.log("listening on port: " + process.env.APP_PORT)
app.listen(process.env.APP_PORT)
