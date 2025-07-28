
# Adding Your Custom Character Images

## Steps to Add Your Character Images:

1. **Create the assets folder structure** (already done):
   ```
   assets/
   └── characters/
   ```

2. **Upload your images**:
   - Rename your 5 images to:
     - `custom_1.jpg` (for Custom Character 1)
     - `custom_2.jpg` (for Custom Character 2) 
     - `custom_3.jpg` (for Custom Character 3)
     - `custom_4.jpg` (for Custom Character 4)
     - `custom_5.jpg` (for Custom Character 5)
   
3. **Upload the images to the `assets/characters/` folder**

4. **Customize your characters**:
   - Edit `characters.js` to change:
     - Character names
     - Classes
     - Stats (HP, MP, Attack, Defense)
     - Starting inventory
     - Skills
     - Descriptions

## Image Requirements:
- Format: JPG, PNG, GIF
- Recommended size: 300x400 pixels or similar aspect ratio
- The images will be automatically resized to fit the character cards

## Example Character Customization:
```javascript
'My Hero': {
  name: 'My Hero',
  class: 'Super Fighter',
  level: 1,
  hp: 150, maxHp: 150,
  mp: 80, maxMp: 80,
  attack: 18, defense: 15,
  exp: 0, expToNext: 100,
  gold: 200,
  inventory: ['Legendary Sword', 'Super Potion', 'Magic Armor'],
  skills: ['Ultimate Strike', 'Power Boost'],
  image: 'assets/characters/custom_1.jpg',
  description: 'A legendary hero with incredible powers'
}
```

## For Netlify Deployment:
Make sure the `assets` folder is included when you deploy to Netlify. The folder structure should be maintained in your deployed app.
