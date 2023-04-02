import { Router } from "express"
import { photos } from "./photos"

const router: Router = Router()

const routes: {
  [key: string]: (router: Router) => void
} = { photos }

for (const route in routes) {
  routes[route](router)
}

export { router }
