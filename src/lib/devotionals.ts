// Pre-built devotional content bank
// Rotates daily based on day-of-year index
// Can be replaced with AI generation later

interface DevotionalContent {
  theme: string;
  scripture_ref: string;
  scripture_text: string;
  reflection: string;
  affirmation: string;
  prayer: string;
}

const devotionals: DevotionalContent[] = [
  {
    theme: 'Your Identity in Christ',
    scripture_ref: 'Song of Solomon 4:7',
    scripture_text: 'You are altogether beautiful, my darling; there is no flaw in you.',
    reflection: 'Before you can prepare for the love story God has written for you, you must first understand how deeply He already loves you. You are not waiting to be completed by someone else — you are already complete in Him. Today, let that truth settle deep in your heart.',
    affirmation: 'I am fearfully and wonderfully made. My worth is not determined by my relationship status but by the One who created me.',
    prayer: 'Lord, help me see myself the way You see me — beautiful, worthy, and deeply loved. Remove any lie that tells me I am not enough. In Jesus\' name, Amen.',
  },
  {
    theme: 'Trusting God\'s Timing',
    scripture_ref: 'Ecclesiastes 3:11',
    scripture_text: 'He has made everything beautiful in its time. He has also set eternity in the human heart.',
    reflection: 'Waiting can feel like God has forgotten you, but He is working in the unseen. Every season of waiting is a season of preparation. The woman you are becoming in this season is the woman your future husband needs.',
    affirmation: 'God\'s timing is perfect. My season of waiting is not wasted — it is sacred preparation.',
    prayer: 'Father, when the waiting feels long, remind me that You are faithful. Help me to trust Your timeline and not rush ahead of Your plans. Amen.',
  },
  {
    theme: 'Guarding Your Heart',
    scripture_ref: 'Proverbs 4:23',
    scripture_text: 'Above all else, guard your heart, for everything you do flows from it.',
    reflection: 'In a world that tells you to follow your heart, God says to guard it. This doesn\'t mean building walls — it means being intentional about who and what you give access to your emotions, your time, and your affection.',
    affirmation: 'I choose to protect my heart not out of fear, but out of wisdom. I am worth the wait.',
    prayer: 'God, give me discernment to know what to let in and what to let go. Strengthen me to set boundaries that honour You. Amen.',
  },
  {
    theme: 'The Virtuous Woman',
    scripture_ref: 'Proverbs 31:25-26',
    scripture_text: 'She is clothed with strength and dignity; she can laugh at the days to come. She speaks with wisdom, and faithful instruction is on her tongue.',
    reflection: 'The Proverbs 31 woman isn\'t a standard of perfection — she\'s an invitation to purpose. She is strong because she knows whose she is. She laughs at the future because she trusts the One who holds it.',
    affirmation: 'I am a woman of strength, dignity, and purpose. I walk in the calling God has placed on my life.',
    prayer: 'Lord, clothe me in Your strength and dignity. May my words carry wisdom and my life reflect Your faithfulness. Amen.',
  },
  {
    theme: 'Healing Before Love',
    scripture_ref: 'Psalm 147:3',
    scripture_text: 'He heals the brokenhearted and binds up their wounds.',
    reflection: 'You cannot pour from a broken vessel. Before God brings the right person into your life, He wants to heal the wounds that would sabotage that relationship. Let Him touch the places you\'ve been hiding.',
    affirmation: 'I give God permission to heal the broken places in my heart. I choose wholeness over hiding.',
    prayer: 'Father, I bring my hurts, my disappointments, and my past to You. Heal me completely so I can love freely when the time comes. Amen.',
  },
  {
    theme: 'Contentment in Singleness',
    scripture_ref: 'Philippians 4:11-12',
    scripture_text: 'I have learned to be content whatever the circumstances. I know what it is to be in need, and I know what it is to have plenty.',
    reflection: 'Contentment isn\'t about having everything you want — it\'s about trusting that God knows what you need. Your single season is not a waiting room; it is a throne room where you can grow closer to God than ever before.',
    affirmation: 'I am content in this season. My joy does not depend on a ring, but on the King.',
    prayer: 'Lord, teach me to find deep joy in this season. Help me not to just endure singleness but to thrive in it. Amen.',
  },
  {
    theme: 'Preparing for Covenant Love',
    scripture_ref: 'Ruth 3:11',
    scripture_text: 'And now, my daughter, don\'t be afraid. I will do for you all you ask. All the people of my town know that you are a woman of noble character.',
    reflection: 'Ruth didn\'t chase Boaz. She served faithfully, honoured her family, and trusted God\'s process. Her character spoke louder than any pursuit. Your character is your greatest preparation for marriage.',
    affirmation: 'I am preparing for covenant love by becoming a woman of noble character. My faithfulness in the small things matters.',
    prayer: 'God, shape my character for the covenant You\'re preparing me for. May I be known for my faithfulness, not just my faith. Amen.',
  },
  {
    theme: 'Forgiveness Frees You',
    scripture_ref: 'Colossians 3:13',
    scripture_text: 'Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.',
    reflection: 'Unforgiveness is a chain that keeps you locked to your past. Whether it\'s a failed relationship, a betrayal, or a broken promise — releasing it doesn\'t mean it was okay. It means you\'re choosing freedom over bitterness.',
    affirmation: 'I choose to forgive, not because they deserve it, but because I deserve peace.',
    prayer: 'Lord, I release every person who has hurt me. I choose to walk in forgiveness and freedom. Break every chain of bitterness in my life. Amen.',
  },
  {
    theme: 'God Sees You',
    scripture_ref: 'Genesis 16:13',
    scripture_text: 'She gave this name to the Lord who spoke to her: "You are the God who sees me."',
    reflection: 'Hagar was alone, pregnant, and in the wilderness. But God found her there. If you feel unseen today — in your struggles, in your loneliness, in your waiting — know that the God who saw Hagar sees you too.',
    affirmation: 'I am seen. I am known. I am not invisible to God. He knows exactly where I am.',
    prayer: 'El Roi, the God who sees me — thank You for never losing sight of me. Even when I feel invisible, You are with me. Amen.',
  },
  {
    theme: 'Walking in Purpose',
    scripture_ref: 'Jeremiah 29:11',
    scripture_text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
    reflection: 'Your purpose is not just marriage. God has plans for your career, your ministry, your community, your creativity. Chase your calling with everything you have — the right person will be drawn to a woman on fire for God.',
    affirmation: 'I have a purpose beyond marriage. I am called to make an impact, and I will not shrink back from my destiny.',
    prayer: 'Father, reveal the fullness of the purpose You\'ve placed inside me. Help me to pursue my calling with passion and boldness. Amen.',
  },
  {
    theme: 'Choosing Wisely',
    scripture_ref: '2 Corinthians 6:14',
    scripture_text: 'Do not be yoked together with unbelievers. For what do righteousness and wickedness have in common?',
    reflection: 'The person you marry will either draw you closer to God or pull you further away. This isn\'t about judgement — it\'s about alignment. You deserve a partner who shares your foundation, your values, and your faith.',
    affirmation: 'I will not settle for less than what God has prepared for me. I choose alignment over attraction alone.',
    prayer: 'God, give me the strength to wait for someone who loves You first. Protect me from settling out of loneliness. Amen.',
  },
  {
    theme: 'Strength in Sisterhood',
    scripture_ref: 'Ecclesiastes 4:9-10',
    scripture_text: 'Two are better than one, because they have a good return for their labour: if either of them falls down, one can help the other up.',
    reflection: 'God never intended for you to walk this journey alone. The sisters around you are not competition — they are companions. Invest in your friendships. Celebrate each other. Lift each other up.',
    affirmation: 'I am surrounded by sisters who strengthen me. I choose to celebrate others instead of comparing myself to them.',
    prayer: 'Lord, bless the women You\'ve placed in my life. Help us to be genuine, supportive, and loving towards one another. Amen.',
  },
  {
    theme: 'Surrendering Control',
    scripture_ref: 'Proverbs 3:5-6',
    scripture_text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
    reflection: 'You\'ve planned, prayed, and positioned yourself — but have you surrendered? True trust means letting go of the outcome. It means saying, "God, I want this, but I want Your will more."',
    affirmation: 'I surrender my plans, my timelines, and my expectations to God. His way is better than my way.',
    prayer: 'Father, I lay it all down — my desires, my fears, my timeline. I trust You completely. Lead me where You want me to go. Amen.',
  },
  {
    theme: 'You Are Not Behind',
    scripture_ref: 'Galatians 6:9',
    scripture_text: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
    reflection: 'Social media will tell you that everyone is getting married, having babies, and moving forward while you\'re standing still. But God\'s timeline is not measured by Instagram posts. You are not behind. You are on schedule.',
    affirmation: 'I am exactly where God needs me to be right now. I refuse to compare my journey to anyone else\'s.',
    prayer: 'Lord, silence the voice of comparison in my life. Help me to celebrate my own journey and trust that my harvest is coming. Amen.',
  },
];

export function getTodaysDevotional(): DevotionalContent {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return devotionals[dayOfYear % devotionals.length];
}

export function getDevotionalByDate(dateStr: string): DevotionalContent {
  const date = new Date(dateStr);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return devotionals[dayOfYear % devotionals.length];
}

// Point values for each action
export const POINT_VALUES: Record<string, { points: number; label: string }> = {
  daily_checkin: { points: 5, label: 'Daily check-in' },
  devotional_read: { points: 5, label: 'Read devotional' },
  post_created: { points: 10, label: 'Shared a post' },
  comment_added: { points: 3, label: 'Left a comment' },
  prayer_submitted: { points: 10, label: 'Submitted prayer' },
  prayer_response: { points: 5, label: 'Prayed for a sister' },
  testimony_shared: { points: 15, label: 'Shared testimony' },
  study_day_completed: { points: 10, label: 'Completed study day' },
  event_attended: { points: 20, label: 'Attended event' },
  streak_bonus: { points: 10, label: 'Streak bonus' },
};

// Rank titles based on total points
export function getRankTitle(points: number): string {
  if (points >= 1000) return 'Virtuous Woman';
  if (points >= 500) return 'Prayer Warrior';
  if (points >= 300) return 'Faithful Sister';
  if (points >= 150) return 'Growing in Grace';
  if (points >= 50) return 'Budding Rose';
  return 'New Blossom';
}

export const MOOD_OPTIONS: { value: string; emoji: string; label: string }[] = [
  { value: 'joyful', emoji: '😊', label: 'Joyful' },
  { value: 'peaceful', emoji: '🕊️', label: 'Peaceful' },
  { value: 'grateful', emoji: '🙏', label: 'Grateful' },
  { value: 'hopeful', emoji: '🌸', label: 'Hopeful' },
  { value: 'excited', emoji: '✨', label: 'Excited' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
  { value: 'struggling', emoji: '💔', label: 'Struggling' },
  { value: 'lonely', emoji: '🥀', label: 'Lonely' },
];
