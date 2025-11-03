import { Queue_Type } from "@prisma/client";

export function sortByPriorityPattern(queues, lastServedType = null) {
  const priority = queues.filter((q) => q.queueType === Queue_Type.PRIORITY);
  const regular = queues.filter((q) => q.queueType === Queue_Type.REGULAR);

  // 🧩 Step 1: Determine which type to start with
  let startWith = Queue_Type.PRIORITY;
  if (lastServedType === Queue_Type.PRIORITY) startWith = Queue_Type.REGULAR;
  else if (lastServedType === Queue_Type.REGULAR)
    startWith = Queue_Type.PRIORITY;

  // 🧩 Step 2: Handle fallback if one type doesn’t exist
  if (priority.length === 0) return [...regular];
  if (regular.length === 0) return [...priority];

  // 🧩 Step 3: Alternate between types
  const sorted = [];
  let pIndex = 0;
  let rIndex = 0;
  let turn = startWith;

  while (pIndex < priority.length || rIndex < regular.length) {
    if (turn === Queue_Type.PRIORITY && pIndex < priority.length) {
      sorted.push(priority[pIndex++]);
    } else if (turn === Queue_Type.REGULAR && rIndex < regular.length) {
      sorted.push(regular[rIndex++]);
    }

    // Alternate turn
    turn =
      turn === Queue_Type.PRIORITY ? Queue_Type.REGULAR : Queue_Type.PRIORITY;

    // 🧠 Fallback: if one list is exhausted, push the remaining
    if (pIndex >= priority.length && rIndex < regular.length) {
      sorted.push(...regular.slice(rIndex));
      break;
    }
    if (rIndex >= regular.length && pIndex < priority.length) {
      sorted.push(...priority.slice(pIndex));
      break;
    }
  }

  return sorted;
}
