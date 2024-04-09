import { requestUrl, TFile } from 'obsidian'
import { CodenaryContent } from 'src/types'
import axios from 'axios'
import * as fs from 'fs'

const API_URL = 'https://api.codenary.co.kr'

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
		const result = requestUrl(
			{
				url: `${API_URL}/contents/obsidians/extract-techstacks`,
				method: 'POST',
				contentType: 'application/json',
				body: JSON.stringify({ text }),
			})

		return await result.json
	}

	async publishContent(post: CodenaryContent) {
		const result = requestUrl({
			url: `${API_URL}/contents/obsidians`,
			method: 'POST',
			contentType: 'application/json',
			body: JSON.stringify({ ...post, user_token: this.userToken }),
		})
		return result.json
	}

	async updateContent(contentUid: number, post: CodenaryContent) {
		const result = requestUrl({
			url: `${API_URL}/contents/obsidians/${contentUid}`,
			method: 'PUT',
			contentType: 'application/json',
			body: JSON.stringify({
				...post,
				user_token: this.userToken,
			}),
		})
		return result.json
	}

	async imageUpload(file: TFile, absolutePath: string): Promise<string | null> {

		try {
			const result = requestUrl({
				url: `${API_URL}/contents/presigned_url?type=editor&mime_type=image/png`,
				contentType: 'application/json',
				method: 'GET',

			})
			const { presigned_url, key } = await result.json
			const buffer = fs.readFileSync(absolutePath + '/' + file.path)
			await axios.put(presigned_url, buffer)
			return key
		} catch (error) {
			console.error(error)
		}

		return null
	}
}
