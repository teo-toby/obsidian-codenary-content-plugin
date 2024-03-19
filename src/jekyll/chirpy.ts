import { Temporal } from '@js-temporal/polyfill'
import O2Plugin from '../main'
import * as fs from 'fs'
import { Editor, Notice, TFile } from 'obsidian'
import { vaultAbsolutePath } from '../utils'
import { ConverterChain } from '../core/ConverterChain'
import axios from 'axios'
import CodenaryContentPlugin from '../main'

export async function uploadContent(plugin: O2Plugin, editor: Editor) {
	const text = editor.getValue()
	if (plugin.app.workspace.activeEditor && plugin.app.workspace.activeEditor.file) {

		const targetFilePath = `${(vaultAbsolutePath(plugin))}/post/_posts/${plugin.app.workspace.activeEditor.file.name}`
		fs.writeFile(targetFilePath, text, (err) => {
			if (err) {
				console.error(err)
				new Notice(err.message)
				throw err
			}
		})

		const html = plugin.app.workspace.containerEl.getElementsByClassName('markdown-source-view').item(0)

		if (html) {

			const result = await axios.post('http://localhost:8000/admin/batches/contents/add-content-batch', {
				type: 'manual',
				type_id: '2',
				title: plugin.app.workspace.activeEditor.file.basename,
				summary: text.slice(0, 50),
				text: text,
				user_id: '9cc4a239-e240-40b4-a2c3-3c79a4929dae',
				image_url: null,
				tags: [ 'test1', 'test2' ],
				techstack_ids: [ 'typescript' ],
				duration: 60000,
				url: 'https://codenary.co.kr',
				origin_at: new Date().valueOf(),

			})
			console.log(result.data)

		}

	}

}

// TODO: write test
export async function convertToChirpy(plugin: O2Plugin) {
	// validation
	await validateSettings(plugin)
	await backupOriginalNotes(plugin)


	try {
		const markdownFiles = await renameMarkdownFile(plugin)
		for (const file of markdownFiles) {

			const result = ConverterChain.create()
			// .chaining(frontMatterConverter)
			// .chaining(resourceLinkConverter)
			// .chaining(curlyBraceConverter)
			// .chaining(new WikiLinkConverter())
			// .chaining(new CalloutConverter())
			// .chaining(new FootnotesConverter())
			// .chaining(new CommentsConverter())
			// .chaining(new EmbedsConverter())
				.converting(await plugin.app.vault.read(file))

			await plugin.app.vault.modify(file, result)
		}

		// await moveFilesToChirpy(plugin);
		new Notice('Chirpy conversion complete.')
	} catch (e) {
		// TODO: move file that occurred error to backlog folder
		console.error(e)
		new Notice('Chirpy conversion failed.')
	}
}

async function validateSettings(plugin: CodenaryContentPlugin) {
	const adapter = plugin.app.vault.adapter
	if (!await adapter.exists(plugin.settings.attachmentsFolder)) {
		if (plugin.settings.attachmentsFolder) {
			new Notice(`Auto create attachments folder: ${plugin.settings.attachmentsFolder}.`, 5000)
			await adapter.mkdir(plugin.settings.attachmentsFolder)
		} else {
			new Notice(`Attachments folder ${plugin.settings.attachmentsFolder} does not exist.`, 5000)
			throw new Error(`Attachments folder ${plugin.settings.attachmentsFolder} does not exist.`)
		}
	}

}

function getFilesInContentsFolder(plugin: O2Plugin): TFile[] {
	return plugin.app.vault.getMarkdownFiles()
		.filter((file: TFile) => file.path.startsWith(plugin.settings.contentFolder))
}
