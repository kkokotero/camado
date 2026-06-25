function getNavigator(): Navigator | undefined {
	return globalThis.navigator;
}

export function permission(
	name: PermissionName,
): Promise<PermissionStatus | undefined> {
	const permissions = getNavigator()?.permissions;
	if (!permissions?.query) {
		return Promise.resolve(undefined);
	}

	return permissions.query({ name });
}
