import cors from "cors"
import { StatusCodes } from "http-status-codes"

export const corsMiddleware = cors({
  origin: true,
  optionsSuccessStatus: StatusCodes.OK,
})
