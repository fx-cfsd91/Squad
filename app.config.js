// app.config.js
export default ({ config }) => ({
  expo: {
    name: "MonApp",
    slug: "MonApp",
    scheme: "squadfighter",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: { backgroundColor: "#000000" }
        }
      ],
      "expo-secure-store"
    ],

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.cfsd91.monapp",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },

    android: {
      package: "com.cfsd91.monapp",
      googleServicesFile: "./google-services.json",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      }
    },

    web: { output: "static", favicon: "./assets/images/favicon.png" },

    experiments: { typedRoutes: true, reactCompiler: true },

    extra: {
      router: {},
      eas: {
        projectId: "aeef1bcf-b560-4fd7-be8b-60c208df258a"
      }
    },

    cli: {
      appVersionSource: "remote"
    }
  }
});
