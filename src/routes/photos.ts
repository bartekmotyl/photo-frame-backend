import { Router } from "express"
import { PhotosController } from "../controllers/photosController"

export const photos = (router: Router): void => {
  router.get(
    "/photos/random/jpeg/:groupIdx",
    PhotosController.getRandomPhotoJpeg
  )
  router.get(
    "/photos/random/json/:groupIdx",
    PhotosController.getRandomPhotoJson
  )
}
