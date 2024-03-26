import { FrontMatterCache, getLinkpath, MarkdownView, Notice, Plugin, stringifyYaml,
	TFile } from 'obsidian'
import { CodenaryContentPluginSettings, CodenaryContentSetting, CodenaryContentSettingTab } from './settings'
import { SubmitConfirmModal } from 'src/ui/submit_confirm_modal'
import { vaultAbsolutePath } from 'src/utils'
import * as fs from 'fs'
import { CreateTemplateModal } from 'src/ui/create_template_modal'
import { CodenaryContent } from 'src/types'
import { CodenaryClient } from 'src/codenary-client'

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
		this.addCommand({
			id: 'obsidian-codenary-content-create',
			name: 'Create Codenary Content Template',
			callback: () => this.createTemplate(),
		})
		this.addSettingTab(new CodenaryContentSettingTab(this.app, this))
	}

	async loadSettings() {
		this._settings = Object.assign(new CodenaryContentSetting(), await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this._settings)
	}

	createCodenaryContentTemplate(plugin: CodenaryContentPlugin, title: string) {
		const contentFolder = this.settings?.contentFolder || 'codenary'
		let filename = title
		const splitSpace = title.split(' ')
		filename = splitSpace.join('_')
		const splitSlash = filename.split('/')
		filename = splitSlash.join('_')
		const targetFilePath = `${(vaultAbsolutePath(plugin))}/${contentFolder}/${filename}.md`

		const text = `---\n${stringifyYaml({
			title: title,
			tags: [ 'Tag1', 'Tag2' ],
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
			const frontMatter = await this.processFrontMatter(file)
			const post = await this.parsePostData(file)
			if (!post.text) {
				throw new Error('Content is empty.')
			}
			new SubmitConfirmModal(this, post, async (post: CodenaryContent) => {
				const result = await this.extractTechstack(post.title + post.text)
				if (result.success) {
					const contentUid = frontMatter['content_uid']
					if (contentUid) {
						const updateResult = await this.updateCodenaryContent(contentUid, {
							...post,
							techstack_ids: result.techstacks,
						})
						if (updateResult) {
							const newFrontMatter = stringifyYaml({
								...frontMatter,
								techstacks: result.techstacks,
							})
							const fileContent = `---\n${newFrontMatter}---\n${post.text}`
							await file.vault.modify(file, fileContent)
						}
					} else {
						const addResult = await this.addCodenaryContent({
							...post,
							techstack_ids: result.techstacks,
						})
						if (addResult) {
							const newFrontMatter = stringifyYaml({
								...frontMatter,
								techstacks: result.techstacks,
								content_uid: addResult,
							})
							const fileContent = `---\n${newFrontMatter}---\n${post.text}`
							await file.vault.modify(file, fileContent)
						}
					}

				}
			}).open()
		} catch (e: any) {
			new Notice(e.toString())
		}
	}

	async createTemplate() {
		try {
			new CreateTemplateModal(this, (title: string) => {
				this.createCodenaryContentTemplate(this, title)
			}).open()
		} catch (e: any) {
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
		this.app
		const fileContent = await this.app.vault.read(file)
		const frontMatter = await this.processFrontMatter(file)
		const body = await this.renderLinksToFullPath(
		  this.removeObsidianComments(this.stripFrontmatter(fileContent)),
			'attachments'
		)
		const title = frontMatter?.title

		return {
			type_id: file.stat.ctime.toString(),
			title: title,
			text: body,
			tags: frontMatter?.tags || [],
			techstack_ids: [],
			origin_at: file.stat.ctime || new Date().valueOf(),

		}
	}

	async processFrontMatter(file: TFile): Promise<FrontMatterCache> {
		return new Promise(resolve => this.app.fileManager.processFrontMatter(file, resolve))
	}

	stripFrontmatter(content: string) {
		return content.trimStart().replace(frontmatterRegex, '')
	}

	async renderLinksToFullPath(text: string, attachPath: string): Promise<string> {

		const absolutePath = vaultAbsolutePath(this)
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
						attachPath,
					)
					if (linkedFile?.extension === 'md') {
						const frontmatter = this.app.metadataCache.getFileCache(linkedFile)?.frontmatter
						if (frontmatter && 'content_uid' in frontmatter) {
						  const { content_uid, title } = frontmatter
						  result = result.replace(
								linkMatch,
								`[${title || prettyName}](https://codenary.co.kr/contents/detail/${content_uid})`,
						  )
						} else {
						  result = result.replace(linkMatch, prettyName)
						}
					} else {
						if (!linkedFile) {
							// 내부 파일 링크가 없는 경우 prettyName만 표시한다.
							result = result.replace(linkMatch, prettyName)
						} else {
							const imageS3Key = await this.uploadImage(linkedFile, absolutePath)
							if (imageS3Key) {
								result = result.replace(linkMatch,
									`[${linkedFile.basename}](https://static-dev.codenary.co.kr/${imageS3Key})`
								)
							} else {
								result = result.replace(linkMatch, prettyName)
							}

						}
					}

				} catch (e) {
					continue
				}
		  }
		}

		return result
	}

	async uploadImage(file: TFile, absolutePath: string) {
		const userToken = this.settings?.userToken
		if (!userToken) {
			new Notice('User Token Required')
			return {
				success: false,
				techstacks: [],
			}
		} else {
			const client = new CodenaryClient(userToken)
			const s3Key = await client.imageUpload(file, absolutePath)
			return s3Key
		}

	}

	removeObsidianComments(content: string) {
		return content.replace(/^\n?%%(.+?)%%\n?$/gms, '')
	}

	async extractTechstack(text: string) {
		const userToken = this.settings?.userToken
		if (!userToken) {
			new Notice('User Token Required')
			return {
				success: false,
				techstacks: [],
			}
		} else {
			const client = new CodenaryClient(userToken)
			const result = await client.getTechstacks(text)
			return {
				success: true,
				techstacks: result.techstacks,
			}
		}
	}

	async updateCodenaryContent(contentUid: number, content: CodenaryContent): Promise<Boolean> {
		const userToken = this.settings?.userToken
		if (!userToken) {
			new Notice('User Token Required')
			return false
		} else {
			const client = new CodenaryClient(userToken)
			const result = await client.updateContent(contentUid, content)
			new Notice('Update Succces')
			return result
		}
	}

	async addCodenaryContent(content: CodenaryContent): Promise<number | null> {
		const userToken = this.settings?.userToken
		if (!userToken) {
			new Notice('User Token Required')
			return null
		} else {
			const client = new CodenaryClient(userToken)
			const result = await client.publishContent(content)
			new Notice('Upload Succces')
			return result.id
		}
	}
}
