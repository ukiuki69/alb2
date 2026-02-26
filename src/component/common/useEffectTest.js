import React,{useState, useEffect} from 'react';
import useInterval from 'use-interval'

const UseEffectTest = () => {
  const [count, setCount] = useState(0);
  const [tcount, settcount] = useState(0);
  const [hist, sethist] = useState([0, 0]);
  const [saveFlug, setsaveFlug] = useState(false);

  
  // useEffect(() => {
  //   console.log('useEffectが実行されました');
  //   settime(new Date());
  // }, [count]);

  // useEffect(()=>{
  //   const timer = setInterval(()=>{
  //     settime(()=>new Date());
  //     console.log('working.')
  //   }, 1000);
  //   return clearInterval(timer);
  // }, [count]);

  useEffect(()=>{
    if (saveFlug){
      console.log('save will!');
      setsaveFlug(false);
    }
  }, [saveFlug]);

  useInterval(()=>{
    const c = tcount + 1;
    settcount(c);
    if (c > hist[0] + 10 && hist[0] > hist[1]){
      sethist([c, c]);
      console.log('this is time to save.')
      setsaveFlug(true);
    }
  }, 1000);

  useEffect(()=>{
    const tmp = [...hist];
    tmp.unshift(tcount);
    tmp.pop();
    sethist(tmp);
  }, [count]);
    
  return (
    <div className="App">
      <h2>Count: {count}</h2>
      <div>
        tcount: {tcount} hist: {hist[0]} / {hist[1]}
      </div>
      <button onClick={() => setCount(count + 1)}>Count+</button><br />
    </div>
  );
}
export default UseEffectTest;