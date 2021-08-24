# vk-webhook

A PM2-compatible NodeJS service for triggering Discord webhook on VK post submission.

A sample of app config in `ecosystem.config.js`:
```
{
	name: "webhook",
	script: "./vk-webhook/app.js",
	waitReady: true,
	env: {
		POLLING_GROUP_ID: ...,
		EMBED_NAME: '...',
		BASE_URL: 'https://vk.com/...',
		IMAGE_URL: 'https://cdn.discordapp.com/icons/...',
		WEBHOOK_URL: 'https://discord.com/api/webhooks/...',
		TOKEN: '...'
	}
}
```
