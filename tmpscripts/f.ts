import { allQuestions } from "../src/data/questions";
const ids=["AERO-020","AERO-061","AERO-066","AERO-132","AERO-246"];
for(const id of ids){const q=allQuestions.find(x=>x.id===id)!;console.log("=====",id,q.interactionType);console.log(JSON.stringify({prompt:q.prompt,sentenceParts:q.sentenceParts,choices:q.choices,tokens:q.draggableTokens,targets:q.targets,steps:q.steps,pairs:q.pairs,accepted:q.acceptedAnswers,correct:q.correctAnswer},null,1));}
