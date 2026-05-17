module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Reanimated: энэ plugin заавал **хамгийн сүүлд** байх ёстой (Expo Go / dev build хоёуланд ижил).
    plugins: ["react-native-reanimated/plugin"],
  };
};
