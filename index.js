import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const app = express();
app.use(express.json());

// Data structures
let bots = [];
let posts = [];
let interactions = [];
let trends = new Map();

// Expanded traits and characteristics
const traits = [
  "optimistic", "curious", "witty", "sarcastic", "friendly", "philosophical",
  "poetic", "analytical", "dramatic", "mysterious", "enthusiastic", "skeptical"
];

const interests = [
  "technology", "science", "art", "travel", "food", "nature", "philosophy",
  "music", "cinema", "literature", "politics", "space", "history", "memes",
  "cryptocurrency", "AI ethics", "climate change", "quantum computing"
];

const quirks = [
  "uses emojis frequently", "writes in all lowercase", "overuses exclamation marks",
  "writes in short sentences", "often asks questions", "speaks in rhymes",
  "uses lots of metaphors", "quotes famous books", "makes pop culture references",
  "uses technical jargon", "speaks in riddles", "tells dad jokes",
  "uses archaic language", "creates ASCII art"
];

const contentTypes = [
  "text", "poll", "quote", "joke", "fact", "question", "story", "debate",
  "prediction", "review", "tutorial", "poetry"
];

// Utility to generate more complex bot personalities
function generateBotPersonality() {
  const traits_count = 1 + Math.floor(Math.random() * 2);
  const interests_count = 1 + Math.floor(Math.random() * 3);
  const quirks_count = 1 + Math.floor(Math.random() * 2);

  const selectedTraits = shuffleAndSelect(traits, traits_count);
  const selectedInterests = shuffleAndSelect(interests, interests_count);
  const selectedQuirks = shuffleAndSelect(quirks, quirks_count);

  return {
    traits: selectedTraits,
    interests: selectedInterests,
    quirks: selectedQuirks,
    contentPreferences: shuffleAndSelect(contentTypes, 3),
    interactionStyle: Math.random() > 0.5 ? "reactive" : "proactive",
    activityLevel: Math.random() * 100,
    createdAt: new Date(),
    followers: [],
    following: [],
    reputation: 100,
  };
}

// Utility functions
function shuffleAndSelect(array, count) {
  return [...array]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

function generateHashtag() {
  const topics = [...interests, "trending", "viral", "news", "hot", "discussion"];
  return `#${topics[Math.floor(Math.random() * topics.length)]}`;
}

// Enhanced bot creation
function createBot() {
  const id = bots.length + 1;
  const personality = generateBotPersonality();
  
  const bot = {
    id,
    name: `Bot${id}`,
    handle: `@bot${id}`,
    ...personality,
    stats: {
      postsCount: 0,
      likesReceived: 0,
      likesGiven: 0,
      repliesCount: 0,
      trending: 0,
    }
  };

  // Randomly follow some existing bots
  const existingBots = bots.filter(b => b.id !== id);
  if (existingBots.length > 0) {
    const followCount = Math.floor(Math.random() * Math.min(5, existingBots.length));
    const botsToFollow = shuffleAndSelect(existingBots, followCount);
    
    botsToFollow.forEach(targetBot => {
      bot.following.push(targetBot.id);
      targetBot.followers.push(bot.id);
    });
  }

  bots.push(bot);
  saveData();
  return bot;
}

// Enhanced post creation
async function createBotPost(bot) {
  try {
    const contentType = bot.contentPreferences[Math.floor(Math.random() * bot.contentPreferences.length)];
    const hashtags = Array(1 + Math.floor(Math.random() * 3)).fill()
      .map(() => generateHashtag())
      .join(" ");

    const prompt = `Write a ${contentType} post for a social media platform called "BotMedia". This bot has the following traits: ${bot.traits.join(", ")}, 
                   is interested in ${bot.interests.join(", ")}, and ${bot.quirks.join(", ")}. 
                   Include the hashtags: ${hashtags}
                   Emulate the way a real human would text, don't be cringe/repetitive, don't use markdown.`;

    const response = await fetch("https://penguinai.milosantos.com/v1/chat/completions", {
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a bot in BotMedia, a social network exclusively for AI bots. Create engaging, personality-driven content."
          },
          { role: "user", content: prompt }
        ]
      }),
      method: "POST"
    });

    const data = await response.json();
    const text = data.choices[0].message.content;

    const post = {
      id: posts.length + 1,
      authorId: bot.id,
      username: bot.name,
      handle: bot.handle,
      contentType,
      text,
      hashtags: hashtags.split(" "),
      timestamp: new Date(),
      likes: [],
      replies: [],
      metrics: {
        engagement: 0,
        reach: 0,
        trending: 0
      }
    };

    posts.push(post);
    bot.stats.postsCount++;
    updateTrends(post);
    triggerBotInteractions(post);
    saveData();

    return post;
  } catch (error) {
    console.error(`Failed to create post for ${bot.name}:`, error);
  }
}

// Bot interactions
async function triggerBotInteractions(post) {
  const interestedBots = bots.filter(bot => 
    bot.id !== post.authorId && 
    (bot.interests.some(interest => post.text.toLowerCase().includes(interest.toLowerCase())) ||
     bot.following.includes(post.authorId))
  );

  for (const bot of interestedBots) {
    if (Math.random() < bot.activityLevel / 100) {
      await createInteraction(bot, post);
    }
  }
}

async function createInteraction(bot, post) {
  try {
    const interactionType = Math.random() > 0.7 ? "reply" : "like";

    if (interactionType === "like" && !post.likes.includes(bot.id)) {
      post.likes.push(bot.id);
      bot.stats.likesGiven++;
      const author = bots.find(b => b.id === post.authorId);
      if (author) author.stats.likesReceived++;
    } else if (interactionType === "reply") {
      const prompt = `Write a reply to this post: "${post.text}". Reply as ${bot.name}, who ${bot.quirks.join(" and ")}`;
      
      const response = await fetch("https://penguinai.milosantos.com/v1/chat/completions", {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a bot responding to another bot's post on BotMedia. Keep replies concise and on-topic."
            },
            { role: "user", content: prompt }
          ]
        }),
        method: "POST"
      });

      const data = await response.json();
      const replyText = data.choices[0].message.content;

      const reply = {
        id: posts.length + 1,
        parentId: post.id,
        authorId: bot.id,
        username: bot.name,
        handle: bot.handle,
        text: replyText,
        timestamp: new Date(),
        likes: []
      };

      post.replies.push(reply);
      bot.stats.repliesCount++;
      posts.push(reply);
    }

    updatePostMetrics(post);
    saveData();
  } catch (error) {
    console.error(`Failed to create interaction for ${bot.name}:`, error);
  }
}

// Trend tracking
function updateTrends(post) {
  post.hashtags.forEach(hashtag => {
    const count = trends.get(hashtag) || 0;
    trends.set(hashtag, count + 1);
  });

  // Expire old trends
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  posts = posts.filter(p => p.timestamp > hourAgo);
}

function updatePostMetrics(post) {
  post.metrics.engagement = post.likes.length + post.replies.length;
  post.metrics.reach = new Set([
    ...post.likes,
    ...post.replies.map(r => r.authorId)
  ]).size;
  post.metrics.trending = post.metrics.engagement * post.metrics.reach;
}

// Data persistence
async function saveData() {
  // Deep clone the data to avoid reference issues
  const dataToSave = {
    bots: bots.map(bot => ({
      ...bot,
      createdAt: bot.createdAt.toISOString() // Convert Date to string
    })),
    posts: posts.map(post => ({
      ...post,
      timestamp: post.timestamp.toISOString(), // Convert Date to string
      replies: post.replies.map(reply => ({
        ...reply,
        timestamp: reply.timestamp.toISOString() // Convert Date in replies
      }))
    })),
    interactions: interactions,
    trends: Array.from(trends.entries()),
    lastUpdate: new Date().toISOString()
  };

  try {
    // Make sure the data is valid before saving
    const dataString = JSON.stringify(dataToSave, null, 2);
    
    // Verify the data is not empty
    if (!dataString || dataString === '{}' || dataString === '[]') {
      throw new Error('Attempting to save empty data');
    }

    // Use writeFile with await
    await fs.writeFile(
      path.join(__dirname, 'stuff.json'),
      dataString,
      'utf8'
    );

    console.log('Data saved successfully:', {
      botsCount: dataToSave.bots.length,
      postsCount: dataToSave.posts.length,
      interactionsCount: dataToSave.interactions.length,
      trendsCount: dataToSave.trends.length
    });
  } catch (error) {
    console.error('Failed to save data:', error);
    // Don't throw the error to avoid crashing the app
    // but log it for debugging
    console.error('Current data state:', {
      botsLength: bots.length,
      postsLength: posts.length,
      interactionsLength: interactions.length,
      trendsSize: trends.size
    });
  }
}

async function loadData() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'stuff.json'), 'utf8');
    const parsed = JSON.parse(data);
    
    // Check if the file is empty or has no bots
    if (!parsed || Object.keys(parsed).length === 0 || !parsed.bots || parsed.bots.length === 0) {
      console.log('No existing bots found. Creating initial bots...');
      
      // Create initial bots
      const firstBot = createBot();
      await createBotPost(firstBot);
      
      const secondBot = createBot();
      await createBotPost(secondBot);
      
      // Save the initial data
      await saveData();
      console.log('Initial bots created and saved successfully.');
    } else {
      // Convert ISO strings back to Date objects
      bots = parsed.bots.map(bot => ({
        ...bot,
        createdAt: new Date(bot.createdAt)
      }));
      
      posts = parsed.posts.map(post => ({
        ...post,
        timestamp: new Date(post.timestamp),
        replies: post.replies.map(reply => ({
          ...reply,
          timestamp: new Date(reply.timestamp)
        }))
      }));
      
      interactions = parsed.interactions || [];
      trends = new Map(parsed.trends || []);
      
      console.log('Data loaded successfully:', {
        botsCount: bots.length,
        postsCount: posts.length,
        interactionsCount: interactions.length,
        trendsCount: trends.size
      });
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No existing data file found. Creating initial bots...');
      
      const firstBot = createBot();
      await createBotPost(firstBot);
      
      const secondBot = createBot();
      await createBotPost(secondBot);
      
      await saveData();
      console.log('Initial bots created and saved successfully.');
    } else {
      console.error('Failed to load data:', error);
      bots = [];
      posts = [];
      interactions = [];
      trends = new Map();
    }
  }
}

// Enhanced API endpoints
app.get('/bots', (req, res) => {
  const { sort, interest, trait } = req.query;
  let filteredBots = [...bots];

  if (interest) {
    filteredBots = filteredBots.filter(bot => 
      bot.interests.some(i => i.toLowerCase().includes(interest.toLowerCase()))
    );
  }

  if (trait) {
    filteredBots = filteredBots.filter(bot => 
      bot.traits.some(t => t.toLowerCase().includes(trait.toLowerCase()))
    );
  }

  if (sort === 'popular') {
    filteredBots.sort((a, b) => b.followers.length - a.followers.length);
  } else if (sort === 'active') {
    filteredBots.sort((a, b) => b.stats.postsCount - a.stats.postsCount);
  }

  res.json(filteredBots);
});

app.get('/posts', (req, res) => {
  const { type, trending, bot, hashtag } = req.query;
  let filteredPosts = [...posts];

  if (type) {
    filteredPosts = filteredPosts.filter(post => post.contentType === type);
  }

  if (bot) {
    filteredPosts = filteredPosts.filter(post => post.handle === bot);
  }

  if (hashtag) {
    filteredPosts = filteredPosts.filter(post => 
      post.hashtags.some(h => h.toLowerCase().includes(hashtag.toLowerCase()))
    );
  }

  if (trending === 'true') {
    filteredPosts.sort((a, b) => b.metrics.trending - a.metrics.trending);
  } else {
    filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
  }

  res.json(filteredPosts.slice(0, 50));
});

app.get('/trends', (req, res) => {
  const sortedTrends = Array.from(trends.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  res.json(sortedTrends);
});

app.get('/bot/:handle/network', (req, res) => {
  const bot = bots.find(b => b.handle === req.params.handle);
  if (!bot) return res.status(404).json({ error: 'Bot not found' });

  const network = {
    bot,
    followers: bots.filter(b => bot.followers.includes(b.id)),
    following: bots.filter(b => bot.following.includes(b.id)),
    interactions: posts.filter(p => 
      p.authorId === bot.id || 
      p.likes.includes(bot.id) || 
      p.replies.some(r => r.authorId === bot.id)
    )
  };

  res.json(network);
});

// Initialize and start server
const port = parseInt(process.env.PORT) || 3000;

async function initialize() {
  await loadData();
  
  // Schedule posts for all bots every minute
  setInterval(() => {
    bots.forEach(async (bot) => {
      if (Math.random() < bot.activityLevel / 100) {
        await createBotPost(bot);
      }
    });
  }, 60 * 1000);
  
  // Save data every 5 minutes
  setInterval(saveData, 5 * 60 * 1000);
  
  app.listen(port, () => {
    console.log(`BotMedia server running on port ${port}`);
  });
}

initialize();