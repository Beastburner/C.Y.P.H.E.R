module.exports = {
  dependencies: {
    // Let react-native-svg auto-link normally
    'react-native-qrcode-svg': {
      platforms: {
        android: null, // disable Android platform auto linking for qr-code-svg only
      },
    },
  },
  assets: ['./node_modules/react-native-vector-icons/Fonts/'],
};
