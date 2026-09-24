import { apiFetch } from '$lib/apis/client';
import type { Banner } from '$lib/types';

export const importConfig = async (token: string, config: object) => {
	return await apiFetch('/api/v1/configs/import', {
		method: 'POST',
		body: JSON.stringify({ config }),
		token
	});
};

export const exportConfig = async (token: string) => {
	return await apiFetch('/api/v1/configs/export', { token });
};

export const getModelsConfig = async (token: string) => {
	return await apiFetch('/api/v1/configs/models', { token });
};

export const setModelsConfig = async (token: string, config: object) => {
	return await apiFetch('/api/v1/configs/models', {
		method: 'POST',
		body: JSON.stringify({ ...config }),
		token
	});
};

export const setDefaultPromptSuggestions = async (token: string, promptSuggestions: string) => {
	return await apiFetch('/api/v1/configs/suggestions', {
		method: 'POST',
		body: JSON.stringify({ suggestions: promptSuggestions }),
		token
	});
};

export const getBanners = async (token: string): Promise<Banner[]> => {
	return await apiFetch('/api/v1/configs/banners', { token });
};

export const setBanners = async (token: string, banners: Banner[]) => {
	return await apiFetch('/api/v1/configs/banners', {
		method: 'POST',
		body: JSON.stringify({ banners }),
		token
	});
};
