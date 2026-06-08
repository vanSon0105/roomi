const fs = require('fs');
const path = require('path');

const avatarDirectory = path.resolve(__dirname, '..', '..', '..', 'frontend', 'assets', 'images', 'avatar');
const avatarPublicPrefix = '/assets/images/avatar/';

const ensureAvatarDirectory = async () => {
  await fs.promises.mkdir(avatarDirectory, { recursive: true });
};

const buildAvatarUrl = (filename) => `${avatarPublicPrefix}${filename}`;

const deleteLocalAvatar = async (avatarUrl) => {
  if (!avatarUrl) return;

  const normalized = avatarUrl.replace(/^\/+/, '');
  const expectedPrefix = avatarPublicPrefix.replace(/^\/+/, '');

  if (!normalized.startsWith(expectedPrefix)) return;

  const filename = path.basename(normalized);
  const targetPath = path.resolve(avatarDirectory, filename);

  if (!targetPath.startsWith(avatarDirectory)) return;

  await fs.promises.unlink(targetPath).catch((error) => {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  });
};

module.exports = {
  avatarDirectory,
  buildAvatarUrl,
  deleteLocalAvatar,
  ensureAvatarDirectory,
};
