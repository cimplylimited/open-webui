import { apiFetch } from '$lib/apis/client';

export const getConfig = async (token: string = '') => {
	return await apiFetch('/api/v1/images/config', { token });
};

export const updateConfig = async (token: string = '', config: object) => {
	return await apiFetch('/api/v1/images/config/update', {
		method: 'POST',
		body: JSON.stringify({ ...config }),
		token
	});
};

export const verifyConfigUrl = async (token: string = '') => {
	return await apiFetch('/api/v1/images/config/url/verify', { token });
};

export const getImageGenerationConfig = async (token: string = '') => {
	return await apiFetch('/api/v1/images/image/config', { token });
};

export const updateImageGenerationConfig = async (token: string = '', config: object) => {
	return await apiFetch('/api/v1/images/image/config/update', {
		method: 'POST',
		body: JSON.stringify({ ...config }),
		token
	});
};

export const getImageGenerationModels = async (token: string = '') => {
	return await apiFetch('/api/v1/images/models', { token });
};

export const imageGenerations = async (token: string = '', prompt: string) => {
	return await apiFetch('/api/v1/images/generations', {
		method: 'POST',
		body: JSON.stringify({ prompt }),
		token
	});
};
