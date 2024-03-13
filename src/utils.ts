import CodenaryContentPlugin from './main'
import { FileSystemAdapter, Notice } from 'obsidian'

export function vaultAbsolutePath(plugin: CodenaryContentPlugin): string {
	const adapter = plugin.app.vault.adapter
	if (adapter instanceof FileSystemAdapter) {
		return adapter.getBasePath()
	}
	new Notice('Vault is not a file system adapter')
	throw new Error('Vault is not a file system adapter')
}
