import * as fs from "fs"
import { promises as asyncfs } from "fs"
import { basename } from "path"
import sharp from "sharp"
import { range, shuffle } from "lodash"
import { ExifData, ExifImage } from "exif"
import winston from "winston"
import * as dotenv from "dotenv"
import { PhotoGroupConfig, PhotoGroupMeta } from "@/types"

export type PhotoData = {
  data: Buffer | string
  contentType: string
  fileName: string
  ctime: Date
  mtime: Date
  exifDate: string
}

type CacheEntry<T extends object> = {
  data: T
  lastAccess: number
}

function initializePhotoManagers() {
  dotenv.config()
  const buffer = fs.readFileSync(process.env.PHOTO_LISTS_CONFIG ?? "")
  const photoGroups = JSON.parse(buffer.toString()) as PhotoGroupConfig[]
  return photoGroups.map((pg) => createPhotoManager(pg))
}

export const photoManagers = initializePhotoManagers()

export function createPhotoManager(photoGroup: PhotoGroupConfig) {
  const paths = photoGroup.files
  const cache = new Map<string, CacheEntry<PhotoData>>()
  const randomOrder = shuffle(range(0, paths.length))
  const photoGroupMeta: PhotoGroupMeta = {
    name: photoGroup.group,
    photosCount: paths.length,
  }

  let currentIndex = 0

  async function ensurePhotoLoaded(
    index: number
  ): Promise<PhotoData | undefined> {
    const path: string = paths[randomOrder[index]]
    if (cache.has(path)) {
      winston.debug(`Photo found in cache (${path})`)
      const entry = cache.get(path)!
      entry.lastAccess = Date.now()
      return Promise.resolve(entry.data)
    }
    winston.debug(`Photo not found in cache, loading (${path})`)
    let loaded: PhotoData | undefined = undefined
    try {
      loaded = await loadPhoto(path)
    } catch (error) {
      return undefined
    }
    cache.set(path, {
      data: loaded,
      lastAccess: Date.now(),
    })
    winston.debug(`Photo loaded and added to cache (${path}). `)
    const used = process.memoryUsage().heapUsed / 1024 / 1024
    winston.debug(
      `${cache.size} entries in cache. Approximately ${
        Math.round(used * 100) / 100
      } MB`
    )
    return Promise.resolve(loaded)
  }

  async function loadPhoto(path: string): Promise<PhotoData> {
    if (!fs.existsSync(path)) {
      throw new Error(`file '${path}' does not exist`)
    }
    const file = await asyncfs.open(path)

    const imageFileName = basename(path)
    const fileStats = await file.stat()
    const bytes = await file.readFile()
    const sharpBuffer = sharp(bytes, {
      failOn: "none",
    })
    const exifData = await getExifData(bytes)

    const md = await sharpBuffer.metadata()
    const isVertical = md.orientation ?? 0 >= 5
    const resized = await sharpBuffer
      .rotate()
      .resize(isVertical ? { height: 1920 } : { width: 1920 })
      .toBuffer()

    await file.close()

    return {
      contentType: "image/jpeg",
      data: resized,
      fileName: imageFileName,
      ctime: fileStats.ctime,
      mtime: fileStats.mtime,
      exifDate: exifData.exif.DateTimeOriginal ?? "",
    }
  }

  async function getExifData(buffer: Buffer): Promise<ExifData> {
    return new Promise<ExifData>((resolve, reject) => {
      try {
        new ExifImage(buffer, function (error, exifData) {
          if (error) {
            reject(error.message)
          } else {
            resolve(exifData)
          }
        })
      } catch (error) {
        winston.debug(`Error when loading EXIF data (${error})`)
        reject(error)
      }
    })
  }

  async function getRandomPhoto(): Promise<PhotoData | undefined> {
    try {
      const photo = await ensurePhotoLoaded(currentIndex)
      // Pre-load a few next photos
      range(1, 4).forEach((i) =>
        /* no await here! */ ensurePhotoLoaded(normalizeIndex(currentIndex + i))
      )
      currentIndex = normalizeIndex(currentIndex + 1)
      return photo
    } catch (error) {
      winston.warn(`Error when trying to load photo: ${error}`)
      currentIndex = normalizeIndex(currentIndex + 1)
      return undefined
    }
  }

  function normalizeIndex(idx: number): number {
    return idx % paths.length
  }

  return {
    getRandomPhoto,
    photoGroupMeta,
  }
}
