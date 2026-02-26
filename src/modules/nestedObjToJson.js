export const nestedOjjToJson = (data) => {
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'object' && data[key] !== null) {
        data[key] = JSON.stringify(data[key]);
    }
  });
};
