export function randomString(length) {
	return Math.random().toString(36).substring(0, length);
}