// Data colours are assigned by meaning, not by chart. Gender hues are reserved.
export const palette = {
  gender: {Male:'#397b76', Female:'#80516b'},
  series:'#46505a', ink:'#29252e', paper:'#fffaf3', pale:'#eee8dc',
  missing:'#e4ded2', residual:'#a39a8b', rule:'#c9c0b5',
  magnitude:['#fff1cc','#e5be62','#b78324','#6e450e'],
  change:{Total:'#46505a', Increase:'#b54432', Decrease:'#6f7a32'},
  beverage:{Beer:'#c99b35', Wine:'#87583d', 'Spirits & RTDs':'#5e6c7a', Cider:'#b7a98b'},
  pattern:{'No alcohol':'#fffaf3', 'Neither threshold':'#d5d1c8',
    'Episodic only':'#c99b35', 'Weekly only':'#5e6c7a', 'Both thresholds':'#b54432'},
};
export const genderScale = (plural = false) => ({
  domain:plural ? ['Males','Females'] : ['Male','Female'],
  range:[palette.gender.Male,palette.gender.Female],
});
export const categoryScale = meanings => ({domain:Object.keys(meanings),range:Object.values(meanings)});
