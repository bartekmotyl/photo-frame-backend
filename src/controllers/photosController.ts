import { Request, Response } from "express"
import { StatusCodes, ReasonPhrases } from "http-status-codes"
import { promises as fs } from "fs"
import { photoManagers } from "../photo/photoManager"
import winston from "winston"

export const PhotosController = {
  getRandomPhotoJpeg: async (req: Request, res: Response) => {
    try {
      const groupIdx = parseInt(req.params.groupIdx ?? "0")
      const photoData = await photoManagers[groupIdx].getRandomPhoto()

      return res
        .status(StatusCodes.OK)
        .contentType(photoData.contentType)
        .send(photoData.data)
    } catch (error) {
      winston.error(`Error when loading image: getRandomPhotoJpeg (${error})`)
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error,
        status: StatusCodes.BAD_REQUEST,
      })
    }
  },
  getRandomPhotoJson: async (req: Request, res: Response) => {
    try {
      const groupIdx = parseInt(req.params.groupIdx ?? "0")
      const photoData = await photoManagers[groupIdx].getRandomPhoto()
      photoData.data = photoData.data.toString("base64")
      return res.status(StatusCodes.OK).json(photoData)
    } catch (error) {
      winston.error(`Error when loading image: getRandomPhotoJson (${error})`)
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error,
        status: StatusCodes.BAD_REQUEST,
      })
    }
  },
}
