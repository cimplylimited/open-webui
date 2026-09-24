import { apiFetch } from '$lib/apis/client';

type FolderItems = {
	chat_ids: string[];
	file_ids: string[];
};

export const createNewFolder = async (token: string, name: string) => {
	return await apiFetch('/api/v1/folders/', {
		method: 'POST',
		body: JSON.stringify({ name }),
		token
	});
};

export const getFolders = async (token: string = '') => {
	const res = await apiFetch('/api/v1/folders/', { token: token || null });
	return Array.isArray(res) ? res : [];
};

export const getFolderById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/folders/${id}`, { token });
};

export const updateFolderNameById = async (token: string, id: string, name: string) => {
	return await apiFetch(`/api/v1/folders/${id}/update`, {
		method: 'POST',
		body: JSON.stringify({ name }),
		token
	});
};

export const updateFolderIsExpandedById = async (
	token: string,
	id: string,
	isExpanded: boolean
) => {
	return await apiFetch(`/api/v1/folders/${id}/update/expanded`, {
		method: 'POST',
		body: JSON.stringify({ is_expanded: isExpanded }),
		token
	});
};

export const updateFolderParentIdById = async (token: string, id: string, parentId?: string) => {
	return await apiFetch(`/api/v1/folders/${id}/update/parent`, {
		method: 'POST',
		body: JSON.stringify({ parent_id: parentId }),
		token
	});
};

export const updateFolderItemsById = async (token: string, id: string, items: FolderItems) => {
	return await apiFetch(`/api/v1/folders/${id}/update/items`, {
		method: 'POST',
		body: JSON.stringify({ items }),
		token
	});
};

export const deleteFolderById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/folders/${id}`, { method: 'DELETE', token });
};
