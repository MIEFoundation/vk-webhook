async function GetGroupInfo (id, env) {
  const res = await fetch(`${env.VKAPI_BASE_URL ?? 'https://api.vk.com'}/method/groups.getById?group_id=${id}&v=5.103`, {
    headers: env.VKAPI_ACCESS_TOKEN ? {
      Authorization: `Bearer ${env.VKAPI_ACCESS_TOKEN}`
    } : {},
    cf: {
      cacheEverything: true,
      cacheKey: id,
      cacheTtlByStatus: { "200-299": 7 * 24 * 60 * 60, "400-599": -1 }
    }
  })
  const { error, response } = await res.json()
  if (error) throw error
  return response
}

export async function PostToEmbed({ object, group_id }, env) {
  const { name, screen_name, photo_50: icon_url } = await GetGroupInfo(group_id, env)
  const mainEmbed = {
    author: {
      name,
      url: `https://vk.com/${screen_name}`,
      icon_url
    },
    color: 3169491,
    url: `https://vk.com/wall${object.owner_id}_${object.id}`,
    timestamp: new Date(object.date * 1000).toISOString(),
    description: object.text,
    footer: {
      text: "NOTE: Technical limitations may prevent to represent actual content of post"
    }
  }
  const embeds = []
  for (const { type, photo, video } of object.attachments) {
    if (type === 'photo') {
      embeds.push({
        url: mainEmbed.url,
        image: { url: photo.sizes[photo.sizes.length - 1].url }
      })
      continue
    }
    if (type === 'video') {
      embeds.push({
        url: mainEmbed.url,
        image: { url: video.image.url }
      })
      continue
    }
  }
  if (object.copyright) {
    if (!embeds.length) embeds.push({})
    embeds.push({
      title: `Source (${object.copyright.name})`,
      description: object.copyright.link
    })
  }
  return {
    embeds: [Object.assign(mainEmbed, embeds[0]), ...embeds.slice(1)],
    allowed_mentions: {
      parse: []
    }
  }
}
