<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { v4 as uuidv4 } from 'uuid';

	import { onMount, onDestroy, getContext } from 'svelte';

	const i18n = getContext('i18n');

	import { config, settings, user as _user } from '$lib/stores';
	import { blobToFile, compressImage } from '$lib/utils';
	import { transcribeAudio } from '$lib/apis/audio';
	import { uploadFile } from '$lib/apis/files';
	import { getToken } from '$lib/auth';
	import { normalizeErrorMessage } from '$lib/apis/client';
	import { WEBUI_API_BASE_URL } from '$lib/constants';

	import FileItem from '../../common/FileItem.svelte';
	import Image from '../../common/Image.svelte';
	import Tooltip from '../../common/Tooltip.svelte';

	export let files = [];
	export let dragged = false;
	export let visionCapableModelIds: string[] = [];
	export let selectedModelIds: string[] = [];
	export let atSelectedModel = undefined;

	let filesInputElement;
	let inputFiles;

	const MAX_CONCURRENT_UPLOADS = 3;
	const uploadQueue: Array<() => Promise<void>> = [];
	let activeUploadCount = 0;
	const activeUploadControllers = new Set<AbortController>();

	function drainUploadQueue(): void {
		while (uploadQueue.length > 0 && activeUploadCount < MAX_CONCURRENT_UPLOADS) {
			const task = uploadQueue.shift()!;
			activeUploadCount++;
			task().finally(() => {
				activeUploadCount--;
				drainUploadQueue();
			});
		}
	}

	export async function uploadFileHandler(file, fullContext: boolean = false): Promise<void> {
		if ($_user?.role !== 'admin' && !($_user?.permissions?.chat?.file_upload ?? true)) {
			toast.error($i18n.t('You do not have permission to upload files.'));
			return;
		}

		const tempItemId = uuidv4();
		const fileItem = {
			type: 'file',
			file: '',
			id: null,
			url: '',
			name: file.name,
			collection_name: '',
			status: 'uploading',
			size: file.size,
			error: '',
			itemId: tempItemId,
			...(fullContext ? { context: 'full' } : {})
		};

		if (fileItem.size == 0) {
			toast.error($i18n.t('You cannot upload an empty file.'));
			return;
		}

		files = [...files, fileItem];

		if (['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a'].includes(file['type'])) {
			const res = await transcribeAudio(getToken(), file).catch((error) => {
				toast.error(normalizeErrorMessage(error));
				return null;
			});

			if (res) {
				const blob = new Blob([res.text], { type: 'text/plain' });
				file = blobToFile(blob, `${file.name}.txt`);
				fileItem.name = file.name;
				fileItem.size = file.size;
			}
		}

		uploadQueue.push(async () => {
			const uploadController = new AbortController();
			activeUploadControllers.add(uploadController);
			try {
				const uploadedFile = await uploadFile(getToken(), file, uploadController.signal);

				if (uploadedFile) {
					if (uploadedFile.error) {
						toast.warning(uploadedFile.error);
					}

					fileItem.status = 'uploaded';
					fileItem.file = uploadedFile;
					fileItem.id = uploadedFile.id;
					fileItem.collection_name =
						uploadedFile?.meta?.collection_name || uploadedFile?.collection_name;
					fileItem.url = `${WEBUI_API_BASE_URL}/files/${uploadedFile.id}`;

					files = files;
				} else {
					files = files.filter((item) => item?.itemId !== tempItemId);
				}
			} catch (e) {
				if (e instanceof Error && e.name === 'AbortError') return;
				toast.error(normalizeErrorMessage(e));
				files = files.filter((item) => item?.itemId !== tempItemId);
			} finally {
				activeUploadControllers.delete(uploadController);
			}
		});
		drainUploadQueue();
	}

	export async function inputFilesHandler(inputFileList): Promise<void> {
		inputFileList.forEach((file) => {
			if (
				($config?.file?.max_size ?? null) !== null &&
				file.size > ($config?.file?.max_size ?? 0) * 1024 * 1024
			) {
				toast.error(
					$i18n.t(`File size should not exceed {{maxSize}} MB.`, {
						maxSize: $config?.file?.max_size
					})
				);
				return;
			}

			if (['image/gif', 'image/webp', 'image/jpeg', 'image/png'].includes(file['type'])) {
				if (visionCapableModelIds.length === 0) {
					toast.error($i18n.t('Selected model(s) do not support image inputs'));
					return;
				}
				let reader = new FileReader();
				reader.onload = async (event) => {
					let imageUrl = event.target.result;

					if ($settings?.imageCompression ?? false) {
						const width = $settings?.imageCompressionSize?.width ?? null;
						const height = $settings?.imageCompressionSize?.height ?? null;

						if (width || height) {
							imageUrl = await compressImage(imageUrl, width, height);
						}
					}

					files = [...files, { type: 'image', url: `${imageUrl}` }];
				};
				reader.readAsDataURL(file);
			} else {
				uploadFileHandler(file);
			}
		});
	}

	export async function screenCaptureHandler(): Promise<void> {
		try {
			const mediaStream = await navigator.mediaDevices.getDisplayMedia({
				video: { cursor: 'never' },
				audio: false
			});
			const video = document.createElement('video');
			video.srcObject = mediaStream;
			await video.play();
			const canvas = document.createElement('canvas');
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			const ctx = canvas.getContext('2d');
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			mediaStream.getTracks().forEach((track) => track.stop());
			window.focus();
			const imageUrl = canvas.toDataURL('image/png');
			files = [...files, { type: 'image', url: imageUrl }];
			video.srcObject = null;
		} catch (error) {
			console.error('Error capturing screen:', error);
		}
	}

	export function openFilePicker(): void {
		filesInputElement.click();
	}

	const onDragOver = (e) => {
		e.preventDefault();
		dragged = e.dataTransfer?.types?.includes('Files') ? true : false;
	};

	const onDragLeave = () => {
		dragged = false;
	};

	const onDrop = async (e) => {
		e.preventDefault();
		if (e.dataTransfer?.files) {
			const dropped = Array.from(e.dataTransfer.files);
			if (dropped.length > 0) inputFilesHandler(dropped);
		}
		dragged = false;
	};

	onMount(() => {
		const dropzone = document.getElementById('chat-container');
		dropzone?.addEventListener('dragover', onDragOver);
		dropzone?.addEventListener('drop', onDrop);
		dropzone?.addEventListener('dragleave', onDragLeave);
	});

	onDestroy(() => {
		uploadQueue.length = 0;
		activeUploadControllers.forEach((c) => c.abort());
		const dropzone = document.getElementById('chat-container');
		if (dropzone) {
			dropzone.removeEventListener('dragover', onDragOver);
			dropzone.removeEventListener('drop', onDrop);
			dropzone.removeEventListener('dragleave', onDragLeave);
		}
	});
</script>

<input
	bind:this={filesInputElement}
	bind:files={inputFiles}
	type="file"
	hidden
	multiple
	on:change={async () => {
		if (inputFiles && inputFiles.length > 0) {
			inputFilesHandler(Array.from(inputFiles));
		} else {
			toast.error($i18n.t('File not found.'));
		}
		filesInputElement.value = '';
	}}
/>

{#if files.length > 0}
	<div class="mx-1 mt-2.5 mb-1 flex flex-wrap gap-2">
		{#each files as file, fileIdx}
			{#if file.type === 'image'}
				<div class=" relative group">
					<div class="relative">
						<Image
							src={file.url}
							alt="input"
							imageClassName=" h-16 w-16 rounded-xl object-cover"
						/>
						{#if atSelectedModel ? visionCapableModelIds.length === 0 : selectedModelIds.length !== visionCapableModelIds.length}
							<Tooltip
								className=" absolute top-1 left-1"
								content={$i18n.t('{{ models }}', {
									models: selectedModelIds
										.filter((id) => !visionCapableModelIds.includes(id))
										.join(', ')
								})}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="size-4 fill-yellow-300"
								>
									<path
										fill-rule="evenodd"
										d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
										clip-rule="evenodd"
									/>
								</svg>
							</Tooltip>
						{/if}
					</div>
					<div class=" absolute -top-1 -right-1">
						<button
							class=" bg-gray-400 text-white border border-white rounded-full group-hover:visible invisible transition"
							type="button"
							on:click={() => {
								files.splice(fileIdx, 1);
								files = files;
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-4 h-4"
							>
								<path
									d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
								/>
							</svg>
						</button>
					</div>
				</div>
			{:else}
				<FileItem
					item={file}
					name={file.name}
					type={file.type}
					size={file?.size}
					loading={file.status === 'uploading'}
					dismissible={true}
					edit={true}
					on:dismiss={() => {
						files.splice(fileIdx, 1);
						files = files;
					}}
				/>
			{/if}
		{/each}
	</div>
{/if}
