
/*
  PROTOGEN AI — 10,000 ROAST GENERATOR
  Creates roasts.json in this same folder.

  Run:
    node generate-roasts.js

  Internet and API keys are NOT required.
*/

const fs = require("fs");
const path = require("path");

const categories = {
  "Mama Jokes": {
    targets: [
      "Your mama's cooking",
      "Your mama's fashion sense",
      "Your mama's dance routine",
      "Your mama's storytelling",
      "Your mama's sense of direction",
      "Your mama's shopping strategy",
      "Your mama's alarm clock",
      "Your mama's garden",
      "Your mama's phone photography",
      "Your mama's karaoke performance",
      "Your mama's party plan",
      "Your mama's baking technique",
      "Your mama's football commentary",
      "Your mama's selfie collection",
      "Your mama's morning routine",
      "Your mama's handwriting",
      "Your mama's playlist",
      "Your mama's signature dance move",
      "Your mama's recipe book",
      "Your mama's dramatic entrance"
    ],
    setups: [
      "is so confusing that",
      "is so dramatic that",
      "is so unpredictable that",
      "is so ambitious that",
      "is so mysterious that",
      "is so complicated that",
      "is so legendary that",
      "is so chaotic that",
      "is so questionable that",
      "is so entertaining that"
    ],
    punchlines: [
      "even the smoke alarm asks for the recipe",
      "the neighbours have started requesting subtitles",
      "even the family dog needs an explanation",
      "the instruction manual has resigned",
      "the whole neighbourhood has become an audience",
      "even the calendar needs a warning",
      "the kitchen clock has requested annual leave",
      "the GPS has started giving emotional support",
      "the mirror has asked for a second opinion",
      "even autocorrect has stopped trying to help"
    ]
  },

  "Family Roasts": {
    targets: [
      "Your family group chat",
      "Your family road trip",
      "Your family game night",
      "Your family reunion",
      "Your family photo session",
      "Your family holiday plan",
      "Your family barbecue",
      "Your family dance competition",
      "Your family debate",
      "Your family movie night",
      "Your family schedule",
      "Your family budget meeting",
      "Your family cooking contest",
      "Your family WhatsApp group",
      "Your family talent show"
    ],
    setups: [
      "is so chaotic that",
      "is so dramatic that",
      "is so competitive that",
      "is so confusing that",
      "is so unpredictable that",
      "is so noisy that",
      "is so ambitious that",
      "is so disorganised that",
      "is so entertaining that",
      "is so legendary that"
    ],
    punchlines: [
      "even the group chat needs a moderator",
      "the calendar has requested a postponement",
      "the referee quit before the first round",
      "Google Maps suggested taking a different route",
      "the camera asked everyone to pose separately",
      "the neighbours already know every episode",
      "the snacks need their own security team",
      "even the remote control has left the room",
      "the planning meeting needs a planning meeting",
      "the family tree needs traffic lights"
    ]
  },

  "Personal Comebacks": {
    targets: [
      "Your excuse collection",
      "Your ego",
      "Your confidence",
      "Your argument",
      "Your comeback",
      "Your master plan",
      "Your dramatic entrance",
      "Your explanation",
      "Your prediction",
      "Your bragging routine",
      "Your time management",
      "Your dramatic reaction",
      "Your sense of direction",
      "Your storytelling",
      "Your decision-making"
    ],
    setups: [
      "is so confusing that",
      "is so dramatic that",
      "is so overconfident that",
      "is so complicated that",
      "is so unpredictable that",
      "is so questionable that",
      "is so ambitious that",
      "is so legendary that",
      "is so entertaining that",
      "is so mysterious that"
    ],
    punchlines: [
      "even your shadow has asked for clarification",
      "the evidence has quietly left the room",
      "the logic has taken an early lunch break",
      "the punchline arrived before the point",
      "the audience started buffering",
      "the facts requested legal representation",
      "the explanation needs an explanation",
      "the confidence is doing all the heavy lifting",
      "the conclusion has gone on holiday",
      "even the dictionary wants to sit this one out"
    ]
  },

  "Dad and Dad-Joke Banter": {
    targets: [
      "Your dad's jokes",
      "Your dad's dance routine",
      "Your dad's barbecue technique",
      "Your dad's sense of direction",
      "Your dad's playlist",
      "Your dad's DIY project",
      "Your dad's storytelling",
      "Your dad's fashion choice",
      "Your dad's phone skills",
      "Your dad's gardening technique"
    ],
    setups: [
      "is so old-school that",
      "is so confident that",
      "is so loud that",
      "is so ambitious that",
      "is so unpredictable that",
      "is so complicated that",
      "is so legendary that",
      "is so dramatic that",
      "is so experimental that",
      "is so committed that"
    ],
    punchlines: [
      "even the toolbox has requested a professional",
      "the neighbours already know the chorus",
      "the instructions have quietly disappeared",
      "the GPS has started directing everyone else",
      "the barbecue has requested a safety inspection",
      "the playlist has been grounded",
      "the lawn is considering moving house",
      "the punchline needs a pension",
      "the remote control has filed for independence",
      "the project has entered its third season"
    ]
  },

  "Sibling Roasts": {
    targets: [
      "Your brother's football performance",
      "Your sister's dramatic entrance",
      "Your sibling's excuse collection",
      "Your brother's dance routine",
      "Your sister's selfie collection",
      "Your sibling's gaming performance",
      "Your brother's fashion choice",
      "Your sister's storytelling",
      "Your sibling's room organisation",
      "Your brother's singing performance"
    ],
    setups: [
      "is so unpredictable that",
      "is so dramatic that",
      "is so ambitious that",
      "is so chaotic that",
      "is so questionable that",
      "is so entertaining that",
      "is so confident that",
      "is so confusing that",
      "is so creative that",
      "is so legendary that"
    ],
    punchlines: [
      "even the family dog has notes",
      "the replay system has requested privacy",
      "the mirror needs a recovery day",
      "the referee brought snacks for the delay",
      "the neighbours recognise the performance by sound alone",
      "the controller has requested reassignment",
      "the wardrobe has called a family meeting",
      "the story needs a map and three translators",
      "the bedroom door has filed a complaint",
      "the microphone has switched itself off"
    ]
  },

  "Ego and Confidence": {
    targets: [
      "Your ego",
      "Your self-confidence",
      "Your victory speech",
      "Your dramatic entrance",
      "Your big plan",
      "Your personal brand",
      "Your bragging routine",
      "Your football prediction",
      "Your sense of importance",
      "Your celebrity behaviour"
    ],
    setups: [
      "is so enormous that",
      "is so confident that",
      "is so dramatic that",
      "is so ambitious that",
      "is so loud that",
      "is so theatrical that",
      "is so committed that",
      "is so optimistic that",
      "is so legendary that",
      "is so mysterious that"
    ],
    punchlines: [
      "it needs its own postcode",
      "the spotlight has requested a quieter setting",
      "the facts are still trying to catch up",
      "even the trophy has asked what happened",
      "the audience is still waiting for the achievement",
      "the entrance was bigger than the actual event",
      "the speech has more sequels than results",
      "the forecast says ninety percent chance of overconfidence",
      "the mirror is asking for equal billing",
      "the applause is still buffering"
    ]
  },

  "Friendship and Banter": {
    targets: [
      "Your group-chat timing",
      "Your ability to arrive on time",
      "Your storytelling",
      "Your advice",
      "Your party plan",
      "Your joke delivery",
      "Your playlist choice",
      "Your restaurant recommendation",
      "Your memory",
      "Your attempt to act mysterious",
      "Your ability to keep a straight face",
      "Your talent for changing the subject",
      "Your weekend plan",
      "Your reaction to simple news",
      "Your ability to choose a movie"
    ],
    setups: [
      "is so unpredictable that",
      "is so dramatic that",
      "is so confusing that",
      "is so ambitious that",
      "is so entertaining that"
    ],
    punchlines: [
      "the group chat needs a search function",
      "the clock has stopped waiting",
      "the story needs a director's cut",
      "the advice came with a warning label",
      "the guests brought their own event planner",
      "the punchline missed its appointment",
      "the speakers requested a different DJ",
      "the menu filed a formal objection",
      "even your calendar has forgotten",
      "the mystery solved itself out of boredom"
    ]
  },

  "Unbelievable Excuses": {
    targets: [
      "Your latest excuse",
      "Your excuse collection",
      "Your explanation for being late",
      "Your reason for avoiding homework",
      "Your story about losing your phone",
      "Your explanation for missing the meeting",
      "Your reason for losing the game",
      "Your story about forgetting the promise",
      "Your excuse for not replying",
      "Your reason for changing the plan",
      "Your explanation for the broken chair",
      "Your reason for missing breakfast",
      "Your excuse for not studying",
      "Your story about the missing money",
      "Your explanation for the strange noise"
    ],
    setups: [
      "is so creative that",
      "is so dramatic that",
      "is so complicated that",
      "is so unbelievable that",
      "is so entertaining that"
    ],
    punchlines: [
      "even a movie director wants the rights",
      "the truth has requested a microphone",
      "the calendar needs to check your story",
      "the evidence is laughing in the corner",
      "the explanation needs its own documentary",
      "even your alarm clock refuses to confirm it",
      "the detective has gone home for the day",
      "the plot has more twists than a drama series",
      "the witnesses are still comparing notes",
      "the story needs a second season"
    ]
  },

  "Other Savage Comebacks": {
    targets: [
      "Your football prediction",
      "Your penalty technique",
      "Your first touch",
      "Your gaming strategy",
      "Your exam strategy",
      "Your handwriting",
      "Your phone selfie",
      "Your fashion choice",
      "Your attempt at singing",
      "Your talent for making things complicated"
    ],
    setups: [
      "is so unpredictable that",
      "is so dramatic that",
      "is so confusing that",
      "is so ambitious that",
      "is so entertaining that"
    ],
    punchlines: [
      "even the ball is looking for a transfer",
      "the goalpost has requested a wider target",
      "the goalkeeper needs a map",
      "the controller has asked for a break",
      "even the textbook wants clarification",
      "the examiner has opened a support ticket",
      "the camera has requested a retake",
      "the wardrobe has asked for a second opinion",
      "the microphone has switched itself off",
      "the instruction manual has thrown in the towel"
    ]
  }
};

const roasts = [];

for (const [category, data] of Object.entries(categories)) {
  const expected = data.targets.length *
    data.setups.length *
    data.punchlines.length;

  console.log(`${category}: generating ${expected} roasts`);

  for (const target of data.targets) {
    for (const setup of data.setups) {
      for (const punchline of data.punchlines) {
        roasts.push({
          id: roasts.length + 1,
          category,
          text: `${target} ${setup} ${punchline}.`
        });
      }
    }
  }
}

// Ensure the collection contains exactly 10,000 unique text records.
const uniqueTexts = new Set(roasts.map(roast => roast.text));

if (roasts.length !== 10000) {
  throw new Error(`Expected 10,000 roasts, got ${roasts.length}.`);
}

if (uniqueTexts.size !== 10000) {
  throw new Error(`There are duplicate roasts: ${uniqueTexts.size} unique.`);
}

// Shuffle the collection so categories are mixed.
for (let i = roasts.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [roasts[i], roasts[j]] = [roasts[j], roasts[i]];
}

// Reassign IDs after shuffling.
roasts.forEach((roast, index) => {
  roast.id = index + 1;
});

const outputPath = path.join(__dirname, "roasts.json");

fs.writeFileSync(
  outputPath,
  JSON.stringify(roasts, null, 2),
  "utf8"
);

console.log("");
console.log("🔥 PROTOGEN SAVAGE MODE COLLECTION CREATED");
console.log(`Total roasts: ${roasts.length}`);
console.log(`Unique texts: ${uniqueTexts.size}`);
console.log(`Categories: ${Object.keys(categories).length}`);
console.log(`File: ${outputPath}`);
