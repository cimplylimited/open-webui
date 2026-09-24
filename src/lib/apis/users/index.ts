import { apiFetch } from '$lib/apis/client';
import { getUserPosition } from '$lib/utils';

type UserUpdateForm = {
	profile_image_url: string;
	email: string;
	name: string;
	password: string;
};

export const getUserGroups = async (token: string) => {
	return await apiFetch('/api/v1/users/groups', { token });
};

export const getUserDefaultPermissions = async (token: string) => {
	return await apiFetch('/api/v1/users/default/permissions', { token });
};

export const updateUserDefaultPermissions = async (token: string, permissions: object) => {
	return await apiFetch('/api/v1/users/default/permissions', {
		method: 'POST',
		body: JSON.stringify({ ...permissions }),
		token
	});
};

export const updateUserRole = async (token: string, id: string, role: string) => {
	return await apiFetch('/api/v1/users/update/role', {
		method: 'POST',
		body: JSON.stringify({ id, role }),
		token
	});
};

export const getUsers = async (token: string) => {
	const res = await apiFetch('/api/v1/users/', { token });
	return res ? res : [];
};

export const getUserSettings = async (token: string) => {
	return await apiFetch('/api/v1/users/user/settings', { token });
};

export const updateUserSettings = async (token: string, settings: object) => {
	return await apiFetch('/api/v1/users/user/settings/update', {
		method: 'POST',
		body: JSON.stringify({ ...settings }),
		token
	});
};

export const getUserById = async (token: string, userId: string) => {
	return await apiFetch(`/api/v1/users/${userId}`, { token });
};

export const getUserInfo = async (token: string) => {
	return await apiFetch('/api/v1/users/user/info', { token });
};

export const updateUserInfo = async (token: string, info: object) => {
	return await apiFetch('/api/v1/users/user/info/update', {
		method: 'POST',
		body: JSON.stringify({ ...info }),
		token
	});
};

export const getAndUpdateUserLocation = async (token: string) => {
	const location = await getUserPosition().catch((err) => {
		throw err;
	});

	if (location) {
		await updateUserInfo(token, { location: location });
		return location;
	} else {
		throw new Error('Failed to get user location');
	}
};

export const deleteUserById = async (token: string, userId: string) => {
	return await apiFetch(`/api/v1/users/${userId}`, { method: 'DELETE', token });
};

export const updateUserById = async (token: string, userId: string, user: UserUpdateForm) => {
	return await apiFetch(`/api/v1/users/${userId}/update`, {
		method: 'POST',
		body: JSON.stringify({
			profile_image_url: user.profile_image_url,
			email: user.email,
			name: user.name,
			password: user.password !== '' ? user.password : undefined
		}),
		token
	});
};
