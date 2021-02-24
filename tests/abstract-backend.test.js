import { AbstractBackend } from '../src/abstract-backend';

test('connect() throws', () => {
	let ab = new AbstractBackend();
	expect(() => {
		ab.connect()
	}).toThrow('connect() must be implemented');
});

test('disconnect() throws', () => {
	let ab = new AbstractBackend();

	expect(() => {
		ab.disconnect()
	}).toThrow('disconnect() must be implemented');
});

test('setSilenceCallback... sets silence callback', () => {
	let ab = new AbstractBackend();
	ab.setSilenceCallback(() => {});

	expect(ab.silenceCallback).not.toBe(null);
});