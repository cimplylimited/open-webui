<script>
	import { marked } from 'marked';
	import { replaceTokens, processResponseContent } from '$lib/utils';
	import { user } from '$lib/stores';

	import markedExtension from '$lib/utils/marked/extension';
	import markedKatexExtension from '$lib/utils/marked/katex-extension';

	import MarkdownTokens from './Markdown/MarkdownTokens.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let id;
	export let content;
	export let model = null;
	export let save = false;

	export let sourceIds = [];
	export let onSourceClick = () => {};

	let tokens = [];

	const options = {
		throwOnError: false
	};

	marked.use(markedKatexExtension(options));
	marked.use(markedExtension(options));

	$: {
		if (!content) {
			tokens = [];
		} else {
			const processedContent = replaceTokens(
				processResponseContent(content),
				sourceIds,
				model?.name,
				$user?.name
			);

			try {
				tokens = marked.lexer(processedContent);
			} catch (error) {
				console.warn('Failed to parse markdown tokens, using plain text fallback', error);
				tokens = [{ type: 'text', raw: processedContent, text: processedContent }];
			}
		}
	}
</script>

{#key id}
	<MarkdownTokens
		{tokens}
		{id}
		{save}
		{onSourceClick}
		on:update={(e) => {
			dispatch('update', e.detail);
		}}
		on:code={(e) => {
			dispatch('code', e.detail);
		}}
	/>
{/key}
