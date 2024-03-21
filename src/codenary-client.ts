import { request } from 'obsidian'
import { CodenaryContent } from 'src/types'
import axios from 'axios'

const API_URL = 'http://localhost:8000'

export class CodenaryClient {
	private readonly userToken: string

	constructor(
		userToken: string
	) {
		this.userToken = userToken
	}

	async getMyContents() {
		return []
	}

	async getTechstacks(text: string): Promise<{ techstacks: string[] }> {
		const result = await request(
			{ url: `${API_URL}/contents/obsidians/extract-techstacks`, method: 'POST', body: JSON.stringify({ text }) })
		return JSON.parse(result)
	}

	async publishContent(post: CodenaryContent) {
		console.log(post)
		console.log(this.userToken)

		const result = await axios.post(`${API_URL}/contents/obsidians`, {
			...post,
			user_token: this.userToken,
		})
		return result.data
		// const result = await request({ url: `${API_URL}/contents/obsidians`, method: 'POST',
		// 	body: JSON.stringify({
		// 		...post,
		// 		user_token: this.userToken,
		// 	}) })
		// const json = JSON.parse(result)
		// return json
	}
}
