import { apiFetch } from '$lib/apis/client';

export const getRAGConfig = async (token: string) => {
	return await apiFetch('/api/v1/retrieval/config', { token });
};

type ChunkConfigForm = {
	chunk_size: number;
	chunk_overlap: number;
};

type ContentExtractConfigForm = {
	engine: string;
	tika_server_url: string | null;
};

type YoutubeConfigForm = {
	language: string[];
	translation?: string | null;
	proxy_url: string;
};

type RAGConfigForm = {
	pdf_extract_images?: boolean;
	enable_google_drive_integration?: boolean;
	chunk?: ChunkConfigForm;
	content_extraction?: ContentExtractConfigForm;
	web_loader_ssl_verification?: boolean;
	youtube?: YoutubeConfigForm;
};

export const updateRAGConfig = async (token: string, payload: RAGConfigForm) => {
	return await apiFetch('/api/v1/retrieval/config/update', {
		method: 'POST',
		body: JSON.stringify({ ...payload }),
		token
	});
};

export const getRAGTemplate = async (token: string) => {
	const res = await apiFetch<{ template: string }>('/api/v1/retrieval/template', { token });
	return res?.template ?? '';
};

export const getQuerySettings = async (token: string) => {
	return await apiFetch('/api/v1/retrieval/query/settings', { token });
};

type QuerySettings = {
	k: number | null;
	r: number | null;
	template: string | null;
};

export const updateQuerySettings = async (token: string, settings: QuerySettings) => {
	return await apiFetch('/api/v1/retrieval/query/settings/update', {
		method: 'POST',
		body: JSON.stringify({ ...settings }),
		token
	});
};

export const getEmbeddingConfig = async (token: string) => {
	return await apiFetch('/api/v1/retrieval/embedding', { token });
};

type OpenAIConfigForm = {
	key: string;
	url: string;
};

type EmbeddingModelUpdateForm = {
	openai_config?: OpenAIConfigForm;
	embedding_engine: string;
	embedding_model: string;
	embedding_batch_size?: number;
};

export const updateEmbeddingConfig = async (token: string, payload: EmbeddingModelUpdateForm) => {
	return await apiFetch('/api/v1/retrieval/embedding/update', {
		method: 'POST',
		body: JSON.stringify({ ...payload }),
		token
	});
};

export const getRerankingConfig = async (token: string) => {
	return await apiFetch('/api/v1/retrieval/reranking', { token });
};

type RerankingModelUpdateForm = {
	reranking_model: string;
};

export const updateRerankingConfig = async (token: string, payload: RerankingModelUpdateForm) => {
	return await apiFetch('/api/v1/retrieval/reranking/update', {
		method: 'POST',
		body: JSON.stringify({ ...payload }),
		token
	});
};

export interface SearchDocument {
	status: boolean;
	collection_name: string;
	filenames: string[];
}

export const processFile = async (
	token: string,
	file_id: string,
	collection_name: string | null = null
) => {
	return await apiFetch('/api/v1/retrieval/process/file', {
		method: 'POST',
		body: JSON.stringify({ file_id, collection_name: collection_name ?? undefined }),
		token
	});
};

export const processYoutubeVideo = async (token: string, url: string) => {
	return await apiFetch('/api/v1/retrieval/process/youtube', {
		method: 'POST',
		body: JSON.stringify({ url }),
		token
	});
};

export const processWeb = async (token: string, collection_name: string, url: string) => {
	return await apiFetch('/api/v1/retrieval/process/web', {
		method: 'POST',
		body: JSON.stringify({ url, collection_name }),
		token
	});
};

export const processWebSearch = async (
	token: string,
	query: string,
	collection_name?: string
): Promise<SearchDocument | null> => {
	return await apiFetch('/api/v1/retrieval/process/web/search', {
		method: 'POST',
		body: JSON.stringify({ query, collection_name: collection_name ?? '' }),
		token
	});
};

export const queryDoc = async (
	token: string,
	collection_name: string,
	query: string,
	k: number | null = null
) => {
	return await apiFetch('/api/v1/retrieval/query/doc', {
		method: 'POST',
		body: JSON.stringify({ collection_name, query, k }),
		token
	});
};

export const queryCollection = async (
	token: string,
	collection_names: string,
	query: string,
	k: number | null = null
) => {
	return await apiFetch('/api/v1/retrieval/query/collection', {
		method: 'POST',
		body: JSON.stringify({ collection_names, query, k }),
		token
	});
};

export const resetUploadDir = async (token: string) => {
	return await apiFetch('/api/v1/retrieval/reset/uploads', { method: 'POST', token });
};

export const resetVectorDB = async (token: string) => {
	return await apiFetch('/api/v1/retrieval/reset/db', { method: 'POST', token });
};
