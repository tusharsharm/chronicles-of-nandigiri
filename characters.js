
// Character data with image support
const characterDatabase = {
  // Original fantasy characters
  'Auren Virel': {
    name: 'Auren Virel',
    class: 'Paladin',
    level: 1,
    hp: 120, maxHp: 120,
    mp: 40, maxMp: 40,
    attack: 15, defense: 12,
    exp: 0, expToNext: 100,
    gold: 100,
    inventory: ['Iron Sword', 'Health Potion', 'Health Potion', 'Health Potion', 'Leather Armor'],
    skills: ['Holy Strike', 'Heal'],
    image: 'assets/characters/auren_virel.jpg',
    description: 'A noble paladin devoted to justice and light'
  },
  'Kael Orynn': {
    name: 'Kael Orynn',
    class: 'Mage',
    level: 1,
    hp: 80, maxHp: 80,
    mp: 100, maxMp: 100,
    attack: 8, defense: 6,
    exp: 0, expToNext: 100,
    gold: 100,
    inventory: ['Magic Staff', 'Mana Potion', 'Mana Potion', 'Health Potion', 'Cloth Robes'],
    skills: ['Fireball', 'Ice Shard'],
    image: 'assets/characters/kael_orynn.jpg',
    description: 'A powerful mage wielding arcane mysteries'
  },
  'Thorne Blackroot': {
    name: 'Thorne Blackroot',
    class: 'Rogue',
    level: 1,
    hp: 90, maxHp: 90,
    mp: 60, maxMp: 60,
    attack: 18, defense: 8,
    exp: 0, expToNext: 100,
    gold: 150,
    inventory: ['Steel Dagger', 'Poison Vial', 'Health Potion', 'Health Potion', 'Leather Armor'],
    skills: ['Backstab', 'Stealth'],
    image: 'assets/characters/thorne_blackroot.jpg',
    description: 'A cunning rogue who strikes from the shadows'
  },
  'Brimor the Bold': {
    name: 'Brimor the Bold',
    class: 'Warrior',
    level: 1,
    hp: 140, maxHp: 140,
    mp: 30, maxMp: 30,
    attack: 20, defense: 15,
    exp: 0, expToNext: 100,
    gold: 80,
    inventory: ['Battle Axe', 'Health Potion', 'Health Potion', 'Health Potion', 'Chain Mail'],
    skills: ['Rage', 'Shield Bash'],
    image: 'assets/characters/brimor_bold.jpg',
    description: 'A fearless warrior charging into battle'
  },
  'Sylvahn Daro': {
    name: 'Sylvahn Daro',
    class: 'Ranger',
    level: 1,
    hp: 100, maxHp: 100,
    mp: 70, maxMp: 70,
    attack: 14, defense: 10,
    exp: 0, expToNext: 100,
    gold: 120,
    inventory: ['Elven Bow', 'Healing Herb', 'Healing Herb', 'Healing Herb', 'Leather Armor'],
    skills: ['Arrow Shot', 'Nature\'s Blessing'],
    image: 'assets/characters/sylvahn_daro.jpg',
    description: 'A nature-bound ranger with keen senses'
  },
  
  // Placeholder slots for your custom characters
  'Custom Character 1': {
    name: 'Custom Character 1',
    class: 'Custom Class',
    level: 1,
    hp: 100, maxHp: 100,
    mp: 50, maxMp: 50,
    attack: 12, defense: 10,
    exp: 0, expToNext: 100,
    gold: 100,
    inventory: ['Basic Weapon', 'Health Potion', 'Health Potion'],
    skills: ['Special Attack', 'Unique Skill'],
    image: 'assets/characters/custom_1.jpg', // Your first image
    description: 'Your custom character awaits adventure'
  },
  'Custom Character 2': {
    name: 'Custom Character 2',
    class: 'Custom Class',
    level: 1,
    hp: 110, maxHp: 110,
    mp: 60, maxMp: 60,
    attack: 14, defense: 8,
    exp: 0, expToNext: 100,
    gold: 120,
    inventory: ['Special Weapon', 'Health Potion', 'Mana Potion'],
    skills: ['Power Strike', 'Magic Boost'],
    image: 'assets/characters/custom_2.jpg', // Your second image
    description: 'Another unique character for your adventures'
  },
  'Custom Character 3': {
    name: 'Custom Character 3',
    class: 'Custom Class',
    level: 1,
    hp: 95, maxHp: 95,
    mp: 80, maxMp: 80,
    attack: 10, defense: 12,
    exp: 0, expToNext: 100,
    gold: 150,
    inventory: ['Magic Item', 'Health Potion', 'Special Potion'],
    skills: ['Mystic Power', 'Shield Wall'],
    image: 'assets/characters/custom_3.jpg', // Your third image
    description: 'A mysterious character with hidden powers'
  },
  'Custom Character 4': {
    name: 'Custom Character 4',
    class: 'Custom Class',
    level: 1,
    hp: 120, maxHp: 120,
    mp: 40, maxMp: 40,
    attack: 16, defense: 14,
    exp: 0, expToNext: 100,
    gold: 90,
    inventory: ['Heavy Weapon', 'Health Potion', 'Armor Piece'],
    skills: ['Crushing Blow', 'Defensive Stance'],
    image: 'assets/characters/custom_4.jpg', // Your fourth image
    description: 'A powerful character ready for battle'
  },
  'Custom Character 5': {
    name: 'Custom Character 5',
    class: 'Custom Class',
    level: 1,
    hp: 105, maxHp: 105,
    mp: 65, maxMp: 65,
    attack: 13, defense: 11,
    exp: 0, expToNext: 100,
    gold: 110,
    inventory: ['Balanced Weapon', 'Health Potion', 'Utility Item'],
    skills: ['Balanced Strike', 'Adaptive Defense'],
    image: 'assets/characters/custom_5.jpg', // Your fifth image
    description: 'A versatile character for any situation'
  }
};

// Function to get character by name
function getCharacterData(name) {
  return characterDatabase[name] ? { ...characterDatabase[name] } : null;
}

// Function to get all available characters
function getAllCharacters() {
  return Object.keys(characterDatabase);
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { characterDatabase, getCharacterData, getAllCharacters };
}
