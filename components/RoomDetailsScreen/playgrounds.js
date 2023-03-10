
export const getExampleFields = () => {
  const tempMap6 = [];
  const tempMap8 = [];
  const tempMap10 = [];
  for (let i = 0; i < 10; i++) {
    if (i < 6) tempMap6.push(Array(6).fill(0));
    if (i < 8) tempMap8.push(Array(8).fill(0));
    if (i < 10) tempMap10.push(Array(10).fill(0));
  }

  return [tempMap8]
};

// console.log(tempMap6);
// console.log(tempMap8);
// console.log(tempMap10);

// export { playgrounds };
