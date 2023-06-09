
export const colors = {
  'blue': "#41D5FD",
  'green': '#3EE660',
  'red': '#FC74CB',
  'background': '#292a2e'
}

export const colorMapping: { [key: string]: { background: string; border: string } } =
  {
    0: { background: "#41D5FD", border: "purple" },
    1: { background: "#3EE660", border: "blue" },
    2: { background: "#FC74CB", border: "blue" },
    3: { background: "#F9B72F", border: "red" },
    'neutral': { background: 'grey', border: 'blue' },
    'player': { background: 'white', border: 'blue' }
  };

export enum EditActions {
  'cell',
  'player',
  'chip'
}