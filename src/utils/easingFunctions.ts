/**
 * Easing functions for smooth animations
 * All functions take a value t in range [0, 1] and return a value in range [0, 1]
 */

export type EasingFunction = (t: number) => number;

// Linear (no easing)
export const linear: EasingFunction = (t) => t;

// Quadratic easing
export const easeInQuad: EasingFunction = (t) => t * t;
export const easeOutQuad: EasingFunction = (t) => t * (2 - t);
export const easeInOutQuad: EasingFunction = (t) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// Cubic easing
export const easeInCubic: EasingFunction = (t) => t * t * t;
export const easeOutCubic: EasingFunction = (t) => (--t) * t * t + 1;
export const easeInOutCubic: EasingFunction = (t) =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

// Quartic easing
export const easeInQuart: EasingFunction = (t) => t * t * t * t;
export const easeOutQuart: EasingFunction = (t) => 1 - (--t) * t * t * t;
export const easeInOutQuart: EasingFunction = (t) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;

// Quintic easing
export const easeInQuint: EasingFunction = (t) => t * t * t * t * t;
export const easeOutQuint: EasingFunction = (t) => 1 + (--t) * t * t * t * t;
export const easeInOutQuint: EasingFunction = (t) =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;

// Sine easing
export const easeInSine: EasingFunction = (t) => 1 - Math.cos((t * Math.PI) / 2);
export const easeOutSine: EasingFunction = (t) => Math.sin((t * Math.PI) / 2);
export const easeInOutSine: EasingFunction = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

// Exponential easing
export const easeInExpo: EasingFunction = (t) =>
  t === 0 ? 0 : Math.pow(2, 10 * t - 10);
export const easeOutExpo: EasingFunction = (t) =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
export const easeInOutExpo: EasingFunction = (t) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

// Circular easing
export const easeInCirc: EasingFunction = (t) => 1 - Math.sqrt(1 - t * t);
export const easeOutCirc: EasingFunction = (t) => Math.sqrt(1 - (--t) * t);
export const easeInOutCirc: EasingFunction = (t) =>
  t < 0.5
    ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
    : (Math.sqrt(1 - 4 * (--t) * t) + 1) / 2;

// Back easing (overshooting)
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;

export const easeInBack: EasingFunction = (t) => c3 * t * t * t - c1 * t * t;
export const easeOutBack: EasingFunction = (t) =>
  1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
export const easeInOutBack: EasingFunction = (t) =>
  t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;

// Elastic easing (spring-like)
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;

export const easeInElastic: EasingFunction = (t) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
};

export const easeOutElastic: EasingFunction = (t) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

export const easeInOutElastic: EasingFunction = (t) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
};

// Bounce easing
export const easeOutBounce: EasingFunction = (t) => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

export const easeInBounce: EasingFunction = (t) => 1 - easeOutBounce(1 - t);

export const easeInOutBounce: EasingFunction = (t) =>
  t < 0.5
    ? (1 - easeOutBounce(1 - 2 * t)) / 2
    : (1 + easeOutBounce(2 * t - 1)) / 2;

// Custom spring physics easing
export function createSpringEasing(tension = 180, friction = 12): EasingFunction {
  const mass = 1;
  const damping = 2 * Math.sqrt(mass * tension) * (friction / 100);
  const omega = Math.sqrt(tension / mass);
  const zeta = damping / (2 * Math.sqrt(tension * mass));

  if (zeta < 1) {
    // Under-damped
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    return (t: number) => {
      const envelope = Math.exp(-zeta * omega * t);
      return 1 - envelope * (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t));
    };
  } else {
    // Critically damped or over-damped
    return (t: number) => 1 - Math.exp(-omega * t) * (1 + omega * t);
  }
}

// Animation helpers
export interface AnimationOptions {
  duration: number;
  easing?: EasingFunction;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

export function animate(from: number, to: number, options: AnimationOptions): () => void {
  const { duration, easing = easeOutCubic, onUpdate, onComplete } = options;
  const startTime = performance.now();
  const delta = to - from;
  let animationFrame: number;

  const update = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const currentValue = from + delta * easedProgress;

    onUpdate(currentValue);

    if (progress < 1) {
      animationFrame = requestAnimationFrame(update);
    } else {
      onComplete?.();
    }
  };

  animationFrame = requestAnimationFrame(update);

  // Return cleanup function
  return () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };
}

// Interpolation helper
export function interpolate(from: number, to: number, t: number, easing: EasingFunction = linear): number {
  const easedT = easing(Math.max(0, Math.min(1, t)));
  return from + (to - from) * easedT;
}

// CSS cubic-bezier equivalents
export const easings = {
  linear: 'linear',
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  easeInSine: 'cubic-bezier(0.12, 0, 0.39, 0)',
  easeOutSine: 'cubic-bezier(0.61, 1, 0.88, 1)',
  easeInOutSine: 'cubic-bezier(0.37, 0, 0.63, 1)',
  easeInQuad: 'cubic-bezier(0.11, 0, 0.5, 0)',
  easeOutQuad: 'cubic-bezier(0.5, 1, 0.89, 1)',
  easeInOutQuad: 'cubic-bezier(0.45, 0, 0.55, 1)',
  easeInCubic: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  easeInQuart: 'cubic-bezier(0.5, 0, 0.75, 0)',
  easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  easeInOutQuart: 'cubic-bezier(0.76, 0, 0.24, 1)',
  easeInQuint: 'cubic-bezier(0.64, 0, 0.78, 0)',
  easeOutQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeInOutQuint: 'cubic-bezier(0.83, 0, 0.17, 1)',
  easeInExpo: 'cubic-bezier(0.7, 0, 0.84, 0)',
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOutExpo: 'cubic-bezier(0.87, 0, 0.13, 1)',
  easeInCirc: 'cubic-bezier(0.55, 0, 1, 0.45)',
  easeOutCirc: 'cubic-bezier(0, 0.55, 0.45, 1)',
  easeInOutCirc: 'cubic-bezier(0.85, 0, 0.15, 1)',
  easeInBack: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeInOutBack: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'
} as const;