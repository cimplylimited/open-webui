import { apiFetch } from '$lib/apis/client';

export const getAdminDetails = async (token: string) => {
	return await apiFetch('/api/v1/auths/admin/details', { token });
};

export const getAdminConfig = async (token: string) => {
	return await apiFetch('/api/v1/auths/admin/config', { token });
};

export const updateAdminConfig = async (token: string, body: object) => {
	return await apiFetch('/api/v1/auths/admin/config', {
		method: 'POST',
		body: JSON.stringify(body),
		token
	});
};

export const getSessionUser = async (token: string) => {
	return await apiFetch('/api/v1/auths/', { credentials: 'include', token });
};

export const ldapUserSignIn = async (user: string, password: string) => {
	return await apiFetch('/api/v1/auths/ldap', {
		method: 'POST',
		body: JSON.stringify({ user, password }),
		credentials: 'include',
		token: null
	});
};

export const getLdapConfig = async (token: string = '') => {
	return await apiFetch('/api/v1/auths/admin/config/ldap', { token: token || null });
};

export const updateLdapConfig = async (token: string = '', enable_ldap: boolean) => {
	return await apiFetch('/api/v1/auths/admin/config/ldap', {
		method: 'POST',
		body: JSON.stringify({ enable_ldap }),
		token: token || null
	});
};

export const getLdapServer = async (token: string = '') => {
	return await apiFetch('/api/v1/auths/admin/config/ldap/server', { token: token || null });
};

export const updateLdapServer = async (token: string = '', body: object) => {
	return await apiFetch('/api/v1/auths/admin/config/ldap/server', {
		method: 'POST',
		body: JSON.stringify(body),
		token: token || null
	});
};

export const userSignIn = async (email: string, password: string) => {
	return await apiFetch('/api/v1/auths/signin', {
		method: 'POST',
		body: JSON.stringify({ email, password }),
		credentials: 'include',
		token: null
	});
};

export const userSignUp = async (
	name: string,
	email: string,
	password: string,
	profile_image_url: string
) => {
	return await apiFetch('/api/v1/auths/signup', {
		method: 'POST',
		body: JSON.stringify({ name, email, password, profile_image_url }),
		credentials: 'include',
		token: null
	});
};

export const userSignOut = async () => {
	await apiFetch('/api/v1/auths/signout', { credentials: 'include', token: null });
};

export const addUser = async (
	token: string,
	name: string,
	email: string,
	password: string,
	role: string = 'pending'
) => {
	return await apiFetch('/api/v1/auths/add', {
		method: 'POST',
		body: JSON.stringify({ name, email, password, role }),
		token: token || null
	});
};

export const updateUserProfile = async (token: string, name: string, profileImageUrl: string) => {
	return await apiFetch('/api/v1/auths/update/profile', {
		method: 'POST',
		body: JSON.stringify({ name, profile_image_url: profileImageUrl }),
		token: token || null
	});
};

export const updateUserPassword = async (token: string, password: string, newPassword: string) => {
	return await apiFetch('/api/v1/auths/update/password', {
		method: 'POST',
		body: JSON.stringify({ password, new_password: newPassword }),
		token: token || null
	});
};

export const getSignUpEnabledStatus = async (token: string) => {
	return await apiFetch('/api/v1/auths/signup/enabled', { token });
};

export const getDefaultUserRole = async (token: string) => {
	return await apiFetch('/api/v1/auths/signup/user/role', { token });
};

export const updateDefaultUserRole = async (token: string, role: string) => {
	return await apiFetch('/api/v1/auths/signup/user/role', {
		method: 'POST',
		body: JSON.stringify({ role }),
		token
	});
};

export const toggleSignUpEnabledStatus = async (token: string) => {
	return await apiFetch('/api/v1/auths/signup/enabled/toggle', { token });
};

export const getJWTExpiresDuration = async (token: string) => {
	return await apiFetch('/api/v1/auths/token/expires', { token });
};

export const updateJWTExpiresDuration = async (token: string, duration: string) => {
	return await apiFetch('/api/v1/auths/token/expires/update', {
		method: 'POST',
		body: JSON.stringify({ duration }),
		token
	});
};

export const createAPIKey = async (token: string) => {
	const res = await apiFetch<{ api_key: string }>('/api/v1/auths/api_key', {
		method: 'POST',
		token
	});
	return res.api_key;
};

export const getAPIKey = async (token: string) => {
	const res = await apiFetch<{ api_key: string }>('/api/v1/auths/api_key', { token });
	return res.api_key;
};

export const deleteAPIKey = async (token: string) => {
	return await apiFetch('/api/v1/auths/api_key', { method: 'DELETE', token });
};
