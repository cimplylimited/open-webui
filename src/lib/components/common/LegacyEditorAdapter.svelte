<script lang="ts">
	/**
	 * @deprecated
	 * Bridges the old bind:value / DOM-event contract of RichTextInput to EditorPane's
	 * callback-based contract. Delete this file once all callers migrate to EditorPane directly.
	 */
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	import EditorPane from './EditorPane.svelte';
	import type { EditorSnapshot } from './EditorPane.svelte';
	import { DraftController } from '$lib/draft/DraftController';
	import type { DraftSnapshot } from '$lib/draft/DraftController';

	// Match RichTextInput's prop API exactly so callers need no changes.
	export let className = 'input-prose';
	export let placeholder = 'Type here...';
	export let value = '';
	export let id = '';
	export let preserveBreaks = false;
	export let generateAutoCompletion: Function = async () => null;
	export let autocomplete = false;
	export let messageInput = false;
	export let shiftEnter = false;
	export let largeTextAsFile = false;
	export let draftKey = 'default';

	const draftController = new DraftController(draftKey);

	// Restore draft synchronously before first render if the parent hasn't seeded content.
	const savedDraft = draftController.load();
	let _value: string = savedDraft?.promptText && !value ? savedDraft.promptText : value;
	// Propagate restored draft back up through bind:value before the first tick.
	if (_value !== value) value = _value;

	let editorPane: EditorPane;
	let latestSnapshot: DraftSnapshot | null = null;

	// When the parent changes value externally (e.g., clears prompt after submit),
	// push the new content into EditorPane and manage the draft accordingly.
	$: if (editorPane && value !== _value) {
		_value = value;
		editorPane.setContent(value, true);
		if (value === '') draftController.clear();
	}

	function handleContentChanged(snapshot: EditorSnapshot, snapshotId: number) {
		_value = snapshot.promptText;
		value = snapshot.promptText; // propagates up via bind:value
		latestSnapshot = {
			promptText: snapshot.promptText,
			attachments: [],
			toolIds: [],
			snapshotId,
			updatedAt: Date.now()
		};
		draftController.save(latestSnapshot);
	}

	function handleBeforeUnload() {
		if (latestSnapshot) draftController.flush(latestSnapshot);
	}

	onMount(() => {
		window.addEventListener('beforeunload', handleBeforeUnload);
	});

	onDestroy(() => {
		window.removeEventListener('beforeunload', handleBeforeUnload);
		if (latestSnapshot) draftController.flush(latestSnapshot);
		draftController.destroy();
	});
</script>

<!--
  Event forwarding: on:keydown / on:keyup / on:focus / on:paste with no handler
  re-dispatches the events from EditorPane up to this component's callers unchanged.
-->
<EditorPane
	bind:this={editorPane}
	initialContent={_value}
	{className}
	{placeholder}
	{id}
	{preserveBreaks}
	{generateAutoCompletion}
	{autocomplete}
	{messageInput}
	{shiftEnter}
	{largeTextAsFile}
	onContentChanged={handleContentChanged}
	on:keydown
	on:keyup
	on:focus
	on:paste
/>
