import { Request, Response } from "express"
import { StatusCodes, ReasonPhrases } from "http-status-codes"
import { promises as fs } from "fs"
import { photoManagers } from "../photo/photoManager"

export const PhotosController = {
  getRandomPhotoJpeg: async (req: Request, res: Response) => {
    try {
      const photoData = await photoManagers[0].getRandomPhoto()

      return res
        .status(StatusCodes.OK)
        .contentType(photoData.contentType)
        .send(photoData.data)
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      })
    }
  },
  getRandomPhotoJson: async (req: Request, res: Response) => {
    try {
      const photoData = await photoManagers[0].getRandomPhoto()
      photoData.data = photoData.data.toString("base64")
      return res.status(StatusCodes.OK).json(photoData)
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      })
    }
  },
}
