/**
 * Generate a random string of given length
 *
 * @param { Number } length Length of the string
 */
export function randomString(length) {
  return Math.random().toString(36).substring(0, length);
}
