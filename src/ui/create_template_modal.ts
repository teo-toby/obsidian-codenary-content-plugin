/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Modal, Notice, Setting } from 'obsidian'
import CustomLoadingComponent from './loading_component'
import CodenaryContentPlugin from '../main'

export class CreateTemplateModal extends Modal {

	title: string = '자바스크립트 동기/비동기'

	constructor(
		readonly plugin: CodenaryContentPlugin,
		readonly callback: (title: string) => void,
	) {
		super(plugin.app)
	}

	validateRequiredFields() {
		if (!this.title || this.title.trim() === '') {
			new Notice('제목을 입력해주세요.')
			return false
		}
		return true
	}

	async handleSubmit() {
		if (this.validateRequiredFields()) {
			this.callback(this.title)
			this.close()
		}
	}

	createUI(contentEl: HTMLElement) {
		new Setting(contentEl)
			.setName('제목을 입력해주세요.')
			.setDesc('작성하실 컨텐츠의 제목을 입력해주세요.')
			.addText(text => text
				.setPlaceholder('Enter content title')
				.setValue(this.title)
				.onChange((value) => {
					this.title = value
				}))

		new Setting(contentEl)
			.addButton(btn => {
				btn.setButtonText('취소')
				btn.onClick(() => this.close())
			})
			.addButton(btn => {
				btn.setCta()
				btn.setButtonText('생성')
				btn.onClick(() => this.handleSubmit())
			})
	}

	async onOpen() {
		const { contentEl } = this
		contentEl.createEl('h2', { text: '컨텐츠 템플릿 생성' })
		const loading = CustomLoadingComponent(contentEl)
		this.createUI(contentEl)
		loading.remove()
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
