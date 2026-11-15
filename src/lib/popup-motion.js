// One damped spring for the entire flight, with zero speed at both ends.
// Sample standard transform keyframes so WebKit can run the motion without
// CSS linear() support, per-frame React updates or separate easing segments.
const damping = .8;
const frequency = Math.sqrt(1 - damping ** 2);
const endTime = 2 * Math.PI / frequency;
const response = time => 1 - Math.exp(-damping * time) * (
  Math.cos(frequency * time) + damping / frequency * Math.sin(frequency * time)
);
const finalResponse = response(endTime);
const spring = Array.from({length: 91}, (_, index) => {
  const offset = index / 90;
  return {offset, progress: index === 90 ? 1 : response(offset * endTime) / finalResponse};
});

export function popupMotionKeyframes(source, box) {
  const x = source.x + (source.width || 0) / 2 - box.left - box.width / 2;
  const y = source.y + (source.height || 0) / 2 - box.top - box.height / 2;
  return spring.map(({offset, progress}) => ({
    offset,
    transform: `translate(${x * (1 - progress)}px, ${y * (1 - progress)}px) scale(${.12 + .88 * progress})`,
    opacity: Math.min(1, progress * 3),
  }));
}
