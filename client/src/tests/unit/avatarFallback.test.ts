import { describe, expect, it } from 'vitest';
import { getAvatarDisplayMode } from '../../utils/avatar';

describe('avatar display mode', () => {
  it('uses the uploaded image when one exists', () => {
    expect(getAvatarDisplayMode('https://cdn.example.com/user.png', 'Abir')).toEqual({
      mode: 'image',
      src: 'https://cdn.example.com/user.png',
      fallbackLabel: 'A',
    });
  });

  it('falls back to the default user icon when no image is uploaded', () => {
    expect(getAvatarDisplayMode('', 'Abir')).toEqual({
      mode: 'default',
      src: null,
      fallbackLabel: 'A',
    });
  });

  it('falls back to the default user icon when the image is blank or whitespace', () => {
    expect(getAvatarDisplayMode('   ', 'abir')).toEqual({
      mode: 'default',
      src: null,
      fallbackLabel: 'A',
    });
  });
});
