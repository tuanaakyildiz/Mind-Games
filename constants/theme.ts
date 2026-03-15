// constants/theme.ts
export const themes = {
  purple: {
    light: {
      background: '#f3e9ff', text: '#4b0082', fixedText: '#555', fixedBackground: '#e3d8f3',
      selected: '#d0aaff', userInput: '#673ab7', input: '#9370DB',
      highlight: '#e0c3fc', restricted: 'rgba(103, 58, 183, 0.15)', // New Sudoku colors
    },
    dark: {
      background: '#241738', text: '#d3bdf0', fixedText: '#aaa', fixedBackground: '#1b112c',
      selected: '#a47ffb', userInput: '#bb86fc', input: '#a77ff0',
      highlight: '#5e35b1', restricted: 'rgba(209, 170, 255, 0.15)',
    },
  },
  blue: {
    light: {
      background: '#e9f3ff', text: '#0050b3', fixedText: '#555', fixedBackground: '#d0e6ff',
      selected: '#9ecfff', userInput: '#1976d2', input: '#6aa3ff',
      highlight: '#bbdefb', restricted: 'rgba(25, 118, 210, 0.15)',
    },
    dark: {
      background: '#0d1b2a', text: '#a0c4ff', fixedText: '#aaa', fixedBackground: '#060d14',
      selected: '#6493ce', userInput: '#90caf9', input: '#4a90e2',
      highlight: '#1565c0', restricted: 'rgba(144, 202, 249, 0.15)',
    },
  },
  pink: {
    light: {
      background: '#fdf2f8', text: '#831843', fixedText: '#555', fixedBackground: '#fce7f3',
      selected: '#f9a8d4', userInput: '#db2777', input: '#ec4899',
      highlight: '#fbcfe8', restricted: 'rgba(219, 39, 119, 0.15)',
    },
    dark: {
      background: '#3f0f24', text: '#fbcfe8', fixedText: '#aaa', fixedBackground: '#2a0a18',
      selected: '#f472b6', userInput: '#f9a8d4', input: '#ec4899',
      highlight: '#9d174d', restricted: 'rgba(249, 168, 212, 0.15)',
    },
  },
  cyan: {
    light: {
      background: '#ecfeff', text: '#164e63', fixedText: '#555', fixedBackground: '#cffafe',
      selected: '#67e8f9', userInput: '#0891b2', input: '#06b6d4',
      highlight: '#a5f3fc', restricted: 'rgba(8, 145, 178, 0.15)',
    },
    dark: {
      background: '#083344', text: '#a5f3fc', fixedText: '#aaa', fixedBackground: '#04202c',
      selected: '#22d3ee', userInput: '#67e8f9', input: '#06b6d4',
      highlight: '#155e75', restricted: 'rgba(103, 232, 249, 0.15)',
    },
  },
  gray: {
    light: {
      background: '#f3f4f6', text: '#1f2937', fixedText: '#555', fixedBackground: '#e5e7eb',
      selected: '#d1d5db', userInput: '#4b5563', input: '#6b7280',
      highlight: '#e5e7eb', restricted: 'rgba(75, 85, 99, 0.15)',
    },
    dark: {
      background: '#111827', text: '#e5e7eb', fixedText: '#aaa', fixedBackground: '#0b0f19',
      selected: '#4b5563', userInput: '#9ca3af', input: '#6b7280',
      highlight: '#374151', restricted: 'rgba(156, 163, 175, 0.15)',
    },
  },
};