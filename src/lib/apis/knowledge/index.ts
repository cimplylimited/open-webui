import { apiFetch } from '$lib/apis/client';

type KnowledgeUpdateForm = {
	name?: string;
	description?: string;
	data?: object;
	access_control?: null | object;
};

export const createNewKnowledge = async (
	token: string,
	name: string,
	description: string,
	accessControl: null | object
) => {
	return await apiFetch('/api/v1/knowledge/create', {
		method: 'POST',
		body: JSON.stringify({ name, description, access_control: accessControl }),
		token
	});
};

export const getKnowledgeBases = async (token: string = '') => {
	return await apiFetch('/api/v1/knowledge/', { token: token || null });
};

export const getKnowledgeBaseList = async (token: string = '') => {
	return await apiFetch('/api/v1/knowledge/list', { token: token || null });
};

export const getKnowledgeById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/knowledge/${id}`, { token });
};

export const updateKnowledgeById = async (token: string, id: string, form: KnowledgeUpdateForm) => {
	return await apiFetch(`/api/v1/knowledge/${id}/update`, {
		method: 'POST',
		body: JSON.stringify({
			name: form?.name ? form.name : undefined,
			description: form?.description ? form.description : undefined,
			data: form?.data ? form.data : undefined,
			access_control: form.access_control
		}),
		token
	});
};

export const addFileToKnowledgeById = async (token: string, id: string, fileId: string) => {
	return await apiFetch(`/api/v1/knowledge/${id}/file/add`, {
		method: 'POST',
		body: JSON.stringify({ file_id: fileId }),
		token
	});
};

export const updateFileFromKnowledgeById = async (token: string, id: string, fileId: string) => {
	return await apiFetch(`/api/v1/knowledge/${id}/file/update`, {
		method: 'POST',
		body: JSON.stringify({ file_id: fileId }),
		token
	});
};

export const removeFileFromKnowledgeById = async (token: string, id: string, fileId: string) => {
	return await apiFetch(`/api/v1/knowledge/${id}/file/remove`, {
		method: 'POST',
		body: JSON.stringify({ file_id: fileId }),
		token
	});
};

export const resetKnowledgeById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/knowledge/${id}/reset`, { method: 'POST', token });
};

export const deleteKnowledgeById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/knowledge/${id}/delete`, { method: 'DELETE', token });
};
