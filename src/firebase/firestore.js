import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "./config";

/* ---------------- SESSION ---------------- */

export async function createSession(sessionId) {
  const ref = doc(db, "sessions", sessionId);

  await setDoc(ref, {
    createdAt: serverTimestamp(),
    studentCount: 0,
    questionCount: 0,
    active: true,
  });
}

/* ---------------- STUDENTS ---------------- */

export async function updateStudentCount(sessionId, delta) {
  const ref = doc(db, "sessions", sessionId);

  await setDoc(
    ref,
    {
      studentCount: increment(delta),
    },
    { merge: true }
  );
}

/* ---------------- QUESTIONS ---------------- */

export async function submitQuestion(sessionId, text) {
  try {
    const sessionRef = doc(db, "sessions", sessionId);

    // Only ensure session exists (DO NOT reset counters)
    await setDoc(
      sessionRef,
      {
        createdAt: serverTimestamp(),
        active: true,
      },
      { merge: true }
    );

    const questionsRef = collection(
      db,
      "sessions",
      sessionId,
      "questions"
    );

    await addDoc(questionsRef, {
      text,
      createdAt: serverTimestamp(), // FIXED (important)
      answered: false,
      highlighted: false,
      reactions: {
        heart: 0,
        fire: 0,
        thumbs: 0,
      },
    });

    await updateDoc(sessionRef, {
      questionCount: increment(1),
    });

  } catch (err) {
    console.error("submitQuestion failed:", err);
    throw err;
  }
}

/* ---------------- REALTIME ---------------- */

export function subscribeToSession(sessionId, callback) {
  const ref = doc(db, "sessions", sessionId);

  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

export function subscribeToQuestions(sessionId, callback) {
  const q = query(
    collection(db, "sessions", sessionId, "questions"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  });
}

/* ---------------- LECTURER ---------------- */

export async function markAnswered(sessionId, questionId) {
  const ref = doc(db, "sessions", sessionId, "questions", questionId);

  await updateDoc(ref, {
    answered: true,
    highlighted: false,
  });
}

export async function toggleHighlight(sessionId, questionId, current) {
  const ref = doc(db, "sessions", sessionId, "questions", questionId);

  await updateDoc(ref, {
    highlighted: !current,
  });
}

/* ---------------- REACTIONS ---------------- */

export async function addReaction(sessionId, questionId, type) {
  const ref = doc(db, "sessions", sessionId, "questions", questionId);

  await setDoc(ref, {
    reactions: {
      heart: 0,
      fire: 0,
      thumbs: 0,
    },
  }, { merge: true });

  await updateDoc(ref, {
    [`reactions.${type}`]: increment(1),
  });
}

/**
 * Update the live transcript while lecturer is speaking.
 * Called every few seconds as speech recognition fires.
 */
export async function updateLiveTranscript(sessionId, questionId, transcript) {
  const ref = doc(db, 'sessions', sessionId, 'questions', questionId)
  await updateDoc(ref, {
    liveTranscript: transcript,
    isAnswering: true,
  })
}
/**
 * Remove a reaction from a question (unlike/undislike).
 * type is one of: 'heart' | 'fire' | 'thumbs'
 */
export async function removeReaction(sessionId, questionId, type) {
  const ref = doc(db, 'sessions', sessionId, 'questions', questionId)
  await updateDoc(ref, { [`reactions.${type}`]: increment(-1) })
}

/**
 * Finish the answer — save final transcript, mark answered,
 * clear the live answering state.
 */
export async function saveAnswer(sessionId, questionId, finalTranscript) {
  const ref = doc(db, 'sessions', sessionId, 'questions', questionId)
  await updateDoc(ref, {
    liveTranscript: finalTranscript,
    isAnswering: false,
    answered: true,
    highlighted: false,
  })
  // Decrement questionCount since it moved to answered
  const sessionRef = doc(db, 'sessions', sessionId)
  await updateDoc(sessionRef, { questionCount: increment(-1) })
}