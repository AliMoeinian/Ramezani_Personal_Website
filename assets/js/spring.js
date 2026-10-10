export function spring({ stiffness = 120, damping = 12, mass = 1 } = {}) {
  let x = 0, velocity = 0, target = 0;
  return {
    set(value) { target = value; },
    snap(value) { x = target = value; velocity = 0; },
    step(dt) {
      dt = Math.min(.033, Math.max(.001, dt));
      velocity += (-stiffness * (x - target) - damping * velocity) / mass * dt;
      x += velocity * dt;
      return x;
    },
    get settled() { return Math.abs(x - target) < .01 && Math.abs(velocity) < .01; }
  };
}
