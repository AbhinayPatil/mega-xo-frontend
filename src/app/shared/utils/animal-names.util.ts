export const ADJECTIVES = ['Blazing', 'Shadow', 'Crimson', 'Neon', 'Feral', 'Cosmic', 'Ancient', 'Silent', 'Raging', 'Thunder', 'Phantom', 'Iron', 'Void', 'Storm', 'Ember'];
export const ANIMALS = ['Falcon', 'Wolf', 'Jaguar', 'Serpent', 'Hawk', 'Bear', 'Tiger', 'Viper', 'Lynx', 'Raven', 'Cobra', 'Phoenix', 'Panther', 'Hydra', 'Mantis'];

export function generateAnimalName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}
