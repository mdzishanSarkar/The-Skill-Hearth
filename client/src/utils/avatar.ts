export function getAvatarDisplayMode(src?: string | null, name?: string | null) {
  const normalizedSource = src?.trim();
  const fallbackLabel = (name?.trim() || 'User').charAt(0).toUpperCase() || 'U';

  if (!normalizedSource) {
    return {
      mode: 'default' as const,
      src: null,
      fallbackLabel,
    };
  }

  return {
    mode: 'image' as const,
    src: normalizedSource,
    fallbackLabel,
  };
}
