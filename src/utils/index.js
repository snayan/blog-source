import { ICONS } from "../constants"

export const getIcon = name => {
  let icon

  switch (name) {
    case "twitter":
      icon = ICONS.TWITTER
      break
    case "github":
      icon = ICONS.GITHUB
      break
    case "vkontakte":
      icon = ICONS.VKONTAKTE
      break
    case "telegram":
      icon = ICONS.TELEGRAM
      break
    case "email":
      icon = ICONS.EMAIL
      break
    case "rss":
      icon = ICONS.RSS
      break
    default:
      icon = {}
      break
  }

  return icon
}

export const getQuery = name => {
  const url = window.location.href
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)")
  const results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ""
  return decodeURIComponent(results[2].replace(/\+/g, " "))
}
