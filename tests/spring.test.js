import test from 'node:test';
import assert from 'node:assert/strict';
import { spring } from '../assets/js/spring.js';

test('Damped spring settles at its target', () => {
  const motion = spring(); motion.set(20); let value;
  for (let i = 0; i < 600; i++) value = motion.step(1 / 60);
  assert.ok(Math.abs(value - 20) < .01); assert.equal(motion.settled, true);
});
test('Large frame intervals remain bounded and snap resets velocity', () => {
  const motion = spring(); motion.set(25);
  for (let i = 0; i < 100; i++) assert.ok(Number.isFinite(motion.step(5)));
  motion.snap(-10); assert.equal(motion.step(.016), -10); assert.equal(motion.settled, true);
});
