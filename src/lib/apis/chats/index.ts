import { getTimeRange } from '$lib/utils';
import { apiFetch } from '$lib/apis/client';

export const createNewChat = async (token: string, chat: object) => {
	return await apiFetch('/api/v1/chats/new', {
		method: 'POST',
		body: JSON.stringify({ chat }),
		token
	});
};

export const importChat = async (
	token: string,
	chat: object,
	meta: object | null,
	pinned?: boolean,
	folderId?: string | null
) => {
	return await apiFetch('/api/v1/chats/import', {
		method: 'POST',
		body: JSON.stringify({ chat, meta: meta ?? {}, pinned, folder_id: folderId }),
		token
	});
};

export const getChatList = async (token: string = '', page: number | null = null) => {
	const searchParams = new URLSearchParams();
	if (page !== null) searchParams.append('page', `${page}`);

	const res = await apiFetch<{ updated_at: number }[]>(
		`/api/v1/chats/?${searchParams.toString()}`,
		{ token: token || null }
	);
	return res.map((chat) => ({ ...chat, time_range: getTimeRange(chat.updated_at) }));
};

export const getChatListByUserId = async (token: string = '', userId: string) => {
	const res = await apiFetch<{ updated_at: number }[]>(
		`/api/v1/chats/list/user/${userId}`,
		{ token: token || null }
	);
	return res.map((chat) => ({ ...chat, time_range: getTimeRange(chat.updated_at) }));
};

export const getArchivedChatList = async (token: string = '') => {
	return await apiFetch('/api/v1/chats/archived', { token: token || null });
};

export const getAllChats = async (token: string) => {
	return await apiFetch('/api/v1/chats/all', { token: token || null });
};

export const getChatListBySearchText = async (token: string, text: string, page: number = 1) => {
	const searchParams = new URLSearchParams({ text, page: `${page}` });
	const res = await apiFetch<{ updated_at: number }[]>(
		`/api/v1/chats/search?${searchParams.toString()}`,
		{ token: token || null }
	);
	return res.map((chat) => ({ ...chat, time_range: getTimeRange(chat.updated_at) }));
};

export const getChatsByFolderId = async (token: string, folderId: string) => {
	return await apiFetch(`/api/v1/chats/folder/${folderId}`, { token: token || null });
};

export const getAllArchivedChats = async (token: string) => {
	return await apiFetch('/api/v1/chats/all/archived', { token: token || null });
};

export const getAllUserChats = async (token: string) => {
	return await apiFetch('/api/v1/chats/all/db', { token: token || null });
};

export const getAllTags = async (token: string) => {
	return await apiFetch('/api/v1/chats/all/tags', { token: token || null });
};

export const getPinnedChatList = async (token: string = '') => {
	const res = await apiFetch<{ updated_at: number }[]>('/api/v1/chats/pinned', {
		token: token || null
	});
	return res.map((chat) => ({ ...chat, time_range: getTimeRange(chat.updated_at) }));
};

export const getChatListByTagName = async (token: string = '', tagName: string) => {
	const res = await apiFetch<{ updated_at: number }[]>('/api/v1/chats/tags', {
		method: 'POST',
		body: JSON.stringify({ name: tagName }),
		token: token || null
	});
	return res.map((chat) => ({ ...chat, time_range: getTimeRange(chat.updated_at) }));
};

export const getChatById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/chats/${id}`, { token: token || null });
};

export const getChatByShareId = async (token: string, share_id: string) => {
	return await apiFetch(`/api/v1/chats/share/${share_id}`, { token: token || null });
};

export const getChatPinnedStatusById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/chats/${id}/pinned`, { token: token || null });
};

export const toggleChatPinnedStatusById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/chats/${id}/pin`, { method: 'POST', token });
};

export const cloneChatById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/chats/${id}/clone`, { method: 'POST', token });
};

export const cloneSharedChatById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/chats/${id}/clone/shared`, { method: 'POST', token });
};

export const shareChatById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/chats/${id}/share`, { method: 'POST', token });
};

export const updateChatFolderIdById = async (token: string, id: string, folderId?: string) => {
	return await apiFetch(`/api/v1/chats/${id}/folder`, {
		method: 'POST',
		body: JSON.stringify({ folder_id: folderId }),
		token
	});
};

export const archiveChatById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/chats/${id}/archive`, { method: 'POST', token });
};

export const deleteSharedChatById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/chats/${id}/share`, { method: 'DELETE', token });
};

export const updateChatById = async (token: string, id: string, chat: object) => {
	return await apiFetch(`/api/v1/chats/${id}`, {
		method: 'POST',
		body: JSON.stringify({ chat }),
		token
	});
};

export const deleteChatById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/chats/${id}`, { method: 'DELETE', token });
};

export const getTagsById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/chats/${id}/tags`, { token: token || null });
};

export const addTagById = async (token: string, id: string, tagName: string) => {
	return await apiFetch(`/api/v1/chats/${id}/tags`, {
		method: 'POST',
		body: JSON.stringify({ name: tagName }),
		token
	});
};

export const deleteTagById = async (token: string, id: string, tagName: string) => {
	return await apiFetch(`/api/v1/chats/${id}/tags`, {
		method: 'DELETE',
		body: JSON.stringify({ name: tagName }),
		token
	});
};

export const deleteTagsById = async (token: string, id: string) => {
	return await apiFetch(`/api/v1/chats/${id}/tags/all`, { method: 'DELETE', token });
};

export const deleteAllChats = async (token: string) => {
	return await apiFetch('/api/v1/chats/', { method: 'DELETE', token });
};

export const archiveAllChats = async (token: string) => {
	return await apiFetch('/api/v1/chats/archive/all', { method: 'POST', token });
};
