import { allQuestions } from "../src/data/questions";
const seen:Record<string,number>={};
allQuestions.forEach((q,i)=>{if(!(q.interactionType in seen))seen[q.interactionType]=i;});
console.log(JSON.stringify(seen));
