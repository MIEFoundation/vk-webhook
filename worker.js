import IndexPageContent from './index.html'
import LinkPageContent from './link.html'
import { PostToEmbed } from './converter'

const API_PREFIX = '/api/'
const API_PREFIX_LENGTH = API_PREFIX.length
const API_REGEX = /^(?<id>\d+):(?<confirm>[0-9a-f]{8})\/(?<guild>\d+)\/(?<token>.+)$/i;

function OnGetRequest(request) {
  const url = new URL(request.url)
  switch (url.pathname) {
    case '/': return new Response(
      IndexPageContent.replaceAll(/[\t\n]+|\s(?={)|(?<=:)\s/, ''),
      {
        headers: {
          "Cache-Control": "public, max-age=604800",
          "Content-Type": "text/html; charset=utf-8"
        }
      }
    )
    case '/link': {
      const url = url.origin + API_PREFIX
        + url.searchParams.get('id') + ':' + url.searchParams.get('confirm')
        + '/' + (url.searchParams.get('url') ?? '').slice('https://discord.com/api/webhooks/'.length)
      return new Response(
        LinkPageContent
          .replaceAll(/[\t\n]+|\s(?={)|(?<=:)\s/, '')
          .replace('{{url}}', url),
        {
          headers: {
            "Cache-Control": "private, no-cache",
            "Content-Type": "text/html; charset=utf-8"
          }
        }
      )
    }
    default: return new Response(null, { status: 404 })
  }
}

async function OnPostRequest(request) {
  const url = new URL(request.url)
  if (!url.pathname.startsWith(API_PREFIX)) throw new Response(null, { status: 404 })
  const path = url.pathname.slice(API_PREFIX_LENGTH)
  if (!API_REGEX.test(path)) throw new Response(null, { status: 400 })
  const { groups: params } = API_REGEX.exec(path)
  let type, object, group_id
  try {
    ({ type, object, group_id } = await request.json())
    if (group_id != +params.id) throw new Response(null, { status: 403 })
    if (type === 'confirmation') return new Response(params.confirm)
  } catch (_) {
    throw new Response(null, { status: 422 })
  }
  await processEvent(
    { type, object, group_id },
    `https://discord.com/api/webhooks/${params.guild}/${params.token}`,
    env
  )
  return new Response('ok')
}

function OnAnyRequest() {
  return new Response(null, {
    status: 405,
    headers: {
      Allow: 'GET, POST'
    }
  })
}

async function processEvent(event, webhook, env) {
  if (event.type === 'wall_post_new') {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(await PostToEmbed(event, env))
    })
    if (!res.ok) throw res
  }
}

export default {
  async fetch(request, _, env) {
    try {
      switch (request.method) {
        case 'GET': return OnGetRequest(request)
        case 'POST': return await OnPostRequest(request, env)
        default: return OnAnyRequest()
      }
    } catch (error) {
      if (error instanceof Response) return error
      return new Response(error.toString(), {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Type": "text/plain; charset=utf-8"
        }
      })
    }
  },
}
