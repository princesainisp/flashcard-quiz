// Flashcards Quiz App with multiple decks, theme toggle, timer, and persistence

const DECKS = {
  ml: {
    title: "Machine Learning Basics",
    cards: [
      {
        question: "What is supervised learning?",
        answer: "Learning from labeled data.",
      },
      {
        question: "What is unsupervised learning?",
        answer: "Finding patterns in unlabeled data.",
      },
      {
        question: "What is a model?",
        answer: "A function mapping inputs to outputs.",
      },
      {
        question: "What is overfitting?",
        answer: "Memorizing training data instead of generalizing.",
      },
      {
        question: "What is underfitting?",
        answer: "Being too simple to learn important patterns.",
      },
      {
        question: "What is a feature?",
        answer: "An input variable used for making predictions.",
      },
      {
        question: "What is a label?",
        answer: "The target output.",
      },
      {
        question: "What is gradient descent?",
        answer: "Loss-minimizing optimization.",
      },
      {
        question: "What is a neural network?",
        answer: "Interconnected layers of neurons.",
      },
      {
        question: "What is classification?",
        answer: "Predicting categories.",
      },
    ],
  },
  python: {
    title: "Python Fundamentals",
    cards: [
      {
        question: "What is PEP 8?",
        answer: "Python's style guide.",
      },
      {
        question: "What is a list?",
        answer: "An ordered, mutable collection.",
      },
      {
        question: "What keyword defines a function?",
        answer: "`def`.",
      },
      {
        question: "What is a dictionary?",
        answer: "Key-value mapping.",
      },
      {
        question: "What does `len()` return?",
        answer: "Number of items in a container.",
      },
      {
        question: "What is slicing?",
        answer: "Selecting subsections of sequences.",
      },
      {
        question: "What are list comprehensions?",
        answer: "Concise list-building syntax.",
      },
      {
        question: "What does `None` represent?",
        answer: "Absence of a value.",
      },
      {
        question: "What is a virtual environment?",
        answer: "Isolated Python environment.",
      },
      {
        question: "What module handles dates?",
        answer: "`datetime`.",
      },
    ],
  },
  sql: {
    title: "SQL Essentials",
    cards: [
      {
        question: "What does SELECT do?",
        answer: "Retrieves columns from tables.",
      },
      {
        question: "What is a primary key?",
        answer: "Uniquely identifies a row.",
      },
      {
        question: "What clause filters rows?",
        answer: "`WHERE`.",
      },
      {
        question: "What clause groups rows?",
        answer: "`GROUP BY`.",
      },
      {
        question: "What operator matches patterns?",
        answer: "`LIKE`.",
      },
      {
        question: "What does JOIN do?",
        answer: "Combines rows from tables.",
      },
      {
        question: "How do you sort results?",
        answer: "Use `ORDER BY`.",
      },
      {
        question: "What is normalization?",
        answer: "Organizing data to reduce redundancy.",
      },
      {
        question: "What is a foreign key?",
        answer: "References a primary key in another table.",
      },
      {
        question: "What command inserts data?",
        answer: "`INSERT INTO`.",
      },
    ],
  },
  math: {
    title: "Math Refresher",
    cards: [
      {
        question: "What is the derivative of x²?",
        answer: "2x.",
      },
      {
        question: "Define a vector.",
        answer: "A quantity with magnitude and direction.",
      },
      {
        question: "What is π approximately?",
        answer: "3.14159.",
      },
      {
        question: "What is the Pythagorean theorem?",
        answer: "a² + b² = c².",
      },
      {
        question: "What is a matrix?",
        answer: "Rectangular array of numbers.",
      },
      {
        question: "What is an integral?",
        answer: "Area under a curve.",
      },
      {
        question: "What is factorial 5?",
        answer: "120.",
      },
      {
        question: "What is a prime number?",
        answer: "Integer >1 divisible only by 1 and itself.",
      },
      {
        question: "What is logarithm base 10 of 100?",
        answer: "2.",
      },
      {
        question: "What is standard deviation?",
        answer: "Measure of spread from mean.",
      },
    ],
  },
};

const STORAGE_KEY = "flashcards_app_state_v1";
const DEFAULT_THEME = "dark";
const TIMER_DURATION = 30; // seconds

// DOM elements
const cardElement = document.getElementById("flashcard");
const questionEl = document.getElementById("cardQuestion");
const answerEl = document.getElementById("cardAnswer");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const toggleAnswerBtn = document.getElementById("toggleAnswerBtn");
const knewBtn = document.getElementById("knewBtn");
const didntKnowBtn = document.getElementById("didntKnowBtn");
const correctCountEl = document.getElementById("correctCount");
const totalCountEl = document.getElementById("totalCount");
const scoreDisplay = document.getElementById("scoreDisplay");
const currentIndexEl = document.getElementById("currentIndex");
const totalCardsEl = document.getElementById("totalCards");
const finalScoreEl = document.getElementById("finalScore");
const deckSelect = document.getElementById("deckSelect");
const progressBar = document.getElementById("progressBar");
const timerDisplay = document.getElementById("timerDisplay");
const timerResetBtn = document.getElementById("timerResetBtn");
const themeToggleBtn = document.getElementById("themeToggle");
const titleHeading = document.querySelector(".title-group h1");

let state = loadState();
let currentDeckKey = validateDeckKey(state.currentDeck) ? state.currentDeck : "ml";
let deckState = ensureDeckState(currentDeckKey);
let timerInterval = null;
let timeRemaining = TIMER_DURATION;
let scoreDeltaTimeout = null;

function init() {
  populateDeckSelect();
  applyTheme(state.theme || DEFAULT_THEME);
  setDeck(currentDeckKey);
  attachEvents();
}

function populateDeckSelect() {
  deckSelect.innerHTML = "";
  Object.entries(DECKS).forEach(([key, deck]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = deck.title;
    deckSelect.appendChild(option);
  });
}

function validateDeckKey(key) {
  return Boolean(key && Object.prototype.hasOwnProperty.call(DECKS, key));
}

function ensureDeckState(deckKey) {
  if (!state.decks) state.decks = {};
  const deck = DECKS[deckKey];
  const maxIndex = deck.cards.length - 1;
  const existing = state.decks[deckKey];
  if (existing) {
    existing.currentIndex = Math.min(existing.currentIndex ?? 0, maxIndex);
    existing.cardStatuses = normalizeStatuses(existing.cardStatuses, deck.cards.length);
    return existing;
  }

  const initialState = {
    currentIndex: 0,
    cardStatuses: Array(deck.cards.length).fill(null),
  };
  state.decks[deckKey] = initialState;
  return initialState;
}

function normalizeStatuses(statuses = [], size) {
  const normalized = Array(size).fill(null);
  for (let i = 0; i < Math.min(statuses.length, size); i += 1) {
    normalized[i] = statuses[i];
  }
  return normalized;
}

function setDeck(deckKey) {
  currentDeckKey = deckKey;
  deckSelect.value = deckKey;
  deckState = ensureDeckState(deckKey);
  const deck = DECKS[deckKey];

  titleHeading.textContent = deck.title;
  document.title = `${deck.title} - Flashcards`;
  totalCardsEl.textContent = String(deck.cards.length);
  updateCard();
  updateScore();
  updateNavButtons();
  updateProgressBar();
  updateFinalScore();
  clearScoreDelta();
  restartTimer();
  saveState();
}

function updateCard() {
  const deck = DECKS[currentDeckKey];
  const card = deck.cards[deckState.currentIndex];
  questionEl.textContent = card.question;
  answerEl.textContent = card.answer;
  currentIndexEl.textContent = String(deckState.currentIndex + 1);
  currentIndexEl.dataset.deck = currentDeckKey;

  setCardFlipped(false);
  timerDisplay.classList.remove("expired");
}

function updateScore() {
  const statuses = deckState.cardStatuses;
  const answered = statuses.filter(Boolean);
  const correct = answered.filter((status) => status === "correct");

  correctCountEl.textContent = String(correct.length);
  totalCountEl.textContent = String(answered.length);

  if (answered.length > 0) {
    const pct = Math.round((correct.length / answered.length) * 100);
    scoreDisplay.title = `You have ${pct}% accuracy on this deck.`;
  } else {
    scoreDisplay.title = "No cards answered yet.";
  }
}

function updateNavButtons() {
  const deck = DECKS[currentDeckKey];
  prevBtn.disabled = deckState.currentIndex === 0;
  nextBtn.disabled = deckState.currentIndex === deck.cards.length - 1;
}

function updateProgressBar() {
  const deck = DECKS[currentDeckKey];
  const answeredCount = deckState.cardStatuses.filter(Boolean).length;
  const progress = (answeredCount / deck.cards.length) * 100;
  progressBar.style.width = `${progress}%`;
  progressBar.setAttribute("aria-valuenow", String(Math.round(progress)));
  progressBar.setAttribute(
    "aria-valuetext",
    `${answeredCount} of ${deck.cards.length} cards answered`
  );
}

function updateFinalScore() {
  const deck = DECKS[currentDeckKey];
  const statuses = deckState.cardStatuses;
  const answeredCount = statuses.filter(Boolean).length;
  const correctCount = statuses.filter((status) => status === "correct").length;

  if (answeredCount === deck.cards.length) {
    finalScoreEl.textContent = `Deck complete! Final score: ${correctCount} / ${deck.cards.length} correct.`;
    finalScoreEl.classList.add("complete");
  } else {
    finalScoreEl.textContent = `Answer ${deck.cards.length - answeredCount} more card(s) to finish the deck.`;
    finalScoreEl.classList.remove("complete");
  }
}

function showNextCard() {
  const deck = DECKS[currentDeckKey];
  if (deckState.currentIndex < deck.cards.length - 1) {
    deckState.currentIndex += 1;
    updateCard();
    updateNavButtons();
    restartTimer();
    saveState();
  }
}

function showPrevCard() {
  if (deckState.currentIndex > 0) {
    deckState.currentIndex -= 1;
    updateCard();
    updateNavButtons();
    restartTimer();
    saveState();
  }
}

function toggleAnswer(forceState) {
  const shouldShowAnswer =
    typeof forceState === "boolean"
      ? forceState
      : !cardElement.classList.contains("flipped");
  setCardFlipped(shouldShowAnswer);
}

function setCardFlipped(isFlipped) {
  cardElement.classList.toggle("flipped", isFlipped);
  toggleAnswerBtn.textContent = isFlipped ? "Show Question" : "Show Answer";
}

function handleAnswer(isCorrect) {
  const statuses = deckState.cardStatuses;
  const prevStatus = statuses[deckState.currentIndex];
  const nextStatus = isCorrect ? "correct" : "incorrect";

  if (prevStatus === nextStatus) {
    // Already recorded the same result; do nothing.
    return;
  }

  statuses[deckState.currentIndex] = nextStatus;
  updateScore();
  updateProgressBar();
  updateFinalScore();
  saveState();
  if (isCorrect) {
    showScoreDelta("+1");
  } else {
    showScoreDelta("");
  }
  autoAdvance();
}

function autoAdvance() {
  const deck = DECKS[currentDeckKey];
  if (deckState.currentIndex < deck.cards.length - 1) {
    showNextCard();
  } else {
    // Last card: reset timer indicator to avoid flashing
    clearInterval(timerInterval);
  }
}

function restartTimer() {
  clearInterval(timerInterval);
  timeRemaining = TIMER_DURATION;
  updateTimerDisplay();
  timerDisplay.classList.remove("expired");

  timerInterval = setInterval(() => {
    timeRemaining -= 1;
    updateTimerDisplay();
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timeRemaining = 0;
      updateTimerDisplay();
      timerDisplay.classList.add("expired");
      toggleAnswer(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = String(Math.floor(timeRemaining / 60)).padStart(2, "0");
  const seconds = String(timeRemaining % 60).padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function resetTimerManually() {
  restartTimer();
}

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  document.body.dataset.theme = nextTheme;
  themeToggleBtn.textContent = nextTheme === "light" ? "Use Dark Theme" : "Use Light Theme";
  state.theme = nextTheme;
  saveState();
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
}

function saveState() {
  state.currentDeck = currentDeckKey;
  state.decks[currentDeckKey] = deckState;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to save flashcard progress.", error);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { decks: {}, theme: DEFAULT_THEME };
  } catch (error) {
    console.warn("Unable to load flashcard progress.", error);
    return { decks: {}, theme: DEFAULT_THEME };
  }
}

function attachEvents() {
  nextBtn.addEventListener("click", showNextCard);
  prevBtn.addEventListener("click", showPrevCard);
  toggleAnswerBtn.addEventListener("click", () => toggleAnswer());
  knewBtn.addEventListener("click", () => handleAnswer(true));
  didntKnowBtn.addEventListener("click", () => handleAnswer(false));
  deckSelect.addEventListener("change", (event) => setDeck(event.target.value));
  timerResetBtn.addEventListener("click", resetTimerManually);
  themeToggleBtn.addEventListener("click", toggleTheme);

  cardElement.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    toggleAnswer();
  });

  window.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowRight":
        showNextCard();
        break;
      case "ArrowLeft":
        showPrevCard();
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        toggleAnswer();
        break;
      case "1":
        handleAnswer(true);
        break;
      case "2":
        handleAnswer(false);
        break;
      case "t":
      case "T":
        toggleTheme();
        break;
      default:
        break;
    }
  });
}

function showScoreDelta(label) {
  clearTimeout(scoreDeltaTimeout);
  if (!label) {
    clearScoreDelta();
    return;
  }
  scoreDisplay.dataset.delta = label;
  scoreDisplay.classList.add("show-delta");
  scoreDeltaTimeout = setTimeout(() => {
    clearScoreDelta();
  }, 900);
}

function clearScoreDelta() {
  scoreDisplay.classList.remove("show-delta");
  delete scoreDisplay.dataset.delta;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}



