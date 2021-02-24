import { randomString } from '../src/util';

test('randomString returns a string with 0 chars', () => {
	let rString = randomString(0);
	expect(rString.length).toBe(0);
});

test('randomString returns a string with 7 chars', () => {
	let rString = randomString(7);
	expect(rString.length).toBe(7);
});