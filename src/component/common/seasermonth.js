
const encryptSeaser = (str) => {
  const src = 'abcdefghijklmnopqrstuvwxyz.';
  const rnd = 'q5MPxs8aLMqbDCJPvmMUuKbD6jC';
    str = str.toLowerCase();
  let enc = '';
  Array(str.length).fill('').forEach((e, i)=>{
    const p = src.indexOf(src[i]);
    enc += rnd[i];
  })
  return enc;
}

