const { WebhookClient, MessageEmbed } = require('discord.js')
const { VK } = require('vk-io')
const { TOKEN, BASE_URL, EMBED_NAME, IMAGE_URL, WEBHOOK_URL, POLLING_GROUP_ID } = process.env
const [ WEBHOOK_ID, WEBHOOK_SECRET ] = WEBHOOK_URL.slice(WEBHOOK_URL.indexOf('/webhooks/') + '/webhooks/'.length).split('/')

const HASHTAGS_TO_EMOJI = {
	media: '<:mie:740482227971817614>',
	fun: '<:mie:740482227971817614>',
	discuss: '<:mie:740482227971817614>',
	announcement: '<:mie:740482227971817614>',
	etc: '<:mie:740482227971817614>',
	DDLC: '<:mie:740482227971817614>',
	Sayori: '<:sayori:740482689508835328>',
	Yuri: '<:yuri:740482689366229073>',
	Natsuki: '<:natsuki:740482688942866512>',
	MC: '<:mie:740482227971817614>',
	NSFW: '<:bow:740482573872136233>',
}

async function main (callback) {
	const vk = new VK({
		apiHeaders: { 'User-Agent': 'MIEFoudation/Webhook (+https://vk.com/@miefoundation-tech)' },
		language: 'en',
		pollingGroupId: POLLING_GROUP_ID,
		token: TOKEN
	})
	const webhook = new WebhookClient(WEBHOOK_ID, WEBHOOK_SECRET)
	vk.updates.on('wall_post_new', callback.bind(null, webhook))
	process.on('SIGINT', () => vk.updates.stop().then(() => process.exit(0)))
	await vk.updates.start()
}

async function onPost (webhook, ctx) {
	const fields = []
	const { wall } = ctx
	await wall.loadAttachmentPayload()
	if (wall.postType !== 'post') return
	console.log('New post', wall)
	const text = wall.text.replace(/#(\w+)(@\w+)?/g, (m, tag) => {
		if (!HASHTAGS_TO_EMOJI[tag]) return m
		fields.push({
			name: HASHTAGS_TO_EMOJI[tag],
			value: `[${m}](${BASE_URL}/${tag})`,
			inline: true
		})
		return ''
	})
	const { copyright } = wall.payload

	const message = new MessageEmbed()
		.setColor(`#305CD3`)
		.setAuthor(EMBED_NAME, IMAGE_URL, BASE_URL)
		.setTitle('New post on VK')
		.setURL(`${BASE_URL}?w=${wall.toString()}`)
		.setDescription(text)
		.addFields(fields)
		.setFooter('NOTE: Technical limitations may prevent to represent actual content of post')
		.setTimestamp(wall.createdAt * 1000)

	for (const attach of wall.attachments) {
		if (attach.type === 'photo') {
			message.setImage(attach.largeSizeUrl || attach.mediumSizeUrl || attach.smallSizeUrl)
			break
		}
	}

	webhook.send('', [
		message,
		...(copyright ? [
			new MessageEmbed()
			.setTitle(`Source (${copyright.name})`)
			.setDescription(`${copyright.link}\n**NOTE**: MIEFoundation may not own content above (yet).`)
		] : [])
	])
}

main()
	.then(() => (console.log('Ready!'), process.send('ready')))
	.catch(err => (console.error(err), process.exit(1)))
