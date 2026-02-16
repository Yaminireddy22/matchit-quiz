import { useEffect, useState, useRef } from "react";
import "./App.css";
import { db } from "./firebase";
import { ref, push, onValue, set } from "firebase/database";

const textToImage = (text) => {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0f0f0f";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#00e5ff";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width/2, canvas.height/2);

  return canvas.toDataURL();
};

const TOTAL_TIME = 180;
const ADMIN_USER = "matchit";
const ADMIN_PASS = "yksmquiz";

/* ================= DEFAULT QUESTIONS ================= */

export default function App(){

  const [step,setStep]=useState("register");
  const [name,setName]=useState("");
  const [level,setLevel]=useState("basic");
  const [completed,setCompleted]=useState([]);
  const [answers,setAnswers]=useState({});
  const [current,setCurrent]=useState(0);
  const [timeLeft,setTimeLeft]=useState(TOTAL_TIME);

  const [selectedLeft,setSelectedLeft] = useState(false);
  const [matchedIndex,setMatchedIndex] = useState(null);
  const leftRef = useRef(null);
  const optionRefs = useRef([]);
  const layoutRef = useRef(null);
  const [bulkText,setBulkText] = useState("");
  const [lines,setLines] = useState({});
  const [questionsData,setQuestionsData]=useState({
  basic: [],
  medium: [],
  high: []
});

  const [leaderboard,setLeaderboard]=useState(
    JSON.parse(localStorage.getItem("scores")) || []
  );

  const [adminUser,setAdminUser]=useState("");
  const [adminPass,setAdminPass]=useState("");
  const [editLevel,setEditLevel]=useState("basic");

  const [scoreSheet,setScoreSheet] = useState(
  JSON.parse(localStorage.getItem("scoreSheet")) || {
    basic: [],
    medium: [],
    high: []
  }
);

  const q = questionsData[level]?.[current] || {};

  /* TIMER */
  useEffect(()=>{
    if(step!=="quiz") return;
    const t=setInterval(()=>setTimeLeft(s=>s-1),1000);
    return ()=>clearInterval(t);
  },[step]);

  /* RESET MATCH WHEN QUESTION CHANGES */
useEffect(()=>{
  setMatchedIndex(null);
  setSelectedLeft(false);
},[current]);

  useEffect(()=>{
    if(timeLeft<=0 && step==="quiz") finishQuiz();
  },[timeLeft]);

  useEffect(()=>{
  const r = ref(db,"scores");
  onValue(r,(snap)=>{
    if(snap.exists())
      setScoreSheet(snap.val());
  });
},[]);
/* LOAD QUESTIONS FROM FIREBASE */
useEffect(()=>{
  const qRef = ref(db,"questions");
  onValue(qRef,(snap)=>{
    if(snap.exists()){
      setQuestionsData(snap.val());
    }
  });
},[]);

  const startGame=()=>{
    setCurrent(0);
    setAnswers({});
    setTimeLeft(TOTAL_TIME);
    setStep("quiz");
    setMatchedIndex(null);
    setSelectedLeft(false);
    setLines([]);
  };

const answer=(i)=>{
  setAnswers({...answers,[current]:i});

  // reset match visuals
  setMatchedIndex(null);
  setSelectedLeft(false);

  if(current+1<questionsData[level].length)
    setCurrent(c=>c+1);
};


const finishQuiz=()=>{

  let score=0;
  questionsData[level].forEach((qq,i)=>{
    if(answers[i]===qq.a) score++;
  });

  const entry={
    name,
    score,
    time: TOTAL_TIME-timeLeft
  };

  const sheetCopy={...scoreSheet};
  sheetCopy[level].push(entry);

  setScoreSheet(sheetCopy);
  push(ref(db, "scores/" + level), entry);
  if(!completed.includes(level)){
    setCompleted([...completed,level]);
    setStep("levelSelect");
    return;
  }

  const updated=[...leaderboard,entry].sort((a,b)=>b.score-a.score);
  setLeaderboard(updated);
  localStorage.setItem("scores",JSON.stringify(updated));

  setStep("result");
};

const loadBulkQuestions = () => {

  const lines = bulkText.split("\n").filter(l => l.trim() !== "");

  const parsed = lines.map(line => {
    const parts = line.split("|");

    return {
      q: parts[0],
      image:"",
      options:[parts[1],parts[2],parts[3],parts[4]],
      a: Number(parts[5])
    };
  });

  const copy = {...questionsData};
  copy[editLevel] = parsed;

  setQuestionsData(copy);
  localStorage.setItem("questionsData", JSON.stringify(copy));
  setBulkText("");

  alert("Bulk Questions Loaded");
};


  /* ================= UI ================= */
  return(
    
<div className={`bg ${step} ${step==="levelSelect" ? "levelBg" : ""}`}>
  <div className="scaleWrapper">
    <div className="frame">


{/* REGISTER */}
{step==="register" && (
<>
<h1 className="title">MATCHIT</h1>
<input className="input" placeholder="Enter name"
value={name} onChange={(e)=>setName(e.target.value)}/>
<button className="btn pink" onClick={()=>setStep("levelSelect")}>Join Game</button>
<button className="btn blue" onClick={()=>setStep("adminLogin")}>Admin</button>
</>
)}

{/* LEVEL SELECT (LOCKING) */}
{step==="levelSelect" && (
<div className="box playerBox">
<h2>Select Level</h2>

<button className="btn pink" onClick={()=>{setLevel("basic");startGame();}}>Basic</button>

<button className="btn blue"
disabled={!completed.includes("basic")}
onClick={()=>{setLevel("medium");startGame();}}>
Medium
</button>

<button className="btn pink"
disabled={!completed.includes("medium")}
onClick={()=>{setLevel("high");startGame();}}>
High
</button>
</div>
)}

{/* QUIZ */}
{step==="quiz" && (
<div className="quizLayout">

  <div className="leftQuiz">
    <div className="quizCard playerBox">

      {/* OPTIONS */}
<div className="matchLayout" ref={layoutRef}>


  <div className="leftMatch">
<button
ref={leftRef}
className={`tile ${selectedLeft ? "activeLeft" : ""}`}
onClick={()=>setSelectedLeft(true)}
>
{q.q}
</button>

  </div>

  <div className="rightMatch">
{q.options?.map((opt,i)=>(
<button
key={i}
ref={el => optionRefs.current[i] = el}
className={`tile ${matchedIndex===i ? "matchedTile":""}`}
onClick={()=>{
if(!selectedLeft) return;

const containerRect = layoutRef.current.getBoundingClientRect();
const leftRect = leftRef.current.getBoundingClientRect();
const rightRect = optionRefs.current[i].getBoundingClientRect();

setLines(prev => ({
  ...prev,
  [current]: [
    {
      x1: leftRect.right - containerRect.left,
      y1: leftRect.top + leftRect.height/2 - containerRect.top,
      x2: rightRect.left - containerRect.left,
      y2: rightRect.top + rightRect.height/2 - containerRect.top
    }
  ]
}));

setMatchedIndex(i);
setSelectedLeft(false);

setTimeout(()=>{
  answer(i);
}, 500);     // 0.5 second delay

}}
>
{opt}
</button>
))}

  </div>
{lines[current] && (
  <svg className="matchLine" width="100%" height="100%">
    {lines[current].map((l,i)=>(
      <line
        key={i}
        x1={l.x1}
        y1={l.y1}
        x2={l.x2}
        y2={l.y2}
        stroke="#00e5ff"
        strokeWidth="4"
      />
    ))}
  </svg>
)}

</div>

    </div>
  </div>
<div className="rightSidebar">
  <div className="timerBoxSide">{timeLeft}</div>

  <div className="gridBox">
    {questionsData[level].map((_,i)=>{
      let cls="gridBtn";
      if(i===current) cls+=" activeGrid";
      else if(answers[i]!=null) cls+=" answeredGrid";
      else cls+=" skippedGrid";
      return(
        <button key={i} className={cls} onClick={()=>setCurrent(i)}>
          {i+1}
        </button>
      );
    })}
  </div>

  {/* SUBMIT BUTTON */}
  <div style={{marginTop:"20px"}}>
    <button className="btn pink" onClick={finishQuiz}>
      Submit
    </button>
  </div>
</div>

</div>
)}

{/* ADMIN LOGIN */}
{step==="adminLogin" && (
<div className="box adminBox">
<input className="input" placeholder="user"
onChange={(e)=>setAdminUser(e.target.value)}/>
<input type="password" className="input"
onChange={(e)=>setAdminPass(e.target.value)}/>
<button className="btn pink"
onClick={()=> adminUser===ADMIN_USER && adminPass===ADMIN_PASS
? setStep("adminDashboard")

: alert("Wrong")}>
Login
</button>
</div>
)}

{/* ADMIN DASHBOARD */}
{step==="adminDashboard" && (
<div className="box playerBox">
<h2>Admin Dashboard</h2>

<button
className="btn pink"
onClick={()=>setStep("adminLevel")}
>
Manage Questions
</button>

<button
className="btn blue"
onClick={()=>setStep("projector")}
>
View Results
</button>

<button
className="btn pink"
onClick={()=>{
localStorage.removeItem("scoreSheet");
setScoreSheet({basic:[],medium:[],high:[]});
alert("Scores Reset");
}}
>
Reset Scores
</button>

<button
className="btn blue"
onClick={()=>setStep("register")}
>
Logout
</button>

</div>
)}

{/* ADMIN LEVEL SELECT */}
{step==="adminLevel" && (
<div className="box playerBox">
<h2>Select Level to Edit</h2>

<button className="btn pink"
onClick={()=>{ setEditLevel("basic"); setStep("adminPanel"); }}>
Basic
</button>

<button className="btn blue"
onClick={()=>{ setEditLevel("medium"); setStep("adminPanel"); }}>
Medium
</button>

<button className="btn pink"
onClick={()=>{ setEditLevel("high"); setStep("adminPanel"); }}>
High
</button>

<button
className="btn blue"
onClick={()=>setStep("adminDashboard")}
>
Back
</button>
</div>
)}


{/* ADMIN PANEL */}
{step==="adminPanel" && (
<div className="adminManage">

<h2>Manage Questions ({editLevel.toUpperCase()})</h2>

{questionsData[editLevel].map((qq,qi)=>(
<div className="adminQuestionCard" key={qi}>

<h3>Question {qi+1}</h3>

<input
className="adminInput"
value={qq.q}
onChange={(e)=>{
const copy={...questionsData};
copy[editLevel][qi].q=e.target.value;
setQuestionsData(copy);
}}
/>

{qq.options.map((op,oi)=>(
<label key={oi} className="adminOptionRow">
<input
type="radio"
checked={qq.a===oi}
onChange={()=>{
const copy={...questionsData};
copy[editLevel][qi].a=oi;
setQuestionsData(copy);
}}
/>

<input
className="adminInput"
value={op}
onChange={(e)=>{
const copy={...questionsData};
copy[editLevel][qi].options[oi]=e.target.value;
setQuestionsData(copy);
}}
/>
</label>
))}

<div className="adminBtns">
<button
className="btn blue"
onClick={()=>alert("Updated")}
>
Update Question
</button>

<button
className="btn pink"
onClick={()=>{
const copy={...questionsData};
copy[editLevel].splice(qi,1);
setQuestionsData(copy);
}}
>
Delete Question
</button>
</div>

</div>
))}
/* BULK PASTE SECTION — ADD HERE */
<textarea
  className="adminInput"
  rows={8}
  placeholder="Paste bulk questions here"
  value={bulkText}
  onChange={(e)=>setBulkText(e.target.value)}
/>

<button
  className="btn pink"
  onClick={loadBulkQuestions}
>
Load Bulk Questions

</button>
<button
className="btn blue"
onClick={()=>{
  const updated = {...questionsData};

  Object.keys(updated).forEach(level=>{
    updated[level] = updated[level].map(q=>{
      if(!q.image && q.q){
        return {
          ...q,
          image: textToImage(q.q)
        };
      }
      return q;
    });
  });

setQuestionsData(updated);
set(ref(db, "questions/" + editLevel), questionsData[editLevel]);
alert(editLevel + " saved to Firebase");


}}
>
Save All
</button>

</div>
)}

{step==="projector" && (
<div className="box adminBox">

<h1>Final Ranking</h1>

{["basic","medium","high"].map(lvl => (
  <div key={lvl} style={{marginBottom:"25px"}}>
    <h2>{lvl.toUpperCase()}</h2>

    <table className="resultTable">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Name</th>
          <th>Score</th>
          <th>Time</th>
          <th>Rank</th>
        </tr>
      </thead>

      <tbody>
        {(scoreSheet[lvl] || [])
          .sort((a,b)=> b.score-a.score || a.time-b.time)
          .map((p,i)=>(
            <tr key={i}>
              <td>{i+1}</td>
              <td>{p.name}</td>
              <td>{p.score}</td>
              <td>{p.time}s</td>
              <td>{i+1}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
))}

<button className="btn pink" onClick={()=>setStep("adminDashboard")}>
Back
</button>

</div>
)}

{/* RESULT */}
{step==="result" && (
<div className="box playerBox">
<h2>Finished!</h2>
<button className="btn pink" onClick={()=>setStep("register")}>Next Player</button>
</div>
)}
    </div>
  </div>
</div>
);

} 