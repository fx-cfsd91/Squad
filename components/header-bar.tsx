import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  iconBgColor?: string;
};

export const HEADER_HEIGHT = 56;

export default function HeaderBar({ title, left, right, backgroundColor = '#000', titleColor = '#fff', iconBgColor = '#18181b' }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = insets.top || (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44);
  const renderRight = () => {
    if (!right) return null;
    const children = React.Children.toArray(right as any);
    // If iconBgColor is explicitely transparent, render children inline
    if (iconBgColor === 'transparent' || iconBgColor === 'none') {
      return (
        <View style={styles.right}>
          {children.map((c, i) => (
            <React.Fragment key={i}>{c as any}</React.Fragment>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.right}>
        {children.map((c, i) => (
          <View key={i} style={[styles.iconBg, { backgroundColor: iconBgColor }]}>
            {c as any}
          </View>
        ))}
      </View>
    );
  };

  const renderLeft = () => {
    if (!left) return <View style={styles.left} />;
    return <View style={[styles.left, styles.iconBg, { backgroundColor: iconBgColor }]}>{left}</View>;
  };

  const isLight = backgroundColor === '#fff' || backgroundColor.toLowerCase() === '#ffffff' || backgroundColor === 'white';
  const headerStyle = [
    styles.header,
    {
      paddingTop: topInset,
      minHeight: HEADER_HEIGHT + topInset,
      paddingLeft: Math.max(12, insets.left + 12),
      paddingRight: Math.max(12, insets.right + 12),
      backgroundColor,
      borderBottomColor: isLight ? '#e5e7eb' : '#111',
    }
  ];

  return (
    <View style={headerStyle}>
      {renderLeft()}
      <Text style={[styles.title, { color: titleColor }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
      {renderRight()}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'left',
  },
  left: {
    width: 64,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  right: {
    minWidth: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  iconBg: {
    backgroundColor: '#18181b',
    padding: 6,
    borderRadius: 8,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
