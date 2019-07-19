/** @format */

import React from "react";
import { Image } from "react-native";
import { Images, AppConfig, Config, Theme } from "@common";
import { AppLoading, Asset, Font } from "@expo";
import { Provider as PaperProvider } from "react-native-paper";
import { Provider } from "react-redux";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/es/integration/react";
import { WooWorker } from "api-ecommerce";
import store from "@store/configureStore";
import RootRouter from "./src/Router";
import "./ReactotronConfig";
import { getNotification } from "@app/Omni";
import OneSignal from "react-native-onesignal";

const persistor = persistStore(store);

function cacheFonts(fonts) {
  return fonts.map((font) => Font.loadAsync(font));
}

export default class App extends React.Component {
  state = { appIsReady: false };

  async componentWillMount() {
    const notification = await getNotification();
    // console.log('notification', notification)
    if (notification) {
      OneSignal.setLogLevel(7, 0);
      OneSignal.setRequiresUserPrivacyConsent(false);
      OneSignal.init(Config.OneSignal.appId, {
        kOSSettingsKeyAutoPrompt: true,
      });
    }
  }

  async componentWillUnmount() {
    const notification = await getNotification();
    // console.log(notification)
    if (notification) {
      OneSignal.removeEventListener("received", this.onReceived);
      OneSignal.removeEventListener("opened", this.onOpened);
      OneSignal.removeEventListener("ids", this.onIds);
    }
  }

  async componentDidMount() {
    const notification = await getNotification();
    // console.warn(['notification', notification])
    if (notification) {
      OneSignal.addEventListener("received", this.onReceived);
      OneSignal.addEventListener("opened", this.onOpened);
      OneSignal.addEventListener("ids", this.onIds);

      // expo
      registerForPushNotification();
      Notifications.addListener(this._handleNotification);
    }
    WooWorker.init({
      url: AppConfig.WooCommerce.url,
      consumerKey: AppConfig.WooCommerce.consumerKey,
      consumerSecret: AppConfig.WooCommerce.consumerSecret,
      wp_api: true,
      version: "wc/v2",
      queryStringAuth: true,
    });
  }

  onReceived = (notification) => {
    console.log(["Notification received: ", notification]);
  };

  onOpened = (openResult) => {
    console.log(["Message: ", openResult.notification.payload.body]);
    console.log(["Data: ", openResult.notification.payload.additionalData]);
    console.log(["isActive: ", openResult.notification.isAppInFocus]);
    console.log(["openResult: ", openResult]);
  };

  onIds = (device) => {
    console.log(["Device info: ", device]);
  };

  loadAssets = async () => {
    const fontAssets = cacheFonts([
      { OpenSans: require("@assets/fonts/OpenSans-Regular.ttf") },
      { Baloo: require("@assets/fonts/Baloo-Regular.ttf") },

      { Entypo: require("@expo/vector-icons/fonts/Entypo.ttf") },
      {
        "Material Icons": require("@expo/vector-icons/fonts/MaterialIcons.ttf"),
      },
      {
        MaterialCommunityIcons: require("@expo/vector-icons/fonts/MaterialCommunityIcons.ttf"),
      },
      {
        "Material Design Icons": require("@expo/vector-icons/fonts/MaterialCommunityIcons.ttf"),
      },
      { FontAwesome: require("@expo/vector-icons/fonts/FontAwesome.ttf") },
      {
        "simple-line-icons": require("@expo/vector-icons/fonts/SimpleLineIcons.ttf"),
      },
      { Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf") },
    ]);

    await Promise.all([...fontAssets]);
  };

  render() {
    if (!this.state.appIsReady) {
      return (
        <AppLoading
          startAsync={this.loadAssets}
          onFinish={() => this.setState({ appIsReady: true })}
        />
      );
    }

    return (
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <PaperProvider theme={Config.Theme.isDark ? Theme.dark : Theme.light}>
            <RootRouter />
          </PaperProvider>
        </PersistGate>
      </Provider>
    );
  }
}
