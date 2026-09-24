import { apiFetch } from '$lib/apis/client';

type ChannelForm = {
	name: string;
	data?: object;
	meta?: object;
	access_control?: object;
};

type MessageForm = {
	parent_id?: string;
	content: string;
	data?: object;
	meta?: object;
};

export const createNewChannel = async (token: string = '', channel: ChannelForm) => {
	return await apiFetch('/api/v1/channels/create', {
		method: 'POST',
		body: JSON.stringify({ ...channel }),
		token: token || null
	});
};

export const getChannels = async (token: string = '') => {
	return await apiFetch('/api/v1/channels/', { token: token || null });
};

export const getChannelById = async (token: string = '', channel_id: string) => {
	return await apiFetch(`/api/v1/channels/${channel_id}`, { token: token || null });
};

export const updateChannelById = async (
	token: string = '',
	channel_id: string,
	channel: ChannelForm
) => {
	return await apiFetch(`/api/v1/channels/${channel_id}/update`, {
		method: 'POST',
		body: JSON.stringify({ ...channel }),
		token: token || null
	});
};

export const deleteChannelById = async (token: string = '', channel_id: string) => {
	return await apiFetch(`/api/v1/channels/${channel_id}/delete`, {
		method: 'DELETE',
		token: token || null
	});
};

export const getChannelMessages = async (
	token: string = '',
	channel_id: string,
	skip: number = 0,
	limit: number = 50
) => {
	return await apiFetch(
		`/api/v1/channels/${channel_id}/messages?skip=${skip}&limit=${limit}`,
		{ token: token || null }
	);
};

export const getChannelThreadMessages = async (
	token: string = '',
	channel_id: string,
	message_id: string,
	skip: number = 0,
	limit: number = 50
) => {
	return await apiFetch(
		`/api/v1/channels/${channel_id}/messages/${message_id}/thread?skip=${skip}&limit=${limit}`,
		{ token: token || null }
	);
};

export const sendMessage = async (token: string = '', channel_id: string, message: MessageForm) => {
	return await apiFetch(`/api/v1/channels/${channel_id}/messages/post`, {
		method: 'POST',
		body: JSON.stringify({ ...message }),
		token: token || null
	});
};

export const updateMessage = async (
	token: string = '',
	channel_id: string,
	message_id: string,
	message: MessageForm
) => {
	return await apiFetch(`/api/v1/channels/${channel_id}/messages/${message_id}/update`, {
		method: 'POST',
		body: JSON.stringify({ ...message }),
		token: token || null
	});
};

export const addReaction = async (
	token: string = '',
	channel_id: string,
	message_id: string,
	name: string
) => {
	return await apiFetch(
		`/api/v1/channels/${channel_id}/messages/${message_id}/reactions/add`,
		{ method: 'POST', body: JSON.stringify({ name }), token: token || null }
	);
};

export const removeReaction = async (
	token: string = '',
	channel_id: string,
	message_id: string,
	name: string
) => {
	return await apiFetch(
		`/api/v1/channels/${channel_id}/messages/${message_id}/reactions/remove`,
		{ method: 'POST', body: JSON.stringify({ name }), token: token || null }
	);
};

export const deleteMessage = async (token: string = '', channel_id: string, message_id: string) => {
	return await apiFetch(`/api/v1/channels/${channel_id}/messages/${message_id}/delete`, {
		method: 'DELETE',
		token: token || null
	});
};
