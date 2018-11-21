const config = {
  default: {
    client_id: '96866c08c9ff4e97966962e1ebd3037a',
    client_secret: '6b93abe9f04b43019eff6b95549bc391',
    redirect_uri: 'http://24.143.103.132/callback',
    scope: 'user-read-private user-read-email user-read-playback-state',
    state_key: 'SPOTIFY_VISUALIZER_AUTH_ID'
  },

  production: {
    client_id: '96866c08c9ff4e97966962e1ebd3037a',
    client_secret: '6b93abe9f04b43019eff6b95549bc391',
    redirect_uri: 'https://kaleidosync.herokuapp.com/callback',
    scope: 'user-read-private user-read-email user-read-playback-state',
    state_key: 'SPOTIFY_VISUALIZER_AUTH_ID'
  }
}

module.exports = config.default