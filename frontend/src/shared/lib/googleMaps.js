import { Loader } from "@googlemaps/js-api-loader"
import { getGoogleMapsApiKey } from "./googleMapsApiKey"

// Google may only be loaded once per page, with one set of options, so every map in the app goes through here.
let loading = null

// Resolves to the `google` namespace, or null when no API key is configured.
export function loadGoogleMaps() {
  if (!loading) {
    loading = (async () => {
      const apiKey = await getGoogleMapsApiKey()
      if (!apiKey) return null
      return new Loader({ apiKey, version: "weekly", libraries: ["places", "geometry"] }).load()
    })().catch((err) => {
      loading = null
      throw err
    })
  }
  return loading
}
