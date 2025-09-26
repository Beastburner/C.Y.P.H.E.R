/**
 * Cypher Wallet - Animation System
 * GSAP and React Native Reanimated animation configurations
 */

// Animation configurations for consistent micro-interactions
export const animations = {
  // Button Press
  buttonPress: {
    scale: 0.95,
    duration: 150,
    easing: 'ease-out',
  },
  
  // Card Hover/Press
  cardHover: {
    translateY: -8,
    scale: 1.02,
    duration: 400,
    easing: 'ease-out',
  },
  
  cardPress: {
    scale: 0.98,
    duration: 150,
    easing: 'ease-in-out',
  },
  
  // Page Transitions
  pageTransition: {
    slideUp: { 
      translateY: 50, 
      opacity: 0,
      duration: 600,
      easing: 'ease-out',
    },
    slideDown: { 
      translateY: -50, 
      opacity: 0,
      duration: 600,
      easing: 'ease-out',
    },
    slideLeft: { 
      translateX: 50, 
      opacity: 0,
      duration: 600,
      easing: 'ease-out',
    },
    slideRight: { 
      translateX: -50, 
      opacity: 0,
      duration: 600,
      easing: 'ease-out',
    },
    fade: {
      opacity: 0,
      duration: 400,
      easing: 'ease-in-out',
    },
  },
  
  // Loading States
  shimmer: {
    translateX: [-100, 100],
    duration: 3000,
    repeat: -1,
    easing: 'ease-in-out',
  },
  
  skeleton: {
    opacity: [0.3, 0.7, 0.3],
    duration: 2000,
    repeat: -1,
    easing: 'ease-in-out',
  },
  
  // Pulse Effect
  pulse: {
    opacity: [1, 0.5, 1],
    scale: [1, 1.05, 1],
    duration: 2000,
    repeat: -1,
    easing: 'ease-in-out',
  },
  
  // Glow Effect
  glow: {
    shadowOpacity: [0.2, 0.6, 0.2],
    duration: 3000,
    repeat: -1,
    easing: 'ease-in-out',
  },
  
  // Floating Animation
  floating: {
    translateY: [-5, 5, -5],
    duration: 4000,
    repeat: -1,
    easing: 'ease-in-out',
  },
  
  // Rotation
  rotate: {
    rotate: ['0deg', '360deg'],
    duration: 2000,
    repeat: -1,
    easing: 'linear',
  },
  
  // Spring Animations
  spring: {
    bounce: {
      damping: 0.6,
      stiffness: 100,
      mass: 0.8,
    },
    gentle: {
      damping: 0.8,
      stiffness: 120,
      mass: 1,
    },
    snappy: {
      damping: 0.9,
      stiffness: 200,
      mass: 0.5,
    },
  },
  
  // Entry Animations
  entry: {
    slideUpFade: {
      from: { translateY: 30, opacity: 0 },
      to: { translateY: 0, opacity: 1 },
      duration: 600,
      easing: 'ease-out',
    },
    scaleIn: {
      from: { scale: 0.8, opacity: 0 },
      to: { scale: 1, opacity: 1 },
      duration: 400,
      easing: 'ease-out',
    },
    slideInLeft: {
      from: { translateX: -50, opacity: 0 },
      to: { translateX: 0, opacity: 1 },
      duration: 500,
      easing: 'ease-out',
    },
  },
  
  // Exit Animations
  exit: {
    slideDownFade: {
      from: { translateY: 0, opacity: 1 },
      to: { translateY: 30, opacity: 0 },
      duration: 400,
      easing: 'ease-in',
    },
    scaleOut: {
      from: { scale: 1, opacity: 1 },
      to: { scale: 0.8, opacity: 0 },
      duration: 300,
      easing: 'ease-in',
    },
  },
} as const;

// Stagger configurations for list animations
export const stagger = {
  list: {
    delayBetween: 100,
    duration: 400,
  },
  grid: {
    delayBetween: 50,
    duration: 300,
  },
  cards: {
    delayBetween: 150,
    duration: 500,
  },
} as const;

// App startup animation sequence
export const startupSequence = {
  logo: {
    duration: 1200,
    delay: 0,
    animations: [
      { scale: [0, 1.2, 1], duration: 800 },
      { opacity: [0, 1], duration: 600 },
      { rotate: [0, 360], duration: 1000 },
    ],
  },
  brandName: {
    duration: 800,
    delay: 400,
    animations: [
      { translateY: [30, 0], duration: 600 },
      { opacity: [0, 1], duration: 800 },
    ],
  },
  tagline: {
    duration: 600,
    delay: 800,
    animations: [
      { opacity: [0, 1], duration: 600 },
    ],
  },
  loadingIndicator: {
    duration: 1000,
    delay: 1200,
    animations: [
      { opacity: [0, 1], duration: 400 },
      { scale: [0.8, 1], duration: 400 },
    ],
  },
} as const;

export type AnimationKeys = keyof typeof animations;
export type StaggerKeys = keyof typeof stagger;
