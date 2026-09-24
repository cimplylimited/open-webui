import { apiFetch } from '$lib/apis/client';

export const getAudioConfig = async (token: string) => {
	return await apiFetch('/api/v1/audio/config', { token });
};

type OpenAIConfigForm = {
	url: string;
	key: string;
	model: string;
	speaker: string;
};

export const updateAudioConfig = async (token: string, payload: OpenAIConfigForm) => {
	return await apiFetch('/api/v1/audio/config/update', {
		method: 'POST',
		body: JSON.stringify({ ...payload }),
		token
	});
};

export const transcribeAudio = async (token: string, file: File) => {
	const data = new FormData();
	data.append('file', file);
	return await apiFetch('/api/v1/audio/transcriptions', { method: 'POST', body: data, token });
};

export const synthesizeOpenAISpeech = async (
	token: string = '',
	speaker: string = 'alloy',
	text: string = '',
	model?: string
) => {
	return await apiFetch('/api/v1/audio/speech', {
		method: 'POST',
		body: JSON.stringify({ input: text, voice: speaker, ...(model && { model }) }),
		token,
		responseType: 'response'
	});
};

interface AvailableModelsResponse {
	models: { name: string; id: string }[] | { id: string }[];
}

export const getModels = async (token: string = ''): Promise<AvailableModelsResponse> => {
	return await apiFetch('/api/v1/audio/models', { token });
};

export const getVoices = async (token: string = '') => {
	return await apiFetch('/api/v1/audio/voices', { token });
};
