<script lang="ts">
	import { marked } from 'marked';
	import TurndownService from 'turndown';
	const turndownService = new TurndownService({
		codeBlockStyle: 'fenced',
		headingStyle: 'atx'
	});
	turndownService.escape = (string) => string;

	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	const eventDispatch = createEventDispatcher();

	import { TextSelection } from 'prosemirror-state';

	import { Editor } from '@tiptap/core';

	import { AIAutocompletion } from './RichTextInput/AutoCompletion.js';

	import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
	import Placeholder from '@tiptap/extension-placeholder';
	import Highlight from '@tiptap/extension-highlight';
	import Typography from '@tiptap/extension-typography';
	import StarterKit from '@tiptap/starter-kit';
	import { all, createLowlight } from 'lowlight';

	import { PASTED_TEXT_CHARACTER_LIMIT } from '$lib/constants';

	const lowlight = createLowlight(all);

	export type EditorSnapshot = {
		promptText: string;
	};

	export let className = 'input-prose';
	export let placeholder = 'Type here...';
	/** One-time initial content (markdown). Use setContent() for programmatic updates. */
	export let initialContent = '';
	export let id = '';

	export let preserveBreaks = false;
	export let generateAutoCompletion: Function = async () => null;
	export let autocomplete = false;
	export let messageInput = false;
	export let shiftEnter = false;
	export let largeTextAsFile = false;

	// Callback-based contract — replaces bind:value
	export let onContentChanged: (snapshot: EditorSnapshot, snapshotId: number) => void = () => {};
	export let onSelectionChanged: (range: { from: number; to: number }) => void = () => {};
	export let onSubmitIntent: (intent: { type: string }) => void = () => {};

	let element: HTMLDivElement;
	let editor: Editor;

	let contentSyncRunId = 0;
	let lastEmittedMarkdown = '';
	let snapshotCounter = 0;

	/** True when the user has typed since the last setContent() call. */
	export let hasUncommittedChanges = false;

	let lastKeydownAt = 0;
	let keystrokeObserver: MutationObserver | null = null;

	const normalizeMarkedInput = (input: string) => (input ?? '').replaceAll(`\n<br/>`, `<br/>`);

	const parseMarkdownContent = async (input: string, attempts = 3, interval = 100): Promise<string> => {
		let remainingAttempts = attempts;

		while (remainingAttempts > 0) {
			try {
				return await Promise.resolve(
					marked.parse(normalizeMarkedInput(input), { breaks: false })
				);
			} catch (error) {
				remainingAttempts -= 1;
				if (remainingAttempts <= 0) {
					console.warn('EditorPane: failed to parse markdown, using raw fallback', error);
					return input ?? '';
				}
				await new Promise((resolve) => setTimeout(resolve, interval));
			}
		}

		return input ?? '';
	};

	const syncContentFromMarkdown = async (markdown: string) => {
		// Set synchronously before the await so onTransaction fired by setContent
		// sees a matching lastEmittedMarkdown and does not re-enter.
		lastEmittedMarkdown = markdown;
		const syncId = ++contentSyncRunId;
		const parsedContent = await parseMarkdownContent(markdown, 1, 0);

		if (!editor || syncId !== contentSyncRunId) return;

		editor.commands.setContent(parsedContent);
		selectTemplate();
	};

	/**
	 * Set editor content from markdown.
	 * force=false: returns false without changing content when hasUncommittedChanges is true.
	 * force=true: always replaces content regardless of uncommitted state.
	 */
	export function setContent(markdown: string, force = false): boolean {
		if (!force && hasUncommittedChanges) return false;
		hasUncommittedChanges = false;
		syncContentFromMarkdown(markdown);
		return true;
	}

	function findNextTemplate(doc, from = 0) {
		const patterns = [
			{ start: '[', end: ']' },
			{ start: '{{', end: '}}' }
		];

		let result = null;

		doc.nodesBetween(from, doc.content.size, (node, pos) => {
			if (result) return false;
			if (node.isText) {
				const text = node.text;
				let index = Math.max(0, from - pos);
				while (index < text.length) {
					for (const pattern of patterns) {
						if (text.startsWith(pattern.start, index)) {
							const endIndex = text.indexOf(pattern.end, index + pattern.start.length);
							if (endIndex !== -1) {
								result = {
									from: pos + index,
									to: pos + endIndex + pattern.end.length
								};
								return false;
							}
						}
					}
					index++;
				}
			}
		});

		return result;
	}

	function selectNextTemplate(state, dispatch) {
		const { doc, selection } = state;
		const from = selection.to;
		let template = findNextTemplate(doc, from);

		if (!template) {
			template = findNextTemplate(doc, 0);
		}

		if (template) {
			if (dispatch) {
				const tr = state.tr.setSelection(TextSelection.create(doc, template.from, template.to));
				dispatch(tr);
			}
			return true;
		}
		return false;
	}

	const selectTemplate = () => {
		if (initialContent !== '') {
			setTimeout(() => {
				const templateFound = selectNextTemplate(editor.view.state, editor.view.dispatch);
				if (!templateFound) {
					const endPos = editor.view.state.doc.content.size;
					editor.view.dispatch(
						editor.view.state.tr.setSelection(
							TextSelection.create(editor.view.state.doc, endPos)
						)
					);
				}
			}, 0);
		}
	};

	onMount(async () => {
		if (preserveBreaks) {
			turndownService.addRule('preserveBreaks', {
				filter: 'br',
				replacement: () => '<br/>'
			});
		}

		let content = await parseMarkdownContent(initialContent);

		editor = new Editor({
			element: element,
			extensions: [
				StarterKit.configure({
					codeBlock: false
				}),
				CodeBlockLowlight.configure({
					lowlight
				}),
				Highlight,
				Typography,
				Placeholder.configure({ placeholder }),
				...(autocomplete
					? [
							AIAutocompletion.configure({
								generateCompletion: async (text) => {
									if (text.trim().length === 0) return null;

									const suggestion = await generateAutoCompletion(text).catch(() => null);
									if (!suggestion || suggestion.trim().length === 0) return null;

									return suggestion;
								}
							})
						]
					: [])
			],
			content: content,
			autofocus: messageInput ? true : false,
			onTransaction: ({ transaction }) => {
				editor = editor;
				if (!transaction.docChanged) return;

				let newValue: string;
				try {
					newValue = turndownService
						.turndown(
							editor
								.getHTML()
								.replace(/<p><\/p>/g, '<br/>')
								.replace(/ {2,}/g, (m) => m.replace(/ /g, ' '))
						)
						.replace(/ /g, ' ');

					if (!preserveBreaks) {
						newValue = newValue.replace(/<br\/>/g, '');
					}
				} catch (err) {
					console.warn('EditorPane: turndown failed, falling back to textContent', err);
					newValue = editor.state.doc.textContent;
				}

				// Cascade breaker: if content matches what we last set, this transaction
				// was triggered by setContent(), not user input — skip the event.
				if (newValue === lastEmittedMarkdown) return;

				lastEmittedMarkdown = newValue;
				hasUncommittedChanges = true;

				if (editor.isActive('paragraph') && newValue === '') {
					editor.commands.clearContent();
				}

				onContentChanged({ promptText: newValue }, ++snapshotCounter);
				onSelectionChanged({
					from: editor.state.selection.from,
					to: editor.state.selection.to
				});
			},
			editorProps: {
				attributes: { id },
				handleDOMEvents: {
					focus: (view, event) => {
						eventDispatch('focus', { event });
						return false;
					},
					keyup: (view, event) => {
						eventDispatch('keyup', { event });
						return false;
					},
					keydown: (view, event) => {
						if (messageInput) {
							if (event.key === 'Tab') {
								const handled = selectNextTemplate(view.state, view.dispatch);
								if (handled) {
									event.preventDefault();
									return true;
								}
							}

							if (event.key === 'Enter') {
								const { state } = view;
								const { $head } = state.selection;

								function isInside(nodeTypes: string[]): boolean {
									let currentNode = $head;
									while (currentNode) {
										if (nodeTypes.includes(currentNode.parent.type.name)) {
											return true;
										}
										if (!currentNode.depth) break;
										currentNode = state.doc.resolve(currentNode.before());
									}
									return false;
								}

								const isInCodeBlock = isInside(['codeBlock']);
								const isInList = isInside(['listItem', 'bulletList', 'orderedList']);
								const isInHeading = isInside(['heading']);

								if (isInCodeBlock || isInList || isInHeading) {
									return false;
								}
							}

							if (shiftEnter) {
								if (event.key === 'Enter' && event.shiftKey && !event.ctrlKey && !event.metaKey) {
									editor.commands.setHardBreak();
									view.dispatch(view.state.tr.scrollIntoView());
									event.preventDefault();
									return true;
								}
							}
						}
						eventDispatch('keydown', { event });
						return false;
					},
					paste: (view, event) => {
						if (event.clipboardData) {
							const plainText = event.clipboardData.getData('text/plain');
							if (plainText) {
								if (largeTextAsFile) {
									if (plainText.length > PASTED_TEXT_CHARACTER_LIMIT) {
										eventDispatch('paste', { event });
										event.preventDefault();
										return true;
									}
								}
								return false;
							}

							const hasImageFile = Array.from(event.clipboardData.files).some((file) =>
								file.type.startsWith('image/')
							);
							const hasImageItem = Array.from(event.clipboardData.items).some((item) =>
								item.type.startsWith('image/')
							);

							if (hasImageFile || hasImageItem) {
								eventDispatch('paste', { event });
								event.preventDefault();
								return true;
							}
						}

						view.dispatch(view.state.tr.scrollIntoView());
						return false;
					}
				}
			}
		});

		if (messageInput) {
			selectTemplate();
		}
	});

	onDestroy(() => {
		editor?.destroy();
	});
</script>

<div bind:this={element} class="relative w-full min-w-full h-full min-h-fit {className}" />
