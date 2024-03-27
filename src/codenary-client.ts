import { TFile } from 'obsidian'
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
		const result = await axios.post(`${API_URL}/contents/obsidians/extract-techstacks`, {
			text,
		})
		return result.data
	}

	async publishContent(post: CodenaryContent) {
		const result = await axios.post(`${API_URL}/contents/obsidians`, {
			...post,
			user_token: this.userToken,
		})
		return result.data
	}

	async updateContent(contentUid: number, post: CodenaryContent) {
		const result = await axios.put(`${API_URL}/contents/obsidians/${contentUid}`, {
			...post,
			user_token: this.userToken,
		})
		return result.data
	}

	async imageUpload(file: TFile, absolutePath: string): Promise<string | null> {
		try {
			const result = await axios.get(`${API_URL}/contents/presigned_url`, {
				params: {
					type: 'editor',
					mime_type: 'image/png',
				},
			})
			const { presigned_url, key } = result.data
			const buffer = fs.readFileSync(absolutePath + '/' + file.path)
			await axios.put(presigned_url, buffer)
			return key
		} catch (error) {
			console.error(error)
		}

		return null
	}
}
