/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    tabBackground: '#F9F9F9',
    headerBackground: '#F9F9F9',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    separator: '#bdbdbd',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    tabBackground: '#111111',
    headerBackground: '#111111',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    separator: '#525151',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
