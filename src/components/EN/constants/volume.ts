// src/constants/volumeLevels.ts
export const VOLUME_LEVELS = [
  { id: 1, name: 'A little' },
  { id: 2, name: 'Normal' },
  { id: 3, name: 'Enough' },
  { id: 4, name: 'A lot' },
] as const;

export type VolumeLevel = typeof VOLUME_LEVELS[number];
export type VolumeLevelId = VolumeLevel['id'];
export type VolumeLevelName = VolumeLevel['name'];

// Usage example:
// const myVolumeLevel: VolumeLevel = VOLUME_LEVELS[1];
// const myVolumeLevelId: VolumeLevelId = myVolumeLevel.id;
// const myVolumeLevelName: VolumeLevelName = myVolumeLevel.name;