import { FrontMatterCache, getLinkpath, MarkdownView, Notice, Plugin, stringifyYaml,
	TFile } from 'obsidian'
import { CodenaryContentPluginSettings, CodenaryContentSetting, CodenaryContentSettingTab } from './settings'
import axios from 'axios'
import { SubmitConfirmModal } from 'src/ui/submit_confirm_modal'
import { vaultAbsolutePath } from 'src/utils'
import * as fs from 'fs'
import { CreateTemplateModal } from 'src/ui/create_template_modal'

export const frontmatterRegex = /^---\n(?:((?!---)(.|\n)*?)\n)?---(\n|$)/

export default class CodenaryContentPlugin extends Plugin {
	private _settings?: CodenaryContentPluginSettings

	get settings() {
		return this._settings
	}

	async onload() {
		await this.loadSettings()

		this.addCommand({
			id: 'obsidian-codenary-content-publish',
			name: 'Publish to Codenary',
			callback: () => this.publishCodenaryContent(),
		})
		console.log('1')
		this.addCommand({
			id: 'obsidian-codenary-content-create',
			name: 'Create Codenary Content Template',
			callback: () => this.createTemplate(),
		})
		console.log('2')

		this.addSettingTab(new CodenaryContentSettingTab(this.app, this))
		console.log('3')

	}

	async loadSettings() {
		this._settings = Object.assign(new CodenaryContentSetting(), await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this._settings)
	}

	createCodenaryContentTemplate(plugin: CodenaryContentPlugin, title: string) {
		console.log('========')
		const contentFolder = this.settings?.contentFolder || 'codenary'
		const now = new Date()
		const titleArr = title.split(' ')
		const filename = titleArr.join('_')
		const targetFilePath = `${(vaultAbsolutePath(plugin))}/${contentFolder}/${filename}.md`

		const text = `---\n${stringifyYaml({
			title: title,
			tags: [ 'Tag1', 'Tag2' ],
			created_at: now,
			content_uid: now.valueOf(),
			techstacks: [ 'typescript', 'javascript' ],
		})}---\n`

		fs.writeFile(targetFilePath, text, (err) => {
			if (err) {
				console.error(err)
				new Notice(err.message)
				throw err
			}
		})
	}

	async publishCodenaryContent() {
		try {
			const activeView = this.getActiveView()
			const file = activeView.file
			if (!file) {
				throw new Error('There is no active file.')
			}

			const post = await this.parsePostData(file)
			if (!post.text) {
				throw new Error('Content is empty.')
			}

			new SubmitConfirmModal(this, post, async (post: CodenaryContent) => {
				await this.addCodenaryContent(post)
			}).open()
		} catch (e: any) {
			new Notice(e.toString())
		}
	}

	async createTemplate() {
		console.log('-----------1')
		try {
			console.log('-----------2')
			new CreateTemplateModal(this, (title: string) => {
				this.createCodenaryContentTemplate(this, title)
			}).open()
			console.log('-----------3')
		} catch (e: any) {
			console.log('||||||||||||')
			new Notice(e.toString())
		}
	}

	getActiveView() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView)
		if (!activeView || !activeView.file) {
		  throw new Error('There is no editor view found.')
		}
		return activeView
	}

	async parsePostData(file: TFile): Promise<CodenaryContent> {
		const fileContent = await this.app.vault.read(file)
		const frontMatter = await this.processFrontMatter(file)
		const body = await this.renderLinksToFullPath(
		  this.removeObsidianComments(this.stripFrontmatter(fileContent)),
		  file.path,
		)
		console.log(frontMatter)
		const title = frontMatter?.title
		return {
			title: title,
			summary: body.slice(0, 50),
			text: body,
			user_id: '9cc4a239-e240-40b4-a2c3-3c79a4929dae',
			image_url: null,
			tags: [ 'test1', 'test2' ],
			techstack_ids: [ 'typescript' ],
			duration: 60000,
			url: 'https://codenary.co.kr',
			origin_at: new Date().valueOf(),

		}
	}

	async processFrontMatter(file: TFile): Promise<FrontMatterCache> {
		return new Promise(resolve => this.app.fileManager.processFrontMatter(file, resolve))
	}

	stripFrontmatter(content: string) {
		return content.trimStart().replace(frontmatterRegex, '')
	  }

	async renderLinksToFullPath(text: string, filePath: string): Promise<string> {
		let result = text.toString()

		const linkedFileRegex = /\[\[(.*?)\]\]/g
		const linkedFileMatches = result.match(linkedFileRegex)

		if (linkedFileMatches) {
		  for (const linkMatch of linkedFileMatches) {
				try {
			  const textInsideBrackets = linkMatch.substring(
						linkMatch.indexOf('[') + 2,
						linkMatch.lastIndexOf(']') - 1,
					)
					let [ linkedFileName, prettyName ] = textInsideBrackets.split('|')

					prettyName = prettyName || linkedFileName
					if (linkedFileName.includes('#')) {
						const headerSplit = linkedFileName.split('#')
						linkedFileName = headerSplit[0]
					}
					const linkedFile = this.app.metadataCache.getFirstLinkpathDest(
						getLinkpath(linkedFileName),
						filePath,
					)
					if (!linkedFile) {
						// 내부 파일 링크가 없는 경우 prettyName만 표시한다.
						result = result.replace(linkMatch, prettyName)
					}

				} catch (e) {
					continue
				}
		  }
		}

		return result
	}

	removeObsidianComments(content: string) {
		return content.replace(/^\n?%%(.+?)%%\n?$/gms, '')
	  }

	async addCodenaryContent(content: CodenaryContent) {
		await axios.post('http://localhost:8000/admin/batches/contents/add-content-batch', {
			type: 'manual',
			type_id: '2',
			title: content.title,
			summary: content.summary,
			text: content.text,
			user_id: content.user_id,
			image_url: content.image_url,
			tags: content.tags,
			techstack_ids: content.techstack_ids,
			duration: content.duration,
			url: content.url,
			origin_at: content.origin_at,

		})
	}
}

export interface CodenaryContent {
	title: string,
	summary: string,
	text: string,
	user_id: string,
	image_url: string | null,
	tags: string[],
	techstack_ids: string[],
	duration: number,
	url: string,
	origin_at: number,

}
