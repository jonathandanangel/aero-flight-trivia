import { allQuestions, aeroQuestions, impactArchive } from "../src/data/questions";
import * as V from "../src/game/validate";
console.log("counts", aeroQuestions.length, impactArchive.length, allQuestions.length);
console.log(Object.keys(V));
const fn:any = (V as any).validateQuestionBank ?? (V as any).runValidation ?? (V as any).validate;
const r = fn ? fn(allQuestions) : null;
console.log(JSON.stringify(r).slice(0,4000));
